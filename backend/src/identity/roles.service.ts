import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { ProblemException } from '../common/errors/problem.exception';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>) {}

  list() {
    return this.roleModel.find().sort({ name: 1 }).lean();
  }

  async findByKey(key: string) {
    const role = await this.roleModel.findOne({ key }).lean();
    if (!role) throw new ProblemException('NOT_FOUND', 404, `Role ${key} not found.`);
    return role;
  }

  async create(key: string, name: string, permissions: string[], createdBy?: string) {
    const created = await this.roleModel.create({
      key,
      name,
      permissions,
      createdBy,
      updatedBy: createdBy,
    });
    return created.toObject();
  }

  async setPermissions(key: string, permissions: string[], updatedBy?: string) {
    const role = await this.roleModel.findOneAndUpdate(
      { key },
      { $set: { permissions, updatedBy }, $inc: { version: 1 } },
      { new: true },
    );
    if (!role) throw new ProblemException('NOT_FOUND', 404, `Role ${key} not found.`);
    return role.toObject();
  }

  async deactivate(key: string, updatedBy?: string) {
    const role = await this.roleModel.findOneAndUpdate(
      { key },
      { $set: { isActive: false, updatedBy }, $inc: { version: 1 } },
      { new: true },
    );
    if (!role) throw new ProblemException('NOT_FOUND', 404, `Role ${key} not found.`);
    return role.toObject();
  }
}
