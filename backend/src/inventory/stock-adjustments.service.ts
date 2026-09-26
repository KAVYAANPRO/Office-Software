import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StockAdjustment, StockAdjustmentDocument } from './schemas/stock-adjustment.schema';
import { StockLocation, StockLocationDocument } from '../master/schemas/stock-location.schema';
import { StockService } from './stock.service';
import { TransactionService } from '../common/services/transaction.service';
import { NumberSeriesService } from '../common/services/number-series.service';
import { CompanySettingsService } from '../master/company-settings.service';
import { ProblemException } from '../common/errors/problem.exception';
import { roundQty, roundUnitCost } from '../common/utils/decimal';

export interface ProposeAdjustmentInput {
  stockItemId: string;
  locationId: string;
  direction: 'IN' | 'OUT';
  qty: number;
  reason: string;
  lotId?: string;
  unitCost?: number;
}

/**
 * STK-05. Propose creates a record only - no stock effect (Q7 default: everything needs
 * approval until a threshold is configured). Approve is where StockService.post() is called,
 * inside one transaction with the status change (BR-12).
 */
@Injectable()
export class StockAdjustmentsService {
  constructor(
    @InjectModel(StockAdjustment.name) private readonly model: Model<StockAdjustmentDocument>,
    @InjectModel(StockLocation.name) private readonly locationModel: Model<StockLocationDocument>,
    private readonly stockService: StockService,
    private readonly transactionService: TransactionService,
    private readonly numberSeries: NumberSeriesService,
    private readonly companySettings: CompanySettingsService,
  ) {}

  list(filter: Record<string, unknown> = {}) {
    return this.model.find(filter).sort({ createdAt: -1 }).lean();
  }

  async findById(id: string) {
    const doc = await this.model.findById(id).lean();
    if (!doc) throw new ProblemException('NOT_FOUND', 404, 'Stock adjustment not found.');
    return doc;
  }

  async propose(input: ProposeAdjustmentInput, actorId: string): Promise<StockAdjustmentDocument> {
    if (input.direction === 'OUT' && !input.lotId) {
      throw new ProblemException(
        'VALIDATION_FAILED',
        422,
        'lotId is required for an OUT adjustment.',
        {
          lotId: 'required for direction=OUT',
        },
      );
    }
    if (input.direction === 'IN' && input.unitCost === undefined) {
      throw new ProblemException(
        'VALIDATION_FAILED',
        422,
        'unitCost is required for an IN adjustment.',
        {
          unitCost: 'required for direction=IN',
        },
      );
    }

    const settings = await this.companySettings.get();
    const fy = settings?.currentFinancialYear ?? new Date().getFullYear().toString();
    await this.numberSeries.ensureSeries('STOCK_ADJUSTMENT', fy, 'ADJ');
    const docNo = await this.numberSeries.next('STOCK_ADJUSTMENT', fy);

    const [created] = await this.model.create([
      {
        docNo,
        docDate: new Date(),
        stockItemId: input.stockItemId,
        locationId: input.locationId,
        direction: input.direction,
        qty: roundQty(input.qty),
        reason: input.reason,
        lotId: input.lotId,
        unitCost: input.unitCost !== undefined ? roundUnitCost(input.unitCost) : undefined,
        status: 'PROPOSED',
        createdBy: actorId,
        updatedBy: actorId,
      },
    ]);
    return created;
  }

  async approve(id: string, actorId: string): Promise<StockAdjustmentDocument> {
    return this.transactionService.run(async (session) => {
      const adjustment = await this.model.findById(id).session(session);
      if (!adjustment) throw new ProblemException('NOT_FOUND', 404, 'Stock adjustment not found.');
      if (adjustment.status !== 'PROPOSED') {
        throw new ProblemException(
          'INVALID_STATE_TRANSITION',
          409,
          `Adjustment is already ${adjustment.status}.`,
        );
      }

      const virtualAdjustmentLoc = await this.locationModel
        .findOne({ code: 'VIRT-ADJUSTMENT' })
        .session(session)
        .lean();
      if (!virtualAdjustmentLoc) {
        throw new ProblemException(
          'VALIDATION_FAILED',
          500,
          'VIRT-ADJUSTMENT location is not seeded.',
        );
      }

      if (adjustment.direction === 'IN') {
        await this.stockService.post(
          [
            {
              type: 'ADJUSTMENT_IN',
              stockItemId: String(adjustment.stockItemId),
              fromLocationId: String(virtualAdjustmentLoc._id),
              toLocationId: String(adjustment.locationId),
              qty: adjustment.qty,
              unitCost: adjustment.unitCost,
              lotOrigin: { originDocType: 'ADJUSTMENT', originDocId: adjustment._id as any },
              doc: { type: 'STOCK_ADJUSTMENT', id: String(adjustment._id) },
              reason: adjustment.reason,
            },
          ],
          session,
          actorId,
        );
      } else {
        await this.stockService.post(
          [
            {
              type: 'ADJUSTMENT_OUT',
              stockItemId: String(adjustment.stockItemId),
              lotId: String(adjustment.lotId),
              fromLocationId: String(adjustment.locationId),
              toLocationId: String(virtualAdjustmentLoc._id),
              qty: adjustment.qty,
              doc: { type: 'STOCK_ADJUSTMENT', id: String(adjustment._id) },
              reason: adjustment.reason,
            },
          ],
          session,
          actorId,
        );
      }

      adjustment.status = 'APPROVED';
      adjustment.approvedBy = actorId as any;
      adjustment.approvedAt = new Date();
      adjustment.updatedBy = actorId as any;
      await adjustment.save({ session });
      return adjustment;
    });
  }

  async reject(id: string, actorId: string, reason: string): Promise<StockAdjustmentDocument> {
    const adjustment = await this.model.findById(id);
    if (!adjustment) throw new ProblemException('NOT_FOUND', 404, 'Stock adjustment not found.');
    if (adjustment.status !== 'PROPOSED') {
      throw new ProblemException(
        'INVALID_STATE_TRANSITION',
        409,
        `Adjustment is already ${adjustment.status}.`,
      );
    }
    adjustment.status = 'REJECTED';
    adjustment.cancelReason = reason;
    adjustment.cancelledBy = actorId as any;
    adjustment.cancelledAt = new Date();
    adjustment.updatedBy = actorId as any;
    await adjustment.save();
    return adjustment;
  }
}
