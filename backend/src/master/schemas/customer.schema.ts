import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { auditPlugin } from '../../common/plugins/audit.plugin';
import { BaseMasterFields } from '../../common/schemas/base.schema';

/** MST-08. */
@Schema({ collection: 'customers', timestamps: true })
export class Customer extends BaseMasterFields {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: false })
  businessName?: string;

  @Prop({ type: String, required: false })
  contactPerson?: string;

  @Prop({ type: String, required: false })
  mobile?: string;

  @Prop({ type: String, required: false })
  email?: string;

  @Prop({ type: String, required: false })
  billingAddress?: string;

  @Prop({ type: String, required: false })
  shippingAddress?: string;

  @Prop({ type: String, required: false, uppercase: true, trim: true })
  gstin?: string;

  /** Used for SAL-03 rate resolution: customer discount applies automatically. */
  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  defaultDiscountPct!: number;

  @Prop({ type: String, required: false })
  paymentTerms?: string;

  @Prop({ type: String, required: false })
  notes?: string;

  /** State is required for GST place-of-supply determination (§5.3). */
  @Prop({ type: String, required: false })
  state?: string;
}

export type CustomerDocument = Customer & Document;
export const CustomerSchema = SchemaFactory.createForClass(Customer);
CustomerSchema.index({ name: 1 });
CustomerSchema.plugin(auditPlugin, { module: 'master', entityType: 'Customer' });
