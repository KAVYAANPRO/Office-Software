import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { auditPlugin } from '../../common/plugins/audit.plugin';
import { BaseDocumentFields } from '../../common/schemas/base.schema';

export const JOB_RECEIPT_STATUSES = ['DRAFT', 'CONFIRMED', 'CANCELLED'] as const;
export type JobReceiptStatus = (typeof JOB_RECEIPT_STATUSES)[number];

/**
 * JOB-08/JOB-09. One shape covers both job types (tech.md's job_receipt_lines):
 * MANUFACTURING populates colourId/sizeId + accepted/rejected/damaged; PROCESSING populates
 * materialVariantId (the output) and only receivedQtyBase (accepted === received - there is
 * no reject/damage split for a processing conversion).
 */
@Schema({ _id: true })
export class JobReceiptLine {
  _id!: Types.ObjectId;

  // MANUFACTURING
  @Prop({ type: Types.ObjectId, ref: 'Colour', required: false })
  colourId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Size', required: false })
  sizeId?: Types.ObjectId;

  // PROCESSING
  @Prop({ type: Types.ObjectId, ref: 'MaterialVariant', required: false })
  materialVariantId?: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0 })
  expectedQty!: number;

  @Prop({ type: Number, required: true, min: 0 })
  receivedQty!: number;

  @Prop({ type: Number, required: false, min: 0 })
  acceptedQty?: number;

  @Prop({ type: Number, required: false, min: 0, default: 0 })
  rejectedQty?: number;

  @Prop({ type: Number, required: false, min: 0, default: 0 })
  damagedQty?: number;

  @Prop({ type: Types.ObjectId, ref: 'StockLot', required: false })
  createdLotId?: Types.ObjectId;
}
export const JobReceiptLineSchema = SchemaFactory.createForClass(JobReceiptLine);

@Schema({ collection: 'job_receipts', timestamps: true })
export class JobReceipt extends BaseDocumentFields {
  @Prop({ type: Types.ObjectId, ref: 'JobSlip', required: true, index: true })
  jobSlipId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobWorker', required: true, index: true })
  jobWorkerId!: Types.ObjectId;

  @Prop({ type: [JobReceiptLineSchema], required: true, default: [] })
  lines!: Types.DocumentArray<JobReceiptLine>;

  @Prop({ type: Number, required: false, min: 0 })
  otherCharges?: number;

  @Prop({ type: String, required: false })
  remarks?: string;

  @Prop({ type: String, enum: JOB_RECEIPT_STATUSES, required: true, default: 'DRAFT' })
  status!: JobReceiptStatus;
}

export type JobReceiptDocument = JobReceipt & Document;
export const JobReceiptSchema = SchemaFactory.createForClass(JobReceipt);
JobReceiptSchema.plugin(auditPlugin, { module: 'jobwork', entityType: 'JobReceipt' });
