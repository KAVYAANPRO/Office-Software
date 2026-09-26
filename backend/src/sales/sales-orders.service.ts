import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SalesOrder, SalesOrderDocument } from './schemas/sales-order.schema';
import { Customer, CustomerDocument } from '../master/schemas/customer.schema';
import { Design, DesignDocument } from '../design/schemas/design.schema';
import { DesignVariant, DesignVariantDocument } from '../design/schemas/design-variant.schema';
import { StockItemsService } from '../inventory/stock-items.service';
import { StockService } from '../inventory/stock.service';
import { NumberSeriesService } from '../common/services/number-series.service';
import { CompanySettingsService } from '../master/company-settings.service';
import { roundMoney, roundQty } from '../common/utils/decimal';
import {
  InvalidStateTransitionException,
  ProblemException,
} from '../common/errors/problem.exception';
import { castObjectIdFilter } from '../common/utils/cast-filter';
import { CreateSalesOrderDto } from './dto/sales-order.dto';

const OPEN_STATUSES = ['CONFIRMED', 'PARTIALLY_INVOICED'];

/** SAL-01 to SAL-03, RGS-04. Confirming a sales order never moves stock (Rule 6) - only the ATP check at confirm gates it. */
@Injectable()
export class SalesOrdersService {
  constructor(
    @InjectModel(SalesOrder.name) private readonly model: Model<SalesOrderDocument>,
    @InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Design.name) private readonly designModel: Model<DesignDocument>,
    @InjectModel(DesignVariant.name) private readonly variantModel: Model<DesignVariantDocument>,
    private readonly stockItemsService: StockItemsService,
    private readonly stockService: StockService,
    private readonly numberSeries: NumberSeriesService,
    private readonly companySettings: CompanySettingsService,
  ) {}

  list(filter: Record<string, unknown> = {}) {
    return this.model
      .find(castObjectIdFilter(filter, ['customerId']))
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(id: string) {
    const doc = await this.model.findById(id).lean();
    if (!doc) throw new ProblemException('NOT_FOUND', 404, 'Sales order not found.');
    return doc;
  }

  /** RGS-04: sellable on-hand minus qty still open (confirmed, not yet invoiced) on OTHER sales orders. */
  async getAtp(stockItemId: string, excludeOrderId?: string): Promise<number> {
    const [availability] = await this.stockService.availability([stockItemId]);
    const onHand = availability?.onHand ?? 0;

    const match: Record<string, unknown> = {
      status: { $in: OPEN_STATUSES },
      'lines.stockItemId': new Types.ObjectId(stockItemId),
    };
    if (excludeOrderId) match._id = { $ne: new Types.ObjectId(excludeOrderId) };

    const orders = await this.model.find(match).lean();
    let reserved = 0;
    for (const order of orders) {
      for (const line of order.lines) {
        if (String(line.stockItemId) === stockItemId) {
          reserved += Math.max(0, line.qty - line.qtyInvoiced);
        }
      }
    }
    return roundQty(onHand - reserved);
  }

  async create(dto: CreateSalesOrderDto, actorId: string): Promise<SalesOrderDocument> {
    const customer = await this.customerModel.findById(dto.customerId).lean();
    if (!customer) throw new ProblemException('NOT_FOUND', 404, 'Customer not found.');

    const settings = await this.companySettings.get();
    const fy = settings?.currentFinancialYear ?? new Date().getFullYear().toString();
    await this.numberSeries.ensureSeries('SALES_ORDER', fy, 'SO');
    const docNo = await this.numberSeries.next('SALES_ORDER', fy);

    const lines = [];
    for (const l of dto.lines) {
      const variant = await this.variantModel.findById(l.designVariantId).lean();
      if (!variant)
        throw new ProblemException(
          'NOT_FOUND',
          404,
          `Design variant ${l.designVariantId} not found.`,
        );
      const design = await this.designModel.findById(variant.designId).lean();
      if (!design)
        throw new ProblemException('NOT_FOUND', 404, 'Design not found for this variant.');

      const stockItem = await this.stockItemsService.getOrCreateForDesignVariant(l.designVariantId);

      // SAL-03: rate defaults from the design, the customer's default discount applies automatically.
      const unitRate = l.unitRate ?? design.defaultSellingRate;
      if (unitRate === undefined) {
        throw new ProblemException(
          'VALIDATION_FAILED',
          422,
          `Design ${design.designNo} has no default selling rate; a rate must be supplied.`,
        );
      }
      const discountPct = l.discountPct ?? customer.defaultDiscountPct ?? 0;

      lines.push({
        designVariantId: new Types.ObjectId(l.designVariantId),
        stockItemId: new Types.ObjectId(String((stockItem as any)._id)),
        qty: l.qty,
        qtyInvoiced: 0,
        unitRate,
        discountPct,
        extraDiscountAmt: l.extraDiscountAmt ?? 0,
      });
    }

    return this.model.create({
      docNo,
      docDate: new Date(),
      customerId: new Types.ObjectId(dto.customerId),
      lines,
      status: 'DRAFT',
      notes: dto.notes,
      createdBy: actorId,
      updatedBy: actorId,
    });
  }

  /** SAL-02: check ATP per line and reject with a clear shortfall message. */
  async confirm(id: string, actorId: string): Promise<SalesOrderDocument> {
    const order = await this.model.findById(id);
    if (!order) throw new ProblemException('NOT_FOUND', 404, 'Sales order not found.');
    if (order.status !== 'DRAFT') {
      throw new InvalidStateTransitionException(`Sales order is already ${order.status}.`);
    }

    const shortfalls: Array<{ stockItemId: string; requested: number; atp: number }> = [];
    for (const line of order.lines) {
      const atp = await this.getAtp(String(line.stockItemId));
      if (line.qty > atp + 0.0005) {
        shortfalls.push({ stockItemId: String(line.stockItemId), requested: line.qty, atp });
      }
    }
    if (shortfalls.length > 0) {
      throw new ProblemException(
        'INSUFFICIENT_STOCK',
        409,
        'One or more lines exceed available-to-promise stock.',
        undefined,
        { shortfalls },
      );
    }

    order.status = 'CONFIRMED';
    order.confirmedBy = actorId as any;
    order.confirmedAt = new Date();
    order.updatedBy = actorId as any;
    order.version += 1;
    await order.save();
    return order;
  }

  async cancel(id: string, reason: string, actorId: string): Promise<SalesOrderDocument> {
    const order = await this.model.findById(id);
    if (!order) throw new ProblemException('NOT_FOUND', 404, 'Sales order not found.');
    if (order.lines.some((l) => l.qtyInvoiced > 0)) {
      throw new InvalidStateTransitionException('Cannot cancel a sales order with invoiced lines.');
    }
    if (order.status === 'CANCELLED') {
      throw new InvalidStateTransitionException('Sales order is already cancelled.');
    }
    order.status = 'CANCELLED';
    order.cancelReason = reason;
    order.cancelledBy = actorId as any;
    order.cancelledAt = new Date();
    order.updatedBy = actorId as any;
    order.version += 1;
    await order.save();
    return order;
  }

  /** Called by InvoicesService inside its own transaction, after an invoice consumes some of an order's lines. */
  async applyInvoicedQty(
    salesOrderId: string,
    linesInvoiced: Array<{ salesOrderLineId: string; qty: number }>,
    session: import('mongoose').ClientSession,
  ): Promise<void> {
    const order = await this.model.findById(salesOrderId).session(session);
    if (!order) throw new ProblemException('NOT_FOUND', 404, 'Sales order not found.');

    for (const applied of linesInvoiced) {
      const line = order.lines.id(applied.salesOrderLineId);
      if (!line) continue;
      line.qtyInvoiced = roundQty(line.qtyInvoiced + applied.qty);
    }

    const allInvoiced = order.lines.every((l) => l.qtyInvoiced >= l.qty - 0.0005);
    const anyInvoiced = order.lines.some((l) => l.qtyInvoiced > 0.0005);
    order.status = allInvoiced ? 'INVOICED' : anyInvoiced ? 'PARTIALLY_INVOICED' : order.status;
    order.version += 1;
    await order.save({ session });
  }
}
