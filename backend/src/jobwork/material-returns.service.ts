import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MaterialReturn, MaterialReturnDocument } from './schemas/material-return.schema';
import { JobSlip, JobSlipDocument } from './schemas/job-slip.schema';
import { JobMaterialLine, JobMaterialLineDocument } from './schemas/job-material-line.schema';
import { StockLocation, StockLocationDocument } from '../master/schemas/stock-location.schema';
import { StockItem, StockItemDocument } from '../inventory/schemas/stock-item.schema';
import { StockService } from '../inventory/stock.service';
import { TransactionService } from '../common/services/transaction.service';
import { NumberSeriesService } from '../common/services/number-series.service';
import { CompanySettingsService } from '../master/company-settings.service';
import {
  InvalidStateTransitionException,
  ProblemException,
} from '../common/errors/problem.exception';
import { castObjectIdFilter } from '../common/utils/cast-filter';
import { CreateMaterialReturnDto } from './dto/material-return.dto';
import { CostingService } from '../costing/costing.service';

/** JOB-07: unused or rejected input material returned from the factory into its original lot (BR-02 in reverse). */
@Injectable()
export class MaterialReturnsService {
  constructor(
    @InjectModel(MaterialReturn.name) private readonly model: Model<MaterialReturnDocument>,
    @InjectModel(JobSlip.name) private readonly jobSlipModel: Model<JobSlipDocument>,
    @InjectModel(JobMaterialLine.name)
    private readonly materialLineModel: Model<JobMaterialLineDocument>,
    @InjectModel(StockLocation.name) private readonly locationModel: Model<StockLocationDocument>,
    @InjectModel(StockItem.name) private readonly stockItemModel: Model<StockItemDocument>,
    private readonly stockService: StockService,
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
    if (!doc) throw new ProblemException('NOT_FOUND', 404, 'Material return not found.');
    return doc;
  }

  async create(dto: CreateMaterialReturnDto, actorId: string): Promise<MaterialReturnDocument> {
    const jobSlip = await this.jobSlipModel.findById(dto.jobSlipId).lean();
    if (!jobSlip) throw new ProblemException('NOT_FOUND', 404, 'Job slip not found.');

    const settings = await this.companySettings.get();
    const fy = settings?.currentFinancialYear ?? new Date().getFullYear().toString();
    await this.numberSeries.ensureSeries('MATERIAL_RETURN', fy, 'MR');
    const docNo = await this.numberSeries.next('MATERIAL_RETURN', fy);

    return this.model.create({
      docNo,
      docDate: new Date(),
      jobSlipId: new Types.ObjectId(dto.jobSlipId),
      jobWorkerId: jobSlip.jobWorkerId,
      lines: dto.lines.map((l) => ({
        materialVariantId: new Types.ObjectId(l.materialVariantId),
        lotId: new Types.ObjectId(l.lotId),
        qtyBase: l.qtyBase,
      })),
      notes: dto.notes,
      status: 'DRAFT',
      createdBy: actorId,
      updatedBy: actorId,
    });
  }

  async confirm(id: string, actorId: string): Promise<MaterialReturnDocument> {
    return this.transactionService.run(async (session) => {
      const ret = await this.model.findById(id).session(session);
      if (!ret) throw new ProblemException('NOT_FOUND', 404, 'Material return not found.');
      if (ret.status !== 'DRAFT') {
        throw new InvalidStateTransitionException(`Material return is already ${ret.status}.`);
      }

      const [warehouse, custody] = await Promise.all([
        this.locationModel.findOne({ code: 'MAIN-WH' }).session(session).lean(),
        this.locationModel
          .findOne({ code: `CUSTODY-${ret.jobWorkerId}` })
          .session(session)
          .lean(),
      ]);
      if (!warehouse || !custody) {
        throw new ProblemException(
          'VALIDATION_FAILED',
          500,
          'Warehouse or custody location is not seeded.',
        );
      }

      for (const line of ret.lines) {
        const stockItem = await this.stockItemModel
          .findOne({ materialVariantId: line.materialVariantId })
          .session(session)
          .lean();
        if (!stockItem)
          throw new ProblemException(
            'NOT_FOUND',
            404,
            'Stock item not found for this material variant.',
          );

        await this.stockService.post(
          [
            {
              type: 'RETURN_FROM_FACTORY',
              stockItemId: String(stockItem._id),
              lotId: String(line.lotId),
              fromLocationId: String(custody._id),
              toLocationId: String(warehouse._id),
              qty: line.qtyBase,
              doc: { type: 'MATERIAL_RETURN', id: String(ret._id), lineId: String(line._id) },
            },
          ],
          session,
          actorId,
        );

        await this.materialLineModel.updateOne(
          { jobSlipId: ret.jobSlipId, lotId: line.lotId },
          { $inc: { qtyReturned: line.qtyBase } },
          { session },
        );
      }

      ret.status = 'CONFIRMED';
      ret.updatedBy = actorId as any;
      ret.version += 1;
      await ret.save({ session });
      await this.costingService.writeCostSheet(String(ret.jobSlipId), session);
      return ret;
    });
  }

  async cancel(id: string, reason: string, actorId: string): Promise<MaterialReturnDocument> {
    const ret = await this.model.findById(id);
    if (!ret) throw new ProblemException('NOT_FOUND', 404, 'Material return not found.');
    if (ret.status !== 'DRAFT') {
      throw new InvalidStateTransitionException('Only a draft material return can be cancelled.');
    }
    ret.status = 'CANCELLED';
    ret.cancelReason = reason;
    ret.cancelledBy = actorId as any;
    ret.cancelledAt = new Date();
    ret.updatedBy = actorId as any;
    ret.version += 1;
    await ret.save();
    return ret;
  }
}
