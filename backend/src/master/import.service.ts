import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { parse } from 'csv-parse/sync';
import { ImportBatch, ImportBatchDocument } from './schemas/import-batch.schema';
import { SuppliersService } from './suppliers.service';
import { CustomersService } from './customers.service';
import { MaterialsService } from './materials.service';
import { JobWorkersService } from './job-workers.service';
import { CreateSupplierDto } from './dto/supplier.dto';
import { CreateCustomerDto } from './dto/customer.dto';
import { CreateMaterialDto } from './dto/material.dto';
import { CreateJobWorkerDto } from './dto/job-worker.dto';
import { ImportableEntity } from './dto/import.dto';
import { validateDto } from '../common/utils/validate-dto';
import { ProblemException, ValidationFailedException } from '../common/errors/problem.exception';

interface RowResult {
  row: number;
  ok: boolean;
  data?: Record<string, unknown>;
  reasons?: Record<string, string>;
}

export interface ImportReport {
  totalRows: number;
  validRows: number;
  rejectedRows: number;
  rejections: Array<{ row: number; reasons: Record<string, string> }>;
}

/**
 * MST-11 (go-live prerequisite, prd.md A-14). Dry run reports every rejected row with a
 * reason and changes nothing; commit is all-or-nothing so a partially-bad file can never
 * leave the database in a half-imported state - the operator fixes the CSV and reruns.
 * Opening-stock import is Phase 2 (it needs the stock engine); this covers the four entities
 * plan.md's Phase 1 scope calls out: suppliers, customers, materials, job workers.
 */
@Injectable()
export class ImportService {
  constructor(
    private readonly suppliers: SuppliersService,
    private readonly customers: CustomersService,
    private readonly materials: MaterialsService,
    private readonly jobWorkers: JobWorkersService,
    @InjectModel(ImportBatch.name) private readonly batchModel: Model<ImportBatchDocument>,
  ) {}

  async dryRun(entity: ImportableEntity, csv: string, actorId?: string): Promise<ImportReport> {
    const { results } = await this.validateRows(entity, csv);
    const report = this.toReport(results);
    await this.batchModel.create({
      entity,
      dryRun: true,
      committed: false,
      totalRows: report.totalRows,
      validRows: report.validRows,
      rejectedRows: report.rejectedRows,
      rejections: report.rejections,
      createdBy: actorId,
    });
    return report;
  }

  async commit(
    entity: ImportableEntity,
    csv: string,
    actorId?: string,
  ): Promise<{ imported: number }> {
    const { results } = await this.validateRows(entity, csv);
    const report = this.toReport(results);

    if (report.rejectedRows > 0) {
      await this.batchModel.create({
        entity,
        dryRun: false,
        committed: false,
        ...report,
        createdBy: actorId,
      });
      throw new ValidationFailedException(
        Object.fromEntries(
          report.rejections.map((r) => [`row_${r.row}`, JSON.stringify(r.reasons)]),
        ),
        `Import rejected: ${report.rejectedRows} of ${report.totalRows} row(s) failed validation. Nothing was imported - fix and retry.`,
      );
    }

    for (const r of results) {
      await this.createOne(entity, r.data!, actorId);
    }

    await this.batchModel.create({
      entity,
      dryRun: false,
      committed: true,
      totalRows: report.totalRows,
      validRows: report.validRows,
      rejectedRows: 0,
      createdBy: actorId,
    });

    return { imported: results.length };
  }

  private async validateRows(
    entity: ImportableEntity,
    csv: string,
  ): Promise<{ results: RowResult[] }> {
    let records: Record<string, unknown>[];
    try {
      records = parse(csv, { columns: true, skip_empty_lines: true, trim: true });
    } catch (err) {
      throw new ProblemException(
        'VALIDATION_FAILED',
        422,
        `Could not parse CSV: ${(err as Error).message}`,
      );
    }

    const dtoClass = this.dtoFor(entity);
    const results: RowResult[] = [];
    for (let i = 0; i < records.length; i++) {
      try {
        const dto = await validateDto(dtoClass, records[i]);
        results.push({ row: i + 1, ok: true, data: dto as Record<string, unknown> });
      } catch (err) {
        if (err instanceof ValidationFailedException) {
          results.push({ row: i + 1, ok: false, reasons: err.fieldErrors });
        } else {
          throw err;
        }
      }
    }
    return { results };
  }

  private toReport(results: RowResult[]): ImportReport {
    const rejections = results
      .filter((r) => !r.ok)
      .map((r) => ({ row: r.row, reasons: r.reasons! }));
    return {
      totalRows: results.length,
      validRows: results.length - rejections.length,
      rejectedRows: rejections.length,
      rejections,
    };
  }

  private dtoFor(entity: ImportableEntity): new () => object {
    switch (entity) {
      case 'suppliers':
        return CreateSupplierDto;
      case 'customers':
        return CreateCustomerDto;
      case 'materials':
        return CreateMaterialDto;
      case 'job-workers':
        return CreateJobWorkerDto;
      default:
        throw new ProblemException('VALIDATION_FAILED', 422, `Unknown import entity: ${entity}`);
    }
  }

  private async createOne(
    entity: ImportableEntity,
    data: Record<string, unknown>,
    actorId?: string,
  ) {
    switch (entity) {
      case 'suppliers':
        return this.suppliers.create(data, actorId);
      case 'customers':
        return this.customers.create(data, actorId);
      case 'materials':
        return this.materials.create(data, actorId);
      case 'job-workers':
        return this.jobWorkers.create(data as unknown as CreateJobWorkerDto, actorId);
      default:
        throw new ProblemException('VALIDATION_FAILED', 422, `Unknown import entity: ${entity}`);
    }
  }
}
