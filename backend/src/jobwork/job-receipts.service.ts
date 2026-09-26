import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import Decimal from 'decimal.js';
import { JobReceipt, JobReceiptDocument } from './schemas/job-receipt.schema';
import { JobSlip, JobSlipDocument } from './schemas/job-slip.schema';
import { JobMaterialLine, JobMaterialLineDocument } from './schemas/job-material-line.schema';
import { JobCharge, JobChargeDocument } from './schemas/job-charge.schema';
import { ProductionOrder, ProductionOrderDocument } from './schemas/production-order.schema';
import {
  DesignBomVersion,
  DesignBomVersionDocument,
} from '../design/schemas/design-bom-version.schema';
import { DesignVariant, DesignVariantDocument } from '../design/schemas/design-variant.schema';
import { StockLot, StockLotDocument } from '../inventory/schemas/stock-lot.schema';
import { StockLocation, StockLocationDocument } from '../master/schemas/stock-location.schema';
import { DesignsService } from '../design/designs.service';
import { StockService } from '../inventory/stock.service';
import { StockItemsService } from '../inventory/stock-items.service';
import { JobSlipsService } from './job-slips.service';
import { TransactionService } from '../common/services/transaction.service';
import { NumberSeriesService } from '../common/services/number-series.service';
import { CompanySettingsService } from '../master/company-settings.service';
import { roundMoney, roundQty, roundUnitCost, toDecimal } from '../common/utils/decimal';
import {
  InvalidStateTransitionException,
  ProblemException,
} from '../common/errors/problem.exception';
import { castObjectIdFilter } from '../common/utils/cast-filter';
import { CreateJobReceiptDto } from './dto/job-receipt.dto';
import { CostingService } from '../costing/costing.service';

const RECEIVABLE_STATUSES = ['MATERIAL_ISSUED', 'IN_PROCESS', 'READY', 'PARTIALLY_RECEIVED'];

interface JobBomLine {
  role: string;
  materialVariantId: Types.ObjectId;
  qtyPerGarmentBase: number;
  allowancePct: number;
}

/**
 * JOB-08, JOB-09, JOB-10, SHR-01, SHR-02, CST-02/CST-05 (provisional half only - the full
 * costing module with true-up on close is Phase 5). Consumption is drawn from THIS JOB's own
 * custody lines (tech.md §5.7/§7.3: "oldest lot first"), never a plain factory-wide FIFO.
 */
@Injectable()
export class JobReceiptsService {
  constructor(
    @InjectModel(JobReceipt.name) private readonly model: Model<JobReceiptDocument>,
    @InjectModel(JobSlip.name) private readonly jobSlipModel: Model<JobSlipDocument>,
    @InjectModel(JobMaterialLine.name)
    private readonly materialLineModel: Model<JobMaterialLineDocument>,
    @InjectModel(JobCharge.name) private readonly chargeModel: Model<JobChargeDocument>,
    @InjectModel(ProductionOrder.name)
    private readonly productionOrderModel: Model<ProductionOrderDocument>,
    @InjectModel(DesignBomVersion.name)
    private readonly bomVersionModel: Model<DesignBomVersionDocument>,
    @InjectModel(DesignVariant.name)
    private readonly designVariantModel: Model<DesignVariantDocument>,
    @InjectModel(StockLot.name) private readonly lotModel: Model<StockLotDocument>,
    @InjectModel(StockLocation.name) private readonly locationModel: Model<StockLocationDocument>,
    private readonly designsService: DesignsService,
    private readonly stockService: StockService,
    private readonly stockItemsService: StockItemsService,
    private readonly jobSlipsService: JobSlipsService,
    private readonly transactionService: TransactionService,
    private readonly numberSeries: NumberSeriesService,
    private readonly companySettings: CompanySettingsService,
    @Inject(forwardRef(() => CostingService)) private readonly costingService: CostingService,
  ) {}

  list(filter: Record<string, unknown> = {}) {
    return this.model
      .find(castObjectIdFilter(filter, ['jobSlipId', 'jobWorkerId']))
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(id: string) {
    const doc = await this.model.findById(id).lean();
    if (!doc) throw new ProblemException('NOT_FOUND', 404, 'Job receipt not found.');
    return doc;
  }

  async create(dto: CreateJobReceiptDto, actorId: string): Promise<JobReceiptDocument> {
    const jobSlip = await this.jobSlipModel.findById(dto.jobSlipId).lean();
    if (!jobSlip) throw new ProblemException('NOT_FOUND', 404, 'Job slip not found.');
    if (!RECEIVABLE_STATUSES.includes(jobSlip.status)) {
      throw new InvalidStateTransitionException(
        `Cannot receive against a job slip in status ${jobSlip.status}.`,
      );
    }

    for (const line of dto.lines) {
      const accepted = line.acceptedQty ?? 0;
      const rejected = line.rejectedQty ?? 0;
      const damaged = line.damagedQty ?? 0;
      if (
        jobSlip.jobType === 'MANUFACTURING' &&
        Math.abs(accepted + rejected + damaged - line.receivedQty) > 0.0005
      ) {
        throw new ProblemException(
          'VALIDATION_FAILED',
          422,
          'accepted + rejected + damaged must equal receivedQty for a manufacturing receipt.',
        );
      }
    }

    const settings = await this.companySettings.get();
    const fy = settings?.currentFinancialYear ?? new Date().getFullYear().toString();
    await this.numberSeries.ensureSeries('JOB_RECEIPT', fy, 'JR');
    const docNo = await this.numberSeries.next('JOB_RECEIPT', fy);

    return this.model.create({
      docNo,
      docDate: new Date(),
      jobSlipId: new Types.ObjectId(dto.jobSlipId),
      jobWorkerId: jobSlip.jobWorkerId,
      lines: dto.lines.map((l) => ({
        colourId: l.colourId ? new Types.ObjectId(l.colourId) : undefined,
        sizeId: l.sizeId ? new Types.ObjectId(l.sizeId) : undefined,
        materialVariantId: l.materialVariantId
          ? new Types.ObjectId(l.materialVariantId)
          : undefined,
        expectedQty: 0,
        receivedQty: l.receivedQty,
        acceptedQty: l.acceptedQty ?? l.receivedQty,
        rejectedQty: l.rejectedQty ?? 0,
        damagedQty: l.damagedQty ?? 0,
      })),
      otherCharges: dto.otherCharges,
      remarks: dto.remarks,
      status: 'DRAFT',
      createdBy: actorId,
      updatedBy: actorId,
    });
  }

  async confirm(id: string, actorId: string): Promise<JobReceiptDocument> {
    return this.transactionService.run(async (session) => {
      const receipt = await this.model.findById(id).session(session);
      if (!receipt) throw new ProblemException('NOT_FOUND', 404, 'Job receipt not found.');
      if (receipt.status !== 'DRAFT') {
        throw new InvalidStateTransitionException(`Job receipt is already ${receipt.status}.`);
      }

      const jobSlip = await this.jobSlipModel.findById(receipt.jobSlipId).session(session);
      if (!jobSlip) throw new ProblemException('NOT_FOUND', 404, 'Job slip not found.');

      if (jobSlip.jobType === 'MANUFACTURING') {
        await this.confirmManufacturing(receipt, jobSlip, session, actorId);
      } else {
        await this.confirmProcessing(receipt, jobSlip, session, actorId);
      }

      receipt.status = 'CONFIRMED';
      receipt.updatedBy = actorId as any;
      receipt.version += 1;
      await receipt.save({ session });

      await this.jobSlipsService.recomputeReceiptStatus(String(jobSlip._id), session);
      await this.costingService.writeCostSheet(String(jobSlip._id), session);
      return receipt;
    });
  }

  private async confirmManufacturing(
    receipt: JobReceiptDocument,
    jobSlip: JobSlipDocument,
    session: ClientSession,
    actorId: string,
  ): Promise<void> {
    const bomLines = await this.getBomLines(jobSlip, session);

    const totalPieces = receipt.lines.reduce(
      (sum, l) => sum + (l.acceptedQty ?? 0) + (l.rejectedQty ?? 0) + (l.damagedQty ?? 0),
      0,
    );
    const totalAccepted = receipt.lines.reduce((sum, l) => sum + (l.acceptedQty ?? 0), 0);

    // Consumption (SHR-02): pieces x BOM (+ allowance), drawn from this job's own custody lots.
    for (const bomLine of bomLines) {
      const requiredQty = roundQty(
        toDecimal(totalPieces)
          .times(bomLine.qtyPerGarmentBase)
          .times(toDecimal(1).plus(toDecimal(bomLine.allowancePct).dividedBy(100))),
      );
      if (requiredQty <= 0) continue;

      const stockItem = await this.stockItemsService.getOrCreateForMaterialVariant(
        String(bomLine.materialVariantId),
        session,
      );
      await this.consumeFromJobCustody(
        jobSlip,
        String(stockItem._id),
        requiredQty,
        session,
        actorId,
      );
    }

    // Provisional cost (tech.md §6.4): materialToDate / expectedPieces + thisReceiptCharges / thisReceiptAccepted.
    const materialToDate = await this.materialCostToDate(jobSlip._id, session);
    const expectedPieces = jobSlip.expectedOutputLines.reduce((sum, l) => sum + l.expectedQty, 0);

    const manufacturingCharge = this.computeCharge(
      jobSlip.chargeBasis,
      jobSlip.agreedRate,
      totalAccepted,
    );
    await this.writeCharge(
      jobSlip._id,
      receipt._id,
      'MANUFACTURING',
      jobSlip.chargeBasis,
      totalAccepted,
      jobSlip.agreedRate,
      manufacturingCharge,
      session,
    );

    let otherChargeAmount = 0;
    if (receipt.otherCharges) {
      otherChargeAmount = receipt.otherCharges;
      await this.writeCharge(
        jobSlip._id,
        receipt._id,
        'OTHER',
        'LUMP_SUM',
        1,
        receipt.otherCharges,
        receipt.otherCharges,
        session,
      );
    }

    const thisReceiptCharges = roundMoney(toDecimal(manufacturingCharge).plus(otherChargeAmount));
    const provisionalUnitCost =
      totalAccepted > 0
        ? roundUnitCost(
            toDecimal(materialToDate)
              .dividedBy(expectedPieces)
              .plus(toDecimal(thisReceiptCharges).dividedBy(totalAccepted)),
          )
        : 0;

    const warehouse = await this.locationModel.findOne({ code: 'MAIN-WH' }).session(session).lean();
    const quarantine = await this.locationModel
      .findOne({ code: 'QUARANTINE' })
      .session(session)
      .lean();
    const production = await this.locationModel
      .findOne({ code: 'VIRT-PRODUCTION' })
      .session(session)
      .lean();
    if (!warehouse || !quarantine || !production) {
      throw new ProblemException('VALIDATION_FAILED', 500, 'Fixed locations are not seeded.');
    }

    for (const line of receipt.lines) {
      const accepted = line.acceptedQty ?? 0;
      const rejectedAndDamaged = (line.rejectedQty ?? 0) + (line.damagedQty ?? 0);
      if (accepted <= 0 && rejectedAndDamaged <= 0) continue;

      const designVariant = await this.designVariantModel
        .findOne({ designId: jobSlip.designId, colourId: line.colourId, sizeId: line.sizeId })
        .session(session)
        .lean();
      if (!designVariant) {
        throw new ProblemException(
          'VALIDATION_FAILED',
          422,
          'No design variant exists for this colour/size.',
        );
      }
      const finishedItem = await this.stockItemsService.getOrCreateForDesignVariant(
        String(designVariant._id),
        session,
      );

      if (accepted > 0) {
        const posted = await this.stockService.post(
          [
            {
              type: 'PRODUCTION_RECEIPT',
              stockItemId: String(finishedItem._id),
              fromLocationId: String(production._id),
              toLocationId: String(warehouse._id),
              qty: accepted,
              unitCost: provisionalUnitCost,
              lotOrigin: {
                originDocType: 'PRODUCTION_RECEIPT',
                originDocId: receipt._id as any,
                originJobSlipId: jobSlip._id as any,
              },
              doc: { type: 'JOB_RECEIPT', id: String(receipt._id), lineId: String(line._id) },
            },
          ],
          session,
          actorId,
        );
        line.createdLotId = new Types.ObjectId(posted[0].lotId) as any;
      }

      if (rejectedAndDamaged > 0) {
        await this.stockService.post(
          [
            {
              type: 'REJECTION',
              stockItemId: String(finishedItem._id),
              fromLocationId: String(production._id),
              toLocationId: String(quarantine._id),
              qty: rejectedAndDamaged,
              unitCost: provisionalUnitCost,
              lotOrigin: {
                originDocType: 'PRODUCTION_RECEIPT',
                originDocId: receipt._id as any,
                originJobSlipId: jobSlip._id as any,
              },
              doc: { type: 'JOB_RECEIPT', id: String(receipt._id), lineId: String(line._id) },
            },
          ],
          session,
          actorId,
        );
      }
    }
  }

  private async confirmProcessing(
    receipt: JobReceiptDocument,
    jobSlip: JobSlipDocument,
    session: ClientSession,
    actorId: string,
  ): Promise<void> {
    // Simplification (documented): a processing job's whole remaining custody is treated as
    // consumed by this receipt - there is no BOM for a raw-to-processed conversion, and
    // tech.md's own worked example (100 m sent, 95 m received) never revisits a job with a
    // second partial receipt. Multi-receipt processing jobs are a known gap for a follow-up.
    const remainingLines = await this.materialLineModel
      .find({ jobSlipId: jobSlip._id })
      .session(session);
    let materialCost = new Decimal(0);
    for (const line of remainingLines) {
      const remaining = roundQty(
        line.qtyIssued - line.qtyReturned - line.qtyConsumed - line.qtyWrittenOff,
      );
      if (remaining <= 0) continue;

      await this.stockService.post(
        [
          {
            type: 'CONSUMPTION',
            stockItemId: String(line.stockItemId),
            lotId: String(line.lotId),
            fromLocationId: String((await this.custodyLocation(jobSlip.jobWorkerId, session))._id),
            toLocationId: String((await this.locationByCode('VIRT-PRODUCTION', session))._id),
            qty: remaining,
            doc: { type: 'JOB_RECEIPT', id: String(receipt._id) },
          },
        ],
        session,
        actorId,
      );
      line.qtyConsumed = roundQty(line.qtyConsumed + remaining);
      await line.save({ session });
      materialCost = materialCost.plus(toDecimal(remaining).times(line.unitCost));
    }

    const totalReceived = receipt.lines.reduce((sum, l) => sum + l.receivedQty, 0);
    const processingCharge = this.computeCharge(
      jobSlip.chargeBasis,
      jobSlip.agreedRate,
      totalReceived,
    );
    await this.writeCharge(
      jobSlip._id,
      receipt._id,
      'PROCESSING',
      jobSlip.chargeBasis,
      totalReceived,
      jobSlip.agreedRate,
      processingCharge,
      session,
    );

    let otherChargeAmount = 0;
    if (receipt.otherCharges) {
      otherChargeAmount = receipt.otherCharges;
      await this.writeCharge(
        jobSlip._id,
        receipt._id,
        'OTHER',
        'LUMP_SUM',
        1,
        receipt.otherCharges,
        receipt.otherCharges,
        session,
      );
    }

    const totalCharges = roundMoney(toDecimal(processingCharge).plus(otherChargeAmount));
    const provisionalUnitCost =
      totalReceived > 0
        ? roundUnitCost(materialCost.plus(totalCharges).dividedBy(totalReceived))
        : 0;

    const warehouse = await this.locationByCode('MAIN-WH', session);
    const production = await this.locationByCode('VIRT-PRODUCTION', session);

    for (const line of receipt.lines) {
      if (line.receivedQty <= 0 || !line.materialVariantId) continue;
      const outputItem = await this.stockItemsService.getOrCreateForMaterialVariant(
        String(line.materialVariantId),
        session,
        'PROCESSED_MATERIAL',
      );
      const posted = await this.stockService.post(
        [
          {
            type: 'PROCESS_OUTPUT',
            stockItemId: String(outputItem._id),
            fromLocationId: String(production._id),
            toLocationId: String(warehouse._id),
            qty: line.receivedQty,
            unitCost: provisionalUnitCost,
            lotOrigin: {
              originDocType: 'PROCESS_OUTPUT',
              originDocId: receipt._id as any,
              originJobSlipId: jobSlip._id as any,
            },
            doc: { type: 'JOB_RECEIPT', id: String(receipt._id), lineId: String(line._id) },
          },
        ],
        session,
        actorId,
      );
      line.createdLotId = new Types.ObjectId(posted[0].lotId) as any;
    }
  }

  async cancel(id: string, reason: string, actorId: string): Promise<JobReceiptDocument> {
    const receipt = await this.model.findById(id);
    if (!receipt) throw new ProblemException('NOT_FOUND', 404, 'Job receipt not found.');
    if (receipt.status !== 'DRAFT') {
      throw new InvalidStateTransitionException('Only a draft job receipt can be cancelled.');
    }
    receipt.status = 'CANCELLED';
    receipt.cancelReason = reason;
    receipt.cancelledBy = actorId as any;
    receipt.cancelledAt = new Date();
    receipt.updatedBy = actorId as any;
    receipt.version += 1;
    await receipt.save();
    return receipt;
  }

  /** JOB-11: expected, actual, difference per job. */
  async getComparison(jobSlipId: string) {
    const jobSlip = await this.jobSlipModel.findById(jobSlipId).lean();
    if (!jobSlip) throw new ProblemException('NOT_FOUND', 404, 'Job slip not found.');
    const receipts = await this.model.find({ jobSlipId: jobSlip._id, status: 'CONFIRMED' }).lean();

    const expected = jobSlip.expectedOutputLines.reduce((sum, l) => sum + l.expectedQty, 0);
    let actual = 0;
    for (const r of receipts) for (const l of r.lines) actual += l.receivedQty;

    return {
      jobSlipId,
      jobWorkerId: String(jobSlip.jobWorkerId),
      designId: String(jobSlip.designId),
      status: jobSlip.status,
      expected,
      actual,
      difference: roundQty(expected - actual),
    };
  }

  // ---- helpers ----

  private async getBomLines(
    jobSlip: JobSlipDocument,
    session: ClientSession,
  ): Promise<JobBomLine[]> {
    if (jobSlip.productionOrderId) {
      const order = await this.productionOrderModel
        .findById(jobSlip.productionOrderId)
        .session(session)
        .lean();
      if (order) {
        const bomVersion = await this.bomVersionModel
          .findById(order.bomVersionId)
          .session(session)
          .lean();
        if (bomVersion) return bomVersion.lines;
      }
    }
    const current = await this.designsService.getCurrentBom(String(jobSlip.designId));
    if (!current)
      throw new ProblemException(
        'VALIDATION_FAILED',
        422,
        'This design has no active BOM configured.',
      );
    return current.lines;
  }

  private async materialCostToDate(
    jobSlipId: Types.ObjectId,
    session: ClientSession,
  ): Promise<number> {
    const lines = await this.materialLineModel.find({ jobSlipId }).session(session).lean();
    let total = new Decimal(0);
    for (const l of lines)
      total = total.plus(toDecimal(l.qtyIssued - l.qtyReturned).times(l.unitCost));
    return roundMoney(total);
  }

  private computeCharge(basis: string, rate: number, quantity: number): number {
    if (basis === 'LUMP_SUM') return roundMoney(rate);
    return roundMoney(toDecimal(rate).times(quantity));
  }

  private async writeCharge(
    jobSlipId: Types.ObjectId,
    receiptId: Types.ObjectId,
    kind: 'PROCESSING' | 'MANUFACTURING' | 'OTHER',
    basis: string,
    quantity: number,
    rate: number,
    amount: number,
    session: ClientSession,
  ): Promise<void> {
    await this.chargeModel.create([{ jobSlipId, receiptId, kind, basis, quantity, rate, amount }], {
      session,
    });
  }

  private async custodyLocation(jobWorkerId: Types.ObjectId, session: ClientSession) {
    return this.locationByCode(`CUSTODY-${jobWorkerId}`, session);
  }

  private async locationByCode(code: string, session: ClientSession) {
    const loc = await this.locationModel.findOne({ code }).session(session).lean();
    if (!loc)
      throw new ProblemException('VALIDATION_FAILED', 500, `Location ${code} is not seeded.`);
    return loc;
  }

  /** Consumes from THIS job's own custody lots, oldest lot first (tech.md §5.7/§7.3). */
  private async consumeFromJobCustody(
    jobSlip: JobSlipDocument,
    stockItemId: string,
    qtyNeeded: number,
    session: ClientSession,
    actorId: string,
  ): Promise<void> {
    const lines = await this.materialLineModel
      .find({ jobSlipId: jobSlip._id, stockItemId: new Types.ObjectId(stockItemId) })
      .session(session);
    const lots = await this.lotModel
      .find({ _id: { $in: lines.map((l) => l.lotId) } })
      .session(session)
      .lean();
    const receivedOnByLot = new Map(lots.map((l) => [String(l._id), l.receivedOn.getTime()]));

    const candidates = lines
      .map((l) => ({
        line: l,
        remaining: roundQty(l.qtyIssued - l.qtyReturned - l.qtyConsumed - l.qtyWrittenOff),
      }))
      .filter((c) => c.remaining > 0)
      .sort(
        (a, b) =>
          (receivedOnByLot.get(String(a.line.lotId)) ?? 0) -
          (receivedOnByLot.get(String(b.line.lotId)) ?? 0),
      );

    const custody = await this.custodyLocation(jobSlip.jobWorkerId, session);
    const production = await this.locationByCode('VIRT-PRODUCTION', session);

    let remaining = toDecimal(qtyNeeded);
    for (const { line, remaining: available } of candidates) {
      if (remaining.lte(0)) break;
      const take = roundQty(Decimal.min(remaining, available));
      if (take <= 0) continue;

      await this.stockService.post(
        [
          {
            type: 'CONSUMPTION',
            stockItemId,
            lotId: String(line.lotId),
            fromLocationId: String(custody._id),
            toLocationId: String(production._id),
            qty: take,
            doc: { type: 'JOB_SLIP', id: String(jobSlip._id) },
          },
        ],
        session,
        actorId,
      );

      line.qtyConsumed = roundQty(line.qtyConsumed + take);
      await line.save({ session });
      remaining = remaining.minus(take);
    }

    if (remaining.gt(0.0005)) {
      throw new ProblemException(
        'INSUFFICIENT_STOCK',
        409,
        `Job ${jobSlip._id} does not have enough material in custody to consume the required quantity (short by ${remaining.toFixed(3)}).`,
      );
    }
  }
}
