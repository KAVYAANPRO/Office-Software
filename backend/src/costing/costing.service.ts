import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { JobCostSheet, JobCostSheetDocument } from './schemas/job-cost-sheet.schema';
import { LotRevaluation, LotRevaluationDocument } from './schemas/lot-revaluation.schema';
import { JobSlip, JobSlipDocument } from '../jobwork/schemas/job-slip.schema';
import {
  JobMaterialLine,
  JobMaterialLineDocument,
} from '../jobwork/schemas/job-material-line.schema';
import { JobCharge, JobChargeDocument } from '../jobwork/schemas/job-charge.schema';
import { JobReceipt, JobReceiptDocument } from '../jobwork/schemas/job-receipt.schema';
import { StockLot, StockLotDocument } from '../inventory/schemas/stock-lot.schema';
import { roundMoney, roundUnitCost } from '../common/utils/decimal';
import { ProblemException } from '../common/errors/problem.exception';

export interface JobCostResult {
  jobSlipId: string;
  material: number;
  processing: number;
  manufacturing: number;
  other: number;
  totalCost: number;
  acceptedQty: number;
  unitCost?: number;
  status: 'PROVISIONAL' | 'FINAL';
}

/**
 * CST-01 to CST-08. The only writer of cost tables (tech.md §3.2). Deliberately does NOT
 * maintain a separate per-lot cost-component breakdown (stock_lot_cost_components in
 * tech.md) - a documented simplification: a processed-fabric lot's cost already flows into
 * the garment job that consumes it via job_material_lines.unitCost (CST-05 holds), it just
 * isn't broken back down into "how much of this was dyeing vs material" at the lot level,
 * only at the job level (job_cost_sheets.lines).
 */
@Injectable()
export class CostingService {
  constructor(
    @InjectModel(JobCostSheet.name) private readonly costSheetModel: Model<JobCostSheetDocument>,
    @InjectModel(LotRevaluation.name)
    private readonly revaluationModel: Model<LotRevaluationDocument>,
    @InjectModel(JobSlip.name) private readonly jobSlipModel: Model<JobSlipDocument>,
    @InjectModel(JobMaterialLine.name)
    private readonly materialLineModel: Model<JobMaterialLineDocument>,
    @InjectModel(JobCharge.name) private readonly chargeModel: Model<JobChargeDocument>,
    @InjectModel(JobReceipt.name) private readonly receiptModel: Model<JobReceiptDocument>,
    @InjectModel(StockLot.name) private readonly lotModel: Model<StockLotDocument>,
  ) {}

  /** CST-01 to CST-04: components come from real records (job_material_lines, job_charges), never typed in. */
  async computeJobCost(jobSlipId: string, session?: ClientSession): Promise<JobCostResult> {
    const jobSlip = await this.jobSlipModel
      .findById(jobSlipId)
      .session(session ?? null)
      .lean();
    if (!jobSlip) throw new ProblemException('NOT_FOUND', 404, 'Job slip not found.');

    const materialLines = await this.materialLineModel
      .find({ jobSlipId: new Types.ObjectId(jobSlipId) })
      .session(session ?? null)
      .lean();
    const material = roundMoney(
      materialLines.reduce((sum, l) => sum + (l.qtyIssued - l.qtyReturned) * l.unitCost, 0),
    );

    const charges = await this.chargeModel
      .find({ jobSlipId: new Types.ObjectId(jobSlipId) })
      .session(session ?? null)
      .lean();
    const sumKind = (kind: string) =>
      roundMoney(charges.filter((c) => c.kind === kind).reduce((s, c) => s + c.amount, 0));
    const processing = sumKind('PROCESSING');
    const manufacturing = sumKind('MANUFACTURING');
    const other = sumKind('OTHER');

    const totalCost = roundMoney(material + processing + manufacturing + other);

    const receipts = await this.receiptModel
      .find({ jobSlipId: new Types.ObjectId(jobSlipId), status: 'CONFIRMED' })
      .session(session ?? null)
      .lean();
    let acceptedQty = 0;
    for (const r of receipts) {
      for (const l of r.lines) {
        acceptedQty += jobSlip.jobType === 'MANUFACTURING' ? (l.acceptedQty ?? 0) : l.receivedQty;
      }
    }

    const unitCost = acceptedQty > 0 ? roundUnitCost(totalCost / acceptedQty) : undefined;

    return {
      jobSlipId,
      material,
      processing,
      manufacturing,
      other,
      totalCost,
      acceptedQty,
      unitCost,
      status: jobSlip.status === 'CLOSED' ? 'FINAL' : 'PROVISIONAL',
    };
  }

  async writeCostSheet(jobSlipId: string, session?: ClientSession): Promise<JobCostResult> {
    const result = await this.computeJobCost(jobSlipId, session);
    const lines = [
      { component: 'MATERIAL', amount: result.material },
      { component: 'PROCESSING', amount: result.processing },
      { component: 'MANUFACTURING', amount: result.manufacturing },
      { component: 'OTHER', amount: result.other },
    ].filter((l) => l.amount > 0);

    await this.costSheetModel.updateOne(
      { jobSlipId: new Types.ObjectId(jobSlipId) },
      {
        $set: {
          lines,
          totalCost: result.totalCost,
          acceptedQty: result.acceptedQty,
          unitCost: result.unitCost,
          status: result.status,
        },
      },
      { upsert: true, session },
    );
    return result;
  }

  /** A FINAL sheet is locked (post-close); anything else is recomputed live so returns/write-offs are never stale. */
  async getCostSheet(jobSlipId: string) {
    const sheet = await this.costSheetModel
      .findOne({ jobSlipId: new Types.ObjectId(jobSlipId) })
      .lean();
    if (sheet?.status === 'FINAL') return sheet;
    return this.computeJobCost(jobSlipId);
  }

  /**
   * tech.md §6.5: on close, provisional lot costs are trued up. Called by JobSlipsService.close()
   * inside the same transaction as the status change (BR-12).
   */
  async onJobClosed(
    jobSlipId: string,
    actorId: string,
    session: ClientSession,
  ): Promise<JobCostResult> {
    const result = await this.writeCostSheet(jobSlipId, session);
    if (result.unitCost === undefined) return result;

    const outputLots = await this.lotModel
      .find({ originJobSlipId: new Types.ObjectId(jobSlipId) })
      .session(session);
    for (const lot of outputLots) {
      if (Math.abs(lot.unitCost - result.unitCost) < 0.00005) continue;
      await this.revaluationModel.create(
        [
          {
            lotId: lot._id,
            oldCost: lot.unitCost,
            newCost: result.unitCost,
            reason: 'Job closed - provisional cost trued up to final',
            jobSlipId: new Types.ObjectId(jobSlipId),
            createdBy: new Types.ObjectId(actorId),
          },
        ],
        { session },
      );
      lot.unitCost = result.unitCost;
      await lot.save({ session });
    }

    return result;
  }

  /** CST-06: design-wise cost/margin, using the most recent FINAL (else PROVISIONAL) cost sheet per job. */
  async getMarginsForDesign(designId: string) {
    const jobSlips = await this.jobSlipModel
      .find({ designId: new Types.ObjectId(designId) })
      .lean();
    const results = [];
    for (const slip of jobSlips) {
      const sheet = await this.costSheetModel.findOne({ jobSlipId: slip._id }).lean();
      if (!sheet) continue;
      results.push({
        jobSlipId: String(slip._id),
        status: sheet.status,
        unitCost: sheet.unitCost,
      });
    }
    return results;
  }
}
