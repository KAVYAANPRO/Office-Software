import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { auditPlugin } from '../../common/plugins/audit.plugin';
import { BaseDocumentFields } from '../../common/schemas/base.schema';

export const JOB_TYPES = ['PROCESSING', 'MANUFACTURING'] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const CHARGE_BASES = ['PER_PIECE', 'PER_METER', 'LUMP_SUM'] as const;
export type ChargeBasis = (typeof CHARGE_BASES)[number];

/** tech.md §7.2. Mirrored by JobSlipsService's transition map and tested for every (from, to) pair. */
export const JOB_SLIP_STATUSES = [
  'CREATED',
  'MATERIAL_ISSUED',
  'IN_PROCESS',
  'READY',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CLOSED',
  'CANCELLED',
] as const;
export type JobSlipStatus = (typeof JOB_SLIP_STATUSES)[number];

@Schema({ _id: true })
export class JobSlipExpectedOutputLine {
  _id!: Types.ObjectId;

  /** MANUFACTURING: the design variant being made. */
  @Prop({ type: Types.ObjectId, ref: 'Colour', required: false })
  colourId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Size', required: false })
  sizeId?: Types.ObjectId;

  /** PROCESSING: the output material variant (e.g. Printed Fabric - Blue). */
  @Prop({ type: Types.ObjectId, ref: 'MaterialVariant', required: false })
  materialVariantId?: Types.ObjectId;

  /** Pieces for MANUFACTURING, base-unit quantity for PROCESSING. */
  @Prop({ type: Number, required: true, min: 0 })
  expectedQty!: number;
}
export const JobSlipExpectedOutputLineSchema =
  SchemaFactory.createForClass(JobSlipExpectedOutputLine);

/** JOB-14/BR-14: a factory's claim, not stock - only an internal-confirmed JobReceipt ever posts to the ledger. */
@Schema({ _id: false })
export class DispatchDeclaration {
  @Prop({ type: Number, required: true, min: 0 })
  qty!: number;

  @Prop({ type: String, required: false })
  note?: string;

  @Prop({ type: Date, required: true, default: () => new Date() })
  declaredAt!: Date;
}
export const DispatchDeclarationSchema = SchemaFactory.createForClass(DispatchDeclaration);

/**
 * JOB-02/JOB-03. One job slip = one party and one design (prd.md §4.7). Charge basis and
 * agreed rate are the PLAN; the ACTUAL charge is only ever written once, to `job_charges`,
 * when a receipt is confirmed (BR-13) - never here.
 */
@Schema({ collection: 'job_slips', timestamps: true })
export class JobSlip extends BaseDocumentFields {
  @Prop({ type: String, enum: JOB_TYPES, required: true })
  jobType!: JobType;

  @Prop({ type: Types.ObjectId, ref: 'JobWorker', required: true, index: true })
  jobWorkerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Design', required: true })
  designId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductionOrder', required: false })
  productionOrderId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProcessingType', required: false })
  processingTypeId?: Types.ObjectId;

  @Prop({ type: [JobSlipExpectedOutputLineSchema], required: true, default: [] })
  expectedOutputLines!: Types.DocumentArray<JobSlipExpectedOutputLine>;

  @Prop({ type: Date, required: false })
  expectedCompletionDate?: Date;

  @Prop({ type: String, enum: CHARGE_BASES, required: true })
  chargeBasis!: ChargeBasis;

  @Prop({ type: Number, required: true, min: 0 })
  agreedRate!: number;

  @Prop({ type: String, required: false })
  instructions?: string;

  @Prop({ type: String, required: false })
  remarks?: string;

  @Prop({ type: String, enum: JOB_SLIP_STATUSES, required: true, default: 'CREATED' })
  status!: JobSlipStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  closedBy?: Types.ObjectId;

  @Prop({ type: Date, required: false })
  closedAt?: Date;

  @Prop({ type: [DispatchDeclarationSchema], default: [] })
  dispatchDeclarations!: DispatchDeclaration[];
}

export type JobSlipDocument = JobSlip & Document;
export const JobSlipSchema = SchemaFactory.createForClass(JobSlip);
JobSlipSchema.plugin(auditPlugin, { module: 'jobwork', entityType: 'JobSlip' });
