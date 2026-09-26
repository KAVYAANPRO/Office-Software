import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductionOrder, ProductionOrderDocument } from './schemas/production-order.schema';
import { DesignsService } from '../design/designs.service';
import { NumberSeriesService } from '../common/services/number-series.service';
import { CompanySettingsService } from '../master/company-settings.service';
import {
  InvalidStateTransitionException,
  ProblemException,
} from '../common/errors/problem.exception';
import { CreateProductionOrderDto } from './dto/production-order.dto';

/**
 * JOB-01. Creating an order both plans the colour/size breakdown and computes the material
 * requirement in the same step, snapshotting the design's current BOM version (DSN-04) so a
 * later BOM edit cannot retroactively change this order's numbers.
 */
@Injectable()
export class ProductionOrdersService {
  constructor(
    @InjectModel(ProductionOrder.name) private readonly model: Model<ProductionOrderDocument>,
    private readonly designsService: DesignsService,
    private readonly numberSeries: NumberSeriesService,
    private readonly companySettings: CompanySettingsService,
  ) {}

  list(filter: Record<string, unknown> = {}) {
    return this.model.find(filter).sort({ createdAt: -1 }).lean();
  }

  async findById(id: string) {
    const doc = await this.model.findById(id).lean();
    if (!doc) throw new ProblemException('NOT_FOUND', 404, 'Production order not found.');
    return doc;
  }

  async create(dto: CreateProductionOrderDto, actorId: string): Promise<ProductionOrderDocument> {
    const totalGarments = dto.quantities.reduce((sum, q) => sum + q.qty, 0);
    const requirement = await this.designsService.calculateRequirement(dto.designId, totalGarments);

    const settings = await this.companySettings.get();
    const fy = settings?.currentFinancialYear ?? new Date().getFullYear().toString();
    await this.numberSeries.ensureSeries('PRODUCTION_ORDER', fy, 'PO');
    const docNo = await this.numberSeries.next('PRODUCTION_ORDER', fy);

    return this.model.create({
      docNo,
      docDate: new Date(),
      designId: dto.designId,
      bomVersionId: requirement.bomVersionId,
      quantities: dto.quantities,
      totalGarments,
      requirements: requirement.lines.map((l) => ({
        role: l.role,
        materialVariantId: l.materialVariantId,
        qtyPerGarmentBase: l.qtyPerGarmentBase,
        allowancePct: l.allowancePct,
        requiredQtyBase: l.requiredQtyBase,
      })),
      plannedStartDate: dto.plannedStartDate ? new Date(dto.plannedStartDate) : undefined,
      plannedEndDate: dto.plannedEndDate ? new Date(dto.plannedEndDate) : undefined,
      notes: dto.notes,
      status: 'PLANNED',
      createdBy: actorId,
      updatedBy: actorId,
    });
  }

  async cancel(id: string, reason: string, actorId: string): Promise<ProductionOrderDocument> {
    const order = await this.model.findById(id);
    if (!order) throw new ProblemException('NOT_FOUND', 404, 'Production order not found.');
    if (order.status === 'CANCELLED') {
      throw new InvalidStateTransitionException('Production order is already cancelled.');
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
}
