import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { auditPlugin } from '../../common/plugins/audit.plugin';
import { BaseDocumentFields } from '../../common/schemas/base.schema';

export const SALES_ORDER_STATUSES = [
  'DRAFT',
  'CONFIRMED',
  'PARTIALLY_INVOICED',
  'INVOICED',
  'CANCELLED',
] as const;
export type SalesOrderStatus = (typeof SALES_ORDER_STATUSES)[number];

@Schema({ _id: true })
export class SalesOrderLine {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DesignVariant', required: true })
  designVariantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StockItem', required: true })
  stockItemId!: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0.001 })
  qty!: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  qtyInvoiced!: number;

  @Prop({ type: Number, required: true, min: 0 })
  unitRate!: number;

  @Prop({ type: Number, required: true, default: 0, min: 0, max: 100 })
  discountPct!: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  extraDiscountAmt!: number;
}
export const SalesOrderLineSchema = SchemaFactory.createForClass(SalesOrderLine);

/**
 * SAL-01, SAL-02, SAL-03. Rule 6 (prd.md): confirming an order never moves stock - only the
 * ATP check at confirm time (SalesOrdersService.confirm) prevents oversell; stock itself only
 * changes when an invoice is confirmed (SAL-07).
 */
@Schema({ collection: 'sales_orders', timestamps: true })
export class SalesOrder extends BaseDocumentFields {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId!: Types.ObjectId;

  @Prop({ type: [SalesOrderLineSchema], required: true, default: [] })
  lines!: Types.DocumentArray<SalesOrderLine>;

  @Prop({ type: String, enum: SALES_ORDER_STATUSES, required: true, default: 'DRAFT' })
  status!: SalesOrderStatus;

  @Prop({ type: String, required: false })
  notes?: string;
}

export type SalesOrderDocument = SalesOrder & Document;
export const SalesOrderSchema = SchemaFactory.createForClass(SalesOrder);
SalesOrderSchema.plugin(auditPlugin, { module: 'sales', entityType: 'SalesOrder' });
