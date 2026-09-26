import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Inward, InwardDocument, InwardLine } from './schemas/inward.schema';
import { Purchase, PurchaseDocument } from './schemas/purchase.schema';
import { MaterialVariant, MaterialVariantDocument } from '../master/schemas/material.schema';
import { StockLocation, StockLocationDocument } from '../master/schemas/stock-location.schema';
import { PurchasesService } from './purchases.service';
import { StockService } from '../inventory/stock.service';
import { StockItemsService } from '../inventory/stock-items.service';
import { UomsService } from '../master/uoms.service';
import { NumberSeriesService } from '../common/services/number-series.service';
import { CompanySettingsService } from '../master/company-settings.service';
import { TransactionService } from '../common/services/transaction.service';
import { roundQty } from '../common/utils/decimal';
import {
  InvalidStateTransitionException,
  OverReceiptToleranceExceededException,
  ProblemException,
} from '../common/errors/problem.exception';
import { CreateInwardDto } from './dto/inward.dto';

@Injectable()
export class InwardsService {
  constructor(
    @InjectModel(Inward.name) private readonly model: Model<InwardDocument>,
    @InjectModel(Purchase.name) private readonly purchaseModel: Model<PurchaseDocument>,
    @InjectModel(MaterialVariant.name)
    private readonly variantModel: Model<MaterialVariantDocument>,
    @InjectModel(StockLocation.name) private readonly locationModel: Model<StockLocationDocument>,
    private readonly purchasesService: PurchasesService,
    private readonly stockService: StockService,
    private readonly stockItemsService: StockItemsService,
    private readonly uomsService: UomsService,
    private readonly numberSeries: NumberSeriesService,
    private readonly companySettings: CompanySettingsService,
    private readonly transactionService: TransactionService,
  ) {}

  // Explicit cast for the same reason as StockItemsService.list(): plain-string filtering of
  // a non-_id ObjectId field is not reliably cast by Mongoose in this environment.
  list(filter: Record<string, unknown> = {}) {
    const castFilter = { ...filter };
    if (typeof castFilter.purchaseId === 'string') {
      castFilter.purchaseId = new Types.ObjectId(castFilter.purchaseId);
    }
    return this.model.find(castFilter).sort({ createdAt: -1 }).lean();
  }

  async findById(id: string) {
    const doc = await this.model.findById(id).lean();
    if (!doc) throw new ProblemException('NOT_FOUND', 404, 'Inward not found.');
    return doc;
  }

  async create(dto: CreateInwardDto, actorId: string): Promise<InwardDocument> {
    const purchase = await this.purchaseModel.findById(dto.purchaseId).lean();
    if (!purchase) throw new ProblemException('NOT_FOUND', 404, 'Purchase not found.');
    if (!['CONFIRMED', 'PARTIALLY_RECEIVED'].includes(purchase.status)) {
      throw new InvalidStateTransitionException(
        `Cannot inward against a purchase in status ${purchase.status}.`,
      );
    }

    const lines: InwardLine[] = [];
    for (const lineInput of dto.lines) {
      const purchaseLine = purchase.lines.find((l) => String(l._id) === lineInput.purchaseLineId);
      if (!purchaseLine) {
        throw new ProblemException(
          'VALIDATION_FAILED',
          422,
          `Purchase line ${lineInput.purchaseLineId} not found on this purchase.`,
        );
      }
      const variant = await this.variantModel.findById(purchaseLine.materialVariantId).lean();
      const qtyBase = await this.uomsService.toBaseQuantity(
        String(variant!.materialId),
        String(purchaseLine.uomId),
        lineInput.qty,
      );
      lines.push({
        purchaseLineId: new Types.ObjectId(String(purchaseLine._id)),
        materialVariantId: new Types.ObjectId(String(purchaseLine.materialVariantId)),
        qty: roundQty(lineInput.qty),
        qtyBase,
        lotNo: lineInput.lotNo,
      } as unknown as InwardLine);
    }

    const settings = await this.companySettings.get();
    const fy = settings?.currentFinancialYear ?? new Date().getFullYear().toString();
    await this.numberSeries.ensureSeries('INWARD', fy, 'INW');
    const docNo = await this.numberSeries.next('INWARD', fy);

    const [created] = await this.model.create([
      {
        docNo,
        docDate: new Date(),
        // Explicit casts: PurchasesService.cancel()'s inwardModel.exists({purchaseId: ...})
        // check depends on this field being a real ObjectId, not a string.
        purchaseId: new Types.ObjectId(dto.purchaseId),
        supplierId: new Types.ObjectId(String(purchase.supplierId)),
        locationId: new Types.ObjectId(dto.locationId),
        lines,
        remarks: dto.remarks,
        status: 'DRAFT',
        createdBy: actorId,
        updatedBy: actorId,
      },
    ]);
    return created;
  }

  /** INW-03: confirming puts material into stock as new lots carrying the purchase line's landed cost (BR-01). */
  async confirm(id: string, actorId: string): Promise<InwardDocument> {
    return this.transactionService.run(async (session) => {
      const inward = await this.model.findById(id).session(session);
      if (!inward) throw new ProblemException('NOT_FOUND', 404, 'Inward not found.');
      if (inward.status !== 'DRAFT') {
        throw new InvalidStateTransitionException(`Inward is already ${inward.status}.`);
      }

      const purchase = await this.purchaseModel.findById(inward.purchaseId).session(session);
      if (!purchase) throw new ProblemException('NOT_FOUND', 404, 'Purchase not found.');

      const settings = await this.companySettings.get();
      const tolerancePct = settings?.overReceiptTolerancePct ?? 0;

      const virtualSupplierLoc = await this.locationModel
        .findOne({ code: 'VIRT-SUPPLIER' })
        .session(session)
        .lean();
      if (!virtualSupplierLoc) {
        throw new ProblemException(
          'VALIDATION_FAILED',
          500,
          'VIRT-SUPPLIER location is not seeded.',
        );
      }

      for (const line of inward.lines) {
        const purchaseLine = purchase.lines.id(line.purchaseLineId);
        if (!purchaseLine) {
          throw new ProblemException(
            'VALIDATION_FAILED',
            422,
            `Purchase line ${line.purchaseLineId} no longer exists.`,
          );
        }
        const allowedMax = purchaseLine.qtyBase * (1 + tolerancePct / 100);
        const projected = purchaseLine.qtyReceivedBase + line.qtyBase;
        if (projected > allowedMax + 0.0005) {
          throw new OverReceiptToleranceExceededException(
            `Receiving ${line.qtyBase} would exceed the ordered quantity (${purchaseLine.qtyBase}) beyond the ${tolerancePct}% tolerance.`,
            {
              purchaseLineId: String(purchaseLine._id),
              ordered: purchaseLine.qtyBase,
              alreadyReceived: purchaseLine.qtyReceivedBase,
              requested: line.qtyBase,
              tolerancePct,
            },
          );
        }

        const stockItem = await this.stockItemsService.getOrCreateForMaterialVariant(
          String(line.materialVariantId),
          session,
        );

        const posted = await this.stockService.post(
          [
            {
              type: 'INWARD',
              stockItemId: String(stockItem._id),
              fromLocationId: String(virtualSupplierLoc._id),
              toLocationId: String(inward.locationId),
              qty: line.qtyBase,
              unitCost: purchaseLine.landedUnitCost,
              lotOrigin: {
                lotNo: line.lotNo,
                originDocType: 'INWARD',
                originDocId: inward._id as any,
                supplierId: String(inward.supplierId),
              },
              doc: { type: 'INWARD', id: String(inward._id), lineId: String(line._id) },
              businessDate: inward.docDate,
            },
          ],
          session,
          actorId,
        );

        line.createdLotId = posted[0].lotId as any;
        line.unitCost = purchaseLine.landedUnitCost;

        await this.purchasesService.bumpReceived(
          String(purchase._id),
          String(purchaseLine._id),
          line.qtyBase,
          session,
        );
      }

      inward.status = 'CONFIRMED';
      inward.confirmedBy = actorId as any;
      inward.confirmedAt = new Date();
      inward.updatedBy = actorId as any;
      inward.version += 1;
      await inward.save({ session });
      return inward;
    });
  }

  /** DRAFT: plain cancel, no stock effect. CONFIRMED: reverses the ledger and un-does the purchase line's received total. */
  async cancel(id: string, reason: string, actorId: string): Promise<InwardDocument> {
    return this.transactionService.run(async (session) => {
      const inward = await this.model.findById(id).session(session);
      if (!inward) throw new ProblemException('NOT_FOUND', 404, 'Inward not found.');
      if (inward.status === 'CANCELLED') {
        throw new InvalidStateTransitionException('Inward is already cancelled.');
      }

      if (inward.status === 'CONFIRMED') {
        await this.stockService.reverseDocument(
          'INWARD',
          String(inward._id),
          reason,
          session,
          actorId,
        );
        for (const line of inward.lines) {
          await this.purchasesService.bumpReceived(
            String(inward.purchaseId),
            String(line.purchaseLineId),
            -line.qtyBase,
            session,
          );
        }
      }

      inward.status = 'CANCELLED';
      inward.cancelReason = reason;
      inward.cancelledBy = actorId as any;
      inward.cancelledAt = new Date();
      inward.updatedBy = actorId as any;
      inward.version += 1;
      await inward.save({ session });
      return inward;
    });
  }
}
