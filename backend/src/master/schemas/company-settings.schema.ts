import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { auditPlugin } from '../../common/plugins/audit.plugin';

/**
 * MST-10. Singleton document (`key: 'default'` is always used - see CompanySettingsService).
 * Single company, single legal entity, INR only, Indian financial year (prd.md §1.6).
 */
@Schema({ collection: 'company_settings', timestamps: true })
export class CompanySettings {
  @Prop({ type: String, required: true, unique: true, default: 'default' })
  key!: string;

  @Prop({ type: String, required: true })
  legalName!: string;

  @Prop({ type: String, required: true })
  state!: string;

  @Prop({ type: String, required: false })
  gstin?: string;

  @Prop({ type: String, required: false })
  address?: string;

  @Prop({ type: String, required: true })
  currentFinancialYear!: string; // e.g. '26-27'

  /** INW-01: over-receipt beyond this percentage of a purchase line's ordered qty is blocked. */
  @Prop({ type: Number, default: 0, min: 0 })
  overReceiptTolerancePct!: number;

  /**
   * SHR-03. A single global tolerance rather than tech.md's more granular per-material,
   * per-process-type, per-party tolerance - a documented simplification given the size of
   * Phase 4; revisit if the business needs different tolerances per factory or material.
   */
  @Prop({ type: Number, default: 0, min: 0 })
  shortageTolerancePct!: number;

  @Prop({ type: Number, default: 1 })
  version!: number;
}

export type CompanySettingsDocument = CompanySettings & Document;
export const CompanySettingsSchema = SchemaFactory.createForClass(CompanySettings);
CompanySettingsSchema.plugin(auditPlugin, { module: 'master', entityType: 'CompanySettings' });
