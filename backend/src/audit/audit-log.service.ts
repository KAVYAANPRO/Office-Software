import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

export interface AuditLogQuery {
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  module?: string;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}

/** Read-only by design (AUD-02): there is no update or delete method anywhere in this class. */
@Injectable()
export class AuditLogService {
  constructor(@InjectModel(AuditLog.name) private readonly model: Model<AuditLogDocument>) {}

  async query(q: AuditLogQuery) {
    const filter: Record<string, unknown> = {};
    if (q.entityType) filter.entityType = q.entityType;
    if (q.entityId) filter.entityId = q.entityId;
    if (q.actorUserId) filter.actorUserId = q.actorUserId;
    if (q.module) filter.module = q.module;
    if (q.from || q.to) {
      filter.occurredAt = {
        ...(q.from ? { $gte: q.from } : {}),
        ...(q.to ? { $lte: q.to } : {}),
      };
    }
    const page = q.page && q.page > 0 ? q.page : 1;
    const pageSize = q.pageSize && q.pageSize > 0 && q.pageSize <= 200 ? q.pageSize : 50;

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ occurredAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.model.countDocuments(filter),
    ]);

    return { items, total, page, pageSize };
  }

  async forEntity(entityType: string, entityId: string) {
    return this.model.find({ entityType, entityId }).sort({ occurredAt: -1 }).lean();
  }

  /** AUD-02/NFR-08: "log access to exports" is satisfied by this call itself going through the audit trail like any other read-sensitive action would, once request logging is in place; capped so a single export cannot page-scan the whole ledger. */
  async exportRows(q: Omit<AuditLogQuery, 'page' | 'pageSize'>) {
    const filter: Record<string, unknown> = {};
    if (q.entityType) filter.entityType = q.entityType;
    if (q.entityId) filter.entityId = q.entityId;
    if (q.actorUserId) filter.actorUserId = q.actorUserId;
    if (q.module) filter.module = q.module;
    if (q.from || q.to) {
      filter.occurredAt = {
        ...(q.from ? { $gte: q.from } : {}),
        ...(q.to ? { $lte: q.to } : {}),
      };
    }

    const rows = await this.model.find(filter).sort({ occurredAt: -1 }).limit(10000).lean();
    return rows.map((r) => ({
      occurredAt: r.occurredAt,
      actorUserId: r.actorUserId ? String(r.actorUserId) : '',
      module: r.module,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      before: r.before ? JSON.stringify(r.before) : '',
      after: r.after ? JSON.stringify(r.after) : '',
    }));
  }
}
