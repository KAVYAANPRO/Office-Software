import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MasterCrudService } from '../common/services/master-crud.service';
import {
  Material,
  MaterialDocument,
  MaterialVariant,
  MaterialVariantDocument,
} from './schemas/material.schema';
import { ProblemException } from '../common/errors/problem.exception';

@Injectable()
export class MaterialsService extends MasterCrudService<Material> {
  constructor(
    @InjectModel(Material.name) model: Model<MaterialDocument>,
    @InjectModel(MaterialVariant.name)
    private readonly variantModel: Model<MaterialVariantDocument>,
  ) {
    super(model);
  }

  listVariants(materialId: string) {
    return this.variantModel.find({ materialId }).populate('colourId').lean();
  }

  async createVariant(
    materialId: string,
    colourId: string,
    code: string | undefined,
    actorId?: string,
  ) {
    const exists = await this.variantModel.findOne({ materialId, colourId });
    if (exists) {
      throw new ProblemException(
        'DUPLICATE_NUMBER',
        409,
        'This material/colour combination already exists.',
      );
    }
    const created = await this.variantModel.create({
      materialId,
      colourId,
      code,
      createdBy: actorId,
      updatedBy: actorId,
    });
    return created.toObject();
  }
}
