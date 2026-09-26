import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import {
  InvoiceLineAllocation,
  InvoiceLineAllocationDocument,
} from './schemas/invoice-line-allocation.schema';
import { SalesOrder, SalesOrderDocument } from './schemas/sales-order.schema';
import { Customer, CustomerDocument } from '../master/schemas/customer.schema';
import { Design, DesignDocument } from '../design/schemas/design.schema';
import { DesignVariant, DesignVariantDocument } from '../design/schemas/design-variant.schema';
import { TaxRule, TaxRuleDocument } from '../master/schemas/tax-rule.schema';
import { StockLocation, StockLocationDocument } from '../master/schemas/stock-location.schema';
import { StockItemsService } from '../inventory/stock-items.service';
import { StockService } from '../inventory/stock.service';
import { SalesOrdersService } from './sales-orders.service';
import { TransactionService } from '../common/services/transaction.service';
import { NumberSeriesService } from '../common/services/number-series.service';
import { CompanySettingsService } from '../master/company-settings.service';
import { computeInvoice, InvoiceLineInput, TaxRuleNotFoundError } from './pricing.util';
import { roundMoney, roundQty } from '../common/utils/decimal';
import {
  InvalidStateTransitionException,
  ProblemException,
} from '../common/errors/problem.exception';
import { castObjectIdFilter } from '../common/utils/cast-filter';
import { CreateInvoiceDto } from './dto/invoice.dto';

/** SAL-04 to SAL-09. The only writer of invoices; confirm() is the one-transaction flow from tech.md §8.2. */
@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private readonly model: Model<InvoiceDocument>,
    @InjectModel(InvoiceLineAllocation.name)
    private readonly allocationModel: Model<InvoiceLineAllocationDocument>,
    @InjectModel(SalesOrder.name) private readonly orderModel: Model<SalesOrderDocument>,
    @InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Design.name) private readonly designModel: Model<DesignDocument>,
    @InjectModel(DesignVariant.name) private readonly variantModel: Model<DesignVariantDocument>,
    @InjectModel(TaxRule.name) private readonly taxRuleModel: Model<TaxRuleDocument>,
    @InjectModel(StockLocation.name) private readonly locationModel: Model<StockLocationDocument>,
    private readonly stockItemsService: StockItemsService,
    private readonly stockService: StockService,
    private readonly salesOrdersService: SalesOrdersService,
    private readonly transactionService: TransactionService,
    private readonly numberSeries: NumberSeriesService,
    private readonly companySettings: CompanySettingsService,
  ) {}

  list(filter: Record<string, unknown> = {}) {
    return this.model
      .find(castObjectIdFilter(filter, ['customerId', 'salesOrderId']))
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(id: string) {
    const doc = await this.model.findById(id).lean();
    if (!doc) throw new ProblemException('NOT_FOUND', 404, 'Invoice not found.');
    return doc;
  }

  allocationsForLine(invoiceLineId: string) {
    return this.allocationModel.find({ invoiceLineId: new Types.ObjectId(invoiceLineId) }).lean();
  }

  /** prd.md §10 step 14: COGS from invoice_line_allocations (qty x lot unitCost at the time of sale), margin against taxable value. */
  async getMargin(invoiceId: string) {
    const invoice = await this.model.findById(invoiceId).lean();
    if (!invoice) throw new ProblemException('NOT_FOUND', 404, 'Invoice not found.');

    const allocations = await this.allocationModel.find({ invoiceId: invoice._id }).lean();
    const cogs = roundMoney(allocations.reduce((s, a) => s + a.qty * a.unitCost, 0));
    const margin = roundMoney(invoice.taxableTotal - cogs);
    const marginPct =
      invoice.taxableTotal > 0 ? roundMoney((margin / invoice.taxableTotal) * 100) : 0;

    return { invoiceId, cogs, taxableTotal: invoice.taxableTotal, margin, marginPct };
  }

  async create(dto: CreateInvoiceDto, actorId: string): Promise<InvoiceDocument> {
    const customer = await this.customerModel.findById(dto.customerId).lean();
    if (!customer) throw new ProblemException('NOT_FOUND', 404, 'Customer not found.');

    let order: SalesOrderDocument | null = null;
    if (dto.salesOrderId) {
      order = await this.orderModel.findById(dto.salesOrderId);
      if (!order) throw new ProblemException('NOT_FOUND', 404, 'Sales order not found.');
      if (!['CONFIRMED', 'PARTIALLY_INVOICED'].includes(order.status)) {
        throw new InvalidStateTransitionException(
          `Cannot invoice a sales order in status ${order.status}.`,
        );
      }
    }

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
      if (!design.hsn) {
        throw new ProblemException(
          'VALIDATION_FAILED',
          422,
          `Design ${design.designNo} has no HSN code configured.`,
        );
      }
      const stockItem = await this.stockItemsService.getOrCreateForDesignVariant(l.designVariantId);

      let salesOrderLineId: string | undefined;
      if (order) {
        if (!l.salesOrderLineId) {
          throw new ProblemException(
            'VALIDATION_FAILED',
            422,
            'Each line must reference a salesOrderLineId when invoicing from a sales order.',
          );
        }
        const orderLine = order.lines.id(l.salesOrderLineId);
        if (!orderLine)
          throw new ProblemException(
            'NOT_FOUND',
            404,
            `Sales order line ${l.salesOrderLineId} not found.`,
          );
        const remaining = roundQty(orderLine.qty - orderLine.qtyInvoiced);
        if (l.qty > remaining + 0.0005) {
          throw new ProblemException(
            'VALIDATION_FAILED',
            422,
            `Cannot invoice ${l.qty}: only ${remaining} remains on this order line.`,
          );
        }
        salesOrderLineId = String(orderLine._id);
      }

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
        salesOrderLineId: salesOrderLineId ? new Types.ObjectId(salesOrderLineId) : undefined,
        designVariantId: new Types.ObjectId(l.designVariantId),
        stockItemId: new Types.ObjectId(String((stockItem as any)._id)),
        hsn: design.hsn,
        qty: l.qty,
        unitRate,
        discountPct,
        extraDiscountAmt: l.extraDiscountAmt ?? 0,
        grossAmount: 0,
        discountAmount: 0,
        taxableValue: 0,
        taxRatePct: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        lineTotal: 0,
      });
    }

    const settings = await this.companySettings.get();

    return this.model.create({
      docNo: `DRAFT-${new Types.ObjectId().toHexString()}`,
      docDate: new Date(),
      customerId: new Types.ObjectId(dto.customerId),
      salesOrderId: dto.salesOrderId ? new Types.ObjectId(dto.salesOrderId) : undefined,
      lines,
      status: 'DRAFT',
      paymentStatus: 'UNPAID',
      customerNameSnapshot: customer.businessName || customer.name,
      customerAddressSnapshot: customer.billingAddress,
      customerGstinSnapshot: customer.gstin,
      placeOfSupply: customer.state,
      isIntraState: !!customer.state && customer.state === settings?.state,
      notes: dto.notes,
      createdBy: actorId,
      updatedBy: actorId,
    });
  }

  /** tech.md §8.2: FIFO-deduct, compute totals, snapshot, allocate the number last, all in one transaction. */
  async confirm(id: string, actorId: string): Promise<InvoiceDocument> {
    // Must run before the transaction opens: ensureSeries() has no session, and a transaction
    // reads under a snapshot taken before this call, so a series created inside the
    // transaction would not be visible to numberSeries.next(..., session) later in it.
    const settingsForSeries = await this.companySettings.get();
    if (settingsForSeries) {
      await this.numberSeries.ensureSeries(
        'INVOICE',
        settingsForSeries.currentFinancialYear,
        'INV',
      );
    }

    return this.transactionService.run(async (session) => {
      const invoice = await this.model.findById(id).session(session);
      if (!invoice) throw new ProblemException('NOT_FOUND', 404, 'Invoice not found.');
      if (invoice.status !== 'DRAFT') {
        throw new InvalidStateTransitionException(`Invoice is already ${invoice.status}.`);
      }

      const customer = await this.customerModel
        .findById(invoice.customerId)
        .session(session)
        .lean();
      if (!customer) throw new ProblemException('NOT_FOUND', 404, 'Customer not found.');
      const settings = await this.companySettings.get();
      if (!settings)
        throw new ProblemException(
          'VALIDATION_FAILED',
          500,
          'Company settings are not configured.',
        );

      // SAL-02/8.2 step 2: re-validate ATP excluding this invoice's own not-yet-posted lines
      // (they haven't moved stock yet, so nothing to exclude - the check is simply current ATP).
      for (const line of invoice.lines) {
        const [availability] = await this.stockService.availability([String(line.stockItemId)]);
        if (line.qty > (availability?.onHand ?? 0) + 0.0005) {
          throw new ProblemException(
            'INSUFFICIENT_STOCK',
            409,
            `Insufficient stock for line ${line._id}: requested ${line.qty}, on hand ${availability?.onHand ?? 0}.`,
          );
        }
      }

      invoice.docDate = new Date();

      const hsns = Array.from(new Set(invoice.lines.map((l) => l.hsn)));
      const taxRules = await this.taxRuleModel
        .find({ hsn: { $in: hsns } })
        .session(session)
        .lean();

      const pricingInput: {
        lines: InvoiceLineInput[];
        customer: { state?: string };
        company: { state: string };
        invoiceDate: Date;
        taxRules: any[];
      } = {
        lines: invoice.lines.map((l) => ({
          designVariantId: String(l.designVariantId),
          qty: l.qty,
          unitRate: l.unitRate,
          discountPct: l.discountPct,
          extraDiscountAmt: l.extraDiscountAmt,
          hsn: l.hsn,
        })),
        customer: { state: customer.state },
        company: { state: settings.state },
        invoiceDate: invoice.docDate,
        taxRules: taxRules.map((r) => ({
          hsn: r.hsn,
          valueBandMin: r.valueBandMin,
          valueBandMax: r.valueBandMax,
          ratePct: r.ratePct,
          validFrom: r.validFrom,
          validTo: r.validTo,
        })),
      };

      let computed;
      try {
        computed = computeInvoice(pricingInput);
      } catch (err) {
        if (err instanceof TaxRuleNotFoundError) {
          throw new ProblemException('VALIDATION_FAILED', 422, err.message);
        }
        throw err;
      }

      const warehouse = await this.locationModel
        .findOne({ code: 'MAIN-WH' })
        .session(session)
        .lean();
      const virtCustomer = await this.locationModel
        .findOne({ code: 'VIRT-CUSTOMER' })
        .session(session)
        .lean();
      if (!warehouse || !virtCustomer) {
        throw new ProblemException(
          'VALIDATION_FAILED',
          500,
          'Warehouse or customer virtual location is not seeded.',
        );
      }

      for (let i = 0; i < invoice.lines.length; i++) {
        const line = invoice.lines[i];
        const computedLine = computed.lines[i];
        line.grossAmount = computedLine.grossAmount;
        line.discountAmount = computedLine.discountAmount;
        line.taxableValue = computedLine.taxableValue;
        line.taxRatePct = computedLine.taxRatePct;
        line.cgst = computedLine.cgst;
        line.sgst = computedLine.sgst;
        line.igst = computedLine.igst;
        line.lineTotal = computedLine.lineTotal;

        const posted = await this.stockService.post(
          [
            {
              type: 'SALE',
              stockItemId: String(line.stockItemId),
              fromLocationId: String(warehouse._id),
              toLocationId: String(virtCustomer._id),
              qty: line.qty,
              doc: { type: 'INVOICE', id: String(invoice._id), lineId: String(line._id) },
            },
          ],
          session,
          actorId,
        );

        await this.allocationModel.create(
          posted.map((row) => ({
            invoiceId: invoice._id,
            invoiceLineId: line._id,
            lotId: new Types.ObjectId(row.lotId),
            qty: row.qty,
            unitCost: row.unitCost,
          })),
          { session },
        );
      }

      invoice.subtotal = computed.subtotal;
      invoice.discountTotal = computed.discountTotal;
      invoice.taxableTotal = computed.taxableTotal;
      invoice.cgstTotal = computed.cgstTotal;
      invoice.sgstTotal = computed.sgstTotal;
      invoice.igstTotal = computed.igstTotal;
      invoice.roundOff = computed.roundOff;
      invoice.grandTotal = computed.grandTotal;
      invoice.isIntraState = computed.isIntraState;

      if (invoice.salesOrderId) {
        await this.salesOrdersService.applyInvoicedQty(
          String(invoice.salesOrderId),
          invoice.lines
            .filter((l) => l.salesOrderLineId)
            .map((l) => ({ salesOrderLineId: String(l.salesOrderLineId), qty: l.qty })),
          session,
        );
      }

      const fy = settings.currentFinancialYear;
      invoice.docNo = await this.numberSeries.next('INVOICE', fy, session);

      invoice.status = 'CONFIRMED';
      invoice.confirmedBy = actorId as any;
      invoice.confirmedAt = new Date();
      invoice.updatedBy = actorId as any;
      invoice.version += 1;
      await invoice.save({ session });
      return invoice;
    });
  }

  /** SAL-08: reverses the SALE ledger rows and gives the invoiced qty back to the order; the number stays consumed. */
  async cancel(id: string, reason: string, actorId: string): Promise<InvoiceDocument> {
    return this.transactionService.run(async (session) => {
      const invoice = await this.model.findById(id).session(session);
      if (!invoice) throw new ProblemException('NOT_FOUND', 404, 'Invoice not found.');
      if (invoice.status !== 'CONFIRMED') {
        throw new InvalidStateTransitionException(
          `Only a confirmed invoice can be cancelled (current status: ${invoice.status}).`,
        );
      }
      if (invoice.paymentStatus !== 'UNPAID') {
        throw new ProblemException(
          'VALIDATION_FAILED',
          409,
          'Unallocate payments from this invoice before cancelling it.',
        );
      }

      await this.stockService.reverseDocument(
        'INVOICE',
        String(invoice._id),
        reason,
        session,
        actorId,
      );

      if (invoice.salesOrderId) {
        await this.reverseInvoicedQty(String(invoice.salesOrderId), invoice, session);
      }

      invoice.status = 'CANCELLED';
      invoice.cancelReason = reason;
      invoice.cancelledBy = actorId as any;
      invoice.cancelledAt = new Date();
      invoice.updatedBy = actorId as any;
      invoice.version += 1;
      await invoice.save({ session });
      return invoice;
    });
  }

  private async reverseInvoicedQty(
    salesOrderId: string,
    invoice: InvoiceDocument,
    session: ClientSession,
  ): Promise<void> {
    const order = await this.orderModel.findById(salesOrderId).session(session);
    if (!order) return;

    for (const line of invoice.lines) {
      if (!line.salesOrderLineId) continue;
      const orderLine = order.lines.id(String(line.salesOrderLineId));
      if (!orderLine) continue;
      orderLine.qtyInvoiced = roundQty(Math.max(0, orderLine.qtyInvoiced - line.qty));
    }

    const allInvoiced = order.lines.every((l) => l.qtyInvoiced >= l.qty - 0.0005);
    const anyInvoiced = order.lines.some((l) => l.qtyInvoiced > 0.0005);
    order.status = allInvoiced ? 'INVOICED' : anyInvoiced ? 'PARTIALLY_INVOICED' : 'CONFIRMED';
    order.version += 1;
    await order.save({ session });
  }
}
