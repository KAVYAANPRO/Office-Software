import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { auditPlugin } from '../../common/plugins/audit.plugin';
import { BaseDocumentFields } from '../../common/schemas/base.schema';

export const INWARD_STATUSES = ['DRAFT', 'CONFIRMED', 'CANCELLED'] as const;
export type InwardStatus = (typeof INWARD_STATUSES)[number];

@Schema({ _id: true })
export class InwardLine {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  purchaseLineId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'MaterialVariant', required: true })
  materialVariantId!: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0.001 })
  qty!: number;

  /** Converted to the material's base unit at the purchase line's own unit (MST-04). */
  @Prop({ type: Number, required: true, min: 0.001 })
  qtyBase!: number;

  /** Blank means "create a new lot automatically" (INW-02 - traceability is never partial). */
  @Prop({ type: String, required: false })
  lotNo?: string;

  @Prop({ type: Types.ObjectId, ref: 'StockLot', required: false })
  createdLotId?: Types.ObjectId;

  /** Snapshot of the purchase line's landed unit cost at confirm time. */
  @Prop({ type: Number, required: false, min: 0 })
  unitCost?: number;
}
export const InwardLineSchema = SchemaFactory.createForClass(InwardLine);

/**
 * INW-01 to INW-05. Confirming puts material into stock at `locationId` as new lots
 * carrying the purchase line's landed unit cost (BR-01, STK-01). Partial and multiple
 * inwards per purchase are allowed; over-receipt beyond a configurable tolerance is blocked
 * (checked in InwardsService, not here).
 */
@Schema({ collection: 'inwards', timestamps: true })
export class Inward extends BaseDocumentFields {
  @Prop({ type: Types.ObjectId, ref: 'Purchase', required: true, index: true })
  purchaseId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true })
  supplierId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StockLocation', required: true })
  locationId!: Types.ObjectId;

  @Prop({ type: [InwardLineSchema], required: true, default: [] })
  lines!: InwardLine[];

  @Prop({ type: String, required: false })
  remarks?: string;

  @Prop({ type: String, enum: INWARD_STATUSES, required: true, default: 'DRAFT' })
  status!: InwardStatus;
}

export type InwardDocument = Inward & Document;
export const InwardSchema = SchemaFactory.createForClass(Inward);
InwardSchema.plugin(auditPlugin, { module: 'purchasing', entityType: 'Inward' });
