import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Design, DesignDocument } from './schemas/design.schema';
import { DesignVariant, DesignVariantDocument } from './schemas/design-variant.schema';
import { DesignBomVersion, DesignBomVersionDocument } from './schemas/design-bom-version.schema';
import { DesignRateHistory, DesignRateHistoryDocument } from './schemas/design-rate-history.schema';
import { StockItemsService } from '../inventory/stock-items.service';
import { StockService } from '../inventory/stock.service';
import { MasterCrudService } from '../common/services/master-crud.service';
import { CreateDesignDto, UpdateDesignDto } from './dto/design.dto';
import { BomLineInputDto } from './dto/bom.dto';
import { roundQty, toDecimal } from '../common/utils/decimal';
import {
  ConflictVersionException,
  DuplicateNumberException,
  ProblemException,
} from '../common/errors/problem.exception';

export interface RequirementLine {
  bomLineId: string;
  role: string;
  materialVariantId: string;
  qtyPerGarmentBase: number;
  allowancePct: number;
  requiredQtyBase: number;
}

export interface RequirementByMaterial {
  materialVariantId: string;
  requiredQtyBase: number;
  availableQtyBase: number;
  shortfall: number;
}

export interface RequirementResult {
  designId: string;
  bomVersionId: string;
  totalGarments: number;
  lines: RequirementLine[];
  byMaterial: RequirementByMaterial[];
  stockCheckPassed: boolean;
}

/** DSN-01 to DSN-06, JOB-01's calculator half (production order creation is in the jobwork module). */
@Injectable()
export class DesignsService extends MasterCrudService<Design> {
  constructor(
    @InjectModel(Design.name) model: Model<DesignDocument>,
    @InjectModel(DesignVariant.name) private readonly variantModel: Model<DesignVariantDocument>,
    @InjectModel(DesignBomVersion.name) private readonly bomModel: Model<DesignBomVersionDocument>,
    @InjectModel(DesignRateHistory.name)
    private readonly rateHistoryModel: Model<DesignRateHistoryDocument>,
    private readonly stockItemsService: StockItemsService,
    private readonly stockService: StockService,
  ) {
    super(model);
  }

  /** DSN-01, DSN-02: creating a design generates its colour x size variants immediately. */
  async create(dto: CreateDesignDto | Partial<Design>, actorId?: string): Promise<DesignDocument> {
    dto = dto as CreateDesignDto;
    let created: DesignDocument;
    try {
      created = await this.model.create({
        designNo: dto.designNo.trim(),
        name: dto.name,
        productCategoryId: new Types.ObjectId(dto.productCategoryId as unknown as string),
        productType: dto.productType,
        description: dto.description,
        colourOptions: dto.colourOptions.map((c) => new Types.ObjectId(c as unknown as string)),
        sizeOptions: dto.sizeOptions.map((s) => new Types.ObjectId(s as unknown as string)),
        expectedProductionQty: dto.expectedProductionQty,
        manufacturingInstructions: dto.manufacturingInstructions,
        notes: dto.notes,
        hsn: dto.hsn,
        createdBy: actorId,
        updatedBy: actorId,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new DuplicateNumberException(`Design number "${dto.designNo}" already exists.`);
      }
      throw err;
    }

    await this.generateVariants(String(created._id), dto.colourOptions, dto.sizeOptions, actorId!);

    if (dto.defaultSellingRate !== undefined) {
      await this.setRate(String(created._id), dto.defaultSellingRate, actorId!);
    }

    return created;
  }

  async update(
    id: string,
    dto: UpdateDesignDto | Partial<Design>,
    actorId?: string,
    expectedVersion?: number,
  ): Promise<DesignDocument> {
    dto = dto as UpdateDesignDto;
    const design = await this.model.findById(id);
    if (!design) throw new ProblemException('NOT_FOUND', 404, 'Design not found.');
    if (expectedVersion !== undefined && design.version !== expectedVersion) {
      throw new ConflictVersionException();
    }

    if (dto.name !== undefined) design.name = dto.name;
    if (dto.productCategoryId !== undefined)
      design.productCategoryId = new Types.ObjectId(dto.productCategoryId);
    if (dto.productType !== undefined) design.productType = dto.productType;
    if (dto.description !== undefined) design.description = dto.description;
    if (dto.expectedProductionQty !== undefined)
      design.expectedProductionQty = dto.expectedProductionQty;
    if (dto.manufacturingInstructions !== undefined)
      design.manufacturingInstructions = dto.manufacturingInstructions;
    if (dto.notes !== undefined) design.notes = dto.notes;
    if (dto.hsn !== undefined) design.hsn = dto.hsn;

    if (dto.colourOptions)
      design.colourOptions = dto.colourOptions.map((c) => new Types.ObjectId(c));
    if (dto.sizeOptions) design.sizeOptions = dto.sizeOptions.map((s) => new Types.ObjectId(s));
    design.updatedBy = actorId as any;
    design.version += 1;
    await design.save();

    // New combinations only - existing variants (possibly already stocked) are never removed.
    if (dto.colourOptions || dto.sizeOptions) {
      await this.generateVariants(
        id,
        design.colourOptions.map(String),
        design.sizeOptions.map(String),
        actorId!,
      );
    }

    return design;
  }

  /** DSN-02. Idempotent: only missing combinations are inserted. */
  async generateVariants(
    designId: string,
    colourIds: string[],
    sizeIds: string[],
    actorId: string,
  ) {
    const designObjectId = new Types.ObjectId(designId);
    for (const colourId of colourIds) {
      for (const sizeId of sizeIds) {
        await this.variantModel.updateOne(
          {
            designId: designObjectId,
            colourId: new Types.ObjectId(colourId),
            sizeId: new Types.ObjectId(sizeId),
          },
          { $setOnInsert: { createdBy: actorId, updatedBy: actorId } },
          { upsert: true },
        );
      }
    }
    return this.listVariants(designId);
  }

  listVariants(designId: string) {
    return this.variantModel
      .find({ designId: new Types.ObjectId(designId) })
      .populate('colourId sizeId')
      .lean();
  }

  // ---- BOM (DSN-03, DSN-04) ----

  async getCurrentBom(designId: string): Promise<DesignBomVersionDocument | null> {
    return this.bomModel.findOne({ designId: new Types.ObjectId(designId), isActive: true });
  }

  async getBomHistory(designId: string) {
    return this.bomModel
      .find({ designId: new Types.ObjectId(designId) })
      .sort({ versionNo: -1 })
      .lean();
  }

  /** DSN-04: always creates a new version; never mutates a prior one. */
  async setBom(
    designId: string,
    lines: BomLineInputDto[],
    actorId: string,
  ): Promise<DesignBomVersionDocument> {
    const design = await this.model.findById(designId).lean();
    if (!design) throw new ProblemException('NOT_FOUND', 404, 'Design not found.');

    const previous = await this.bomModel
      .findOne({ designId: new Types.ObjectId(designId) })
      .sort({ versionNo: -1 })
      .lean();
    const nextVersionNo = (previous?.versionNo ?? 0) + 1;

    if (previous) {
      await this.bomModel.updateOne({ _id: previous._id }, { $set: { isActive: false } });
    }

    return this.bomModel.create({
      designId: new Types.ObjectId(designId),
      versionNo: nextVersionNo,
      lines: lines.map((l) => ({
        role: l.role,
        materialVariantId: new Types.ObjectId(l.materialVariantId),
        qtyPerGarmentBase: l.qtyPerGarmentBase,
        allowancePct: l.allowancePct ?? 0,
      })),
      isActive: true,
      createdBy: actorId,
    });
  }

  // ---- Selling rate (DSN-06) ----

  async setRate(designId: string, rate: number, actorId: string): Promise<void> {
    const design = await this.model.findById(designId);
    if (!design) throw new ProblemException('NOT_FOUND', 404, 'Design not found.');

    await this.rateHistoryModel.create({
      designId: new Types.ObjectId(designId),
      rate,
      effectiveFrom: new Date(),
      createdBy: actorId,
    });

    // Goes through the Design document's own save() (not a raw updateOne) so the generic
    // audit_log (via the schema's auditPlugin) records the before/after defaultSellingRate -
    // the exit criterion "a rate change shows previous and new values in the audit log".
    design.defaultSellingRate = rate;
    design.updatedBy = actorId as any;
    design.version += 1;
    await design.save();
  }

  getRateHistory(designId: string) {
    return this.rateHistoryModel
      .find({ designId: new Types.ObjectId(designId) })
      .sort({ effectiveFrom: -1 })
      .lean();
  }

  // ---- Requirement calculator (DSN-05) ----

  /**
   * garments x BOM (+ allowance) = required material, compared with stock (DSN-05). Pure
   * calculation - nothing is persisted here; ProductionOrdersService.create (jobwork module)
   * persists a snapshot of this same computation for a specific colour/size breakdown.
   */
  async calculateRequirement(designId: string, totalGarments: number): Promise<RequirementResult> {
    const bomVersion = await this.getCurrentBom(designId);
    if (!bomVersion) {
      throw new ProblemException(
        'VALIDATION_FAILED',
        422,
        'This design has no active BOM configured.',
      );
    }

    const lines: RequirementLine[] = bomVersion.lines.map((line) => ({
      bomLineId: String(line._id),
      role: line.role,
      materialVariantId: String(line.materialVariantId),
      qtyPerGarmentBase: line.qtyPerGarmentBase,
      allowancePct: line.allowancePct,
      requiredQtyBase: roundQty(
        toDecimal(totalGarments)
          .times(line.qtyPerGarmentBase)
          .times(toDecimal(1).plus(toDecimal(line.allowancePct).dividedBy(100))),
      ),
    }));

    const byMaterialMap = new Map<string, number>();
    for (const line of lines) {
      byMaterialMap.set(
        line.materialVariantId,
        (byMaterialMap.get(line.materialVariantId) ?? 0) + line.requiredQtyBase,
      );
    }

    const byMaterial: RequirementByMaterial[] = [];
    let stockCheckPassed = true;
    for (const [materialVariantId, requiredQtyBase] of byMaterialMap) {
      const stockItems = await this.stockItemsService.list({
        materialVariantId: new Types.ObjectId(materialVariantId),
      });
      let availableQtyBase = 0;
      if (stockItems.length > 0) {
        const [availability] = await this.stockService.availability([
          String((stockItems[0] as any)._id),
        ]);
        availableQtyBase = availability?.onHand ?? 0;
      }
      const shortfall = roundQty(Math.max(0, requiredQtyBase - availableQtyBase));
      if (shortfall > 0) stockCheckPassed = false;
      byMaterial.push({
        materialVariantId,
        requiredQtyBase: roundQty(requiredQtyBase),
        availableQtyBase,
        shortfall,
      });
    }

    return {
      designId,
      bomVersionId: String(bomVersion._id),
      totalGarments,
      lines,
      byMaterial,
      stockCheckPassed,
    };
  }
}
