import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Purchase, PurchaseDocument, PurchaseLine } from './schemas/purchase.schema';
import { Inward, InwardDocument } from './schemas/inward.schema';
import { MaterialVariant, MaterialVariantDocument } from '../master/schemas/material.schema';
import { UomsService } from '../master/uoms.service';
import { NumberSeriesService } from '../common/services/number-series.service';
import { CompanySettingsService } from '../master/company-settings.service';
import { apportionOtherCharges } from './apportionment.util';
import { roundMoney, roundQty, roundUnitCost, toDecimal } from '../common/utils/decimal';
import {
  ConflictVersionException,
  DuplicateNumberException,
  InvalidStateTransitionException,
  ProblemException,
} from '../common/errors/problem.exception';
import { CreatePurchaseDto, PurchaseLineInputDto, UpdatePurchaseDto } from './dto/purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectModel(Purchase.name) private readonly model: Model<PurchaseDocument>,
    @InjectModel(Inward.name) private readonly inwardModel: Model<InwardDocument>,
    @InjectModel(MaterialVariant.name)
    private readonly variantModel: Model<MaterialVariantDocument>,
    private readonly uomsService: UomsService,
    private readonly numberSeries: NumberSeriesService,
    private readonly companySettings: CompanySettingsService,
  ) {}

  list(filter: Record<string, unknown> = {}) {
    return this.model.find(filter).sort({ createdAt: -1 }).lean();
  }

  async findById(id: string) {
    const doc = await this.model.findById(id).lean();
    if (!doc) throw new ProblemException('NOT_FOUND', 404, 'Purchase not found.');
    return doc;
  }

  /** INW-05: confirmed/partially-received purchases still awaiting some material. */
  async pendingInward() {
    const purchases = await this.model
      .find({ status: { $in: ['CONFIRMED', 'PARTIALLY_RECEIVED'] } })
      .lean();
    return purchases.filter((p) => p.lines.some((l) => l.qtyReceivedBase < l.qtyBase - 0.0005));
  }

  async create(dto: CreatePurchaseDto, actorId: string): Promise<PurchaseDocument> {
    const lines = await this.buildLines(dto.lines);

    const settings = await this.companySettings.get();
    const fy = settings?.currentFinancialYear ?? new Date().getFullYear().toString();
    await this.numberSeries.ensureSeries('PURCHASE', fy, 'PUR');
    const docNo = await this.numberSeries.next('PURCHASE', fy);

    try {
      const [created] = await this.model.create([
        {
          docNo,
          docDate: new Date(),
          supplierId: dto.supplierId,
          supplierInvoiceNo: dto.supplierInvoiceNo,
          lines,
          otherCharges: roundMoney(dto.otherCharges ?? 0),
          notes: dto.notes,
          status: 'DRAFT',
          createdBy: actorId,
          updatedBy: actorId,
        },
      ]);
      return created;
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new DuplicateNumberException(
          `Supplier invoice ${dto.supplierInvoiceNo} was already entered for this supplier.`,
        );
      }
      throw err;
    }
  }

  async update(
    id: string,
    dto: UpdatePurchaseDto,
    actorId: string,
    expectedVersion?: number,
  ): Promise<PurchaseDocument> {
    const purchase = await this.model.findById(id);
    if (!purchase) throw new ProblemException('NOT_FOUND', 404, 'Purchase not found.');
    if (purchase.status !== 'DRAFT') {
      throw new InvalidStateTransitionException(
        'Only a draft purchase can be edited. Cancel and re-enter instead.',
      );
    }
    if (expectedVersion !== undefined && purchase.version !== expectedVersion) {
      throw new ConflictVersionException();
    }

    if (dto.lines) purchase.lines = (await this.buildLines(dto.lines)) as any;
    if (dto.supplierInvoiceNo !== undefined) purchase.supplierInvoiceNo = dto.supplierInvoiceNo;
    if (dto.otherCharges !== undefined) purchase.otherCharges = roundMoney(dto.otherCharges);
    if (dto.notes !== undefined) purchase.notes = dto.notes;
    purchase.updatedBy = actorId as any;
    purchase.version += 1;

    try {
      await purchase.save();
      return purchase;
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new DuplicateNumberException(
          `Supplier invoice ${dto.supplierInvoiceNo} was already entered for this supplier.`,
        );
      }
      throw err;
    }
  }

  /** PUR-05: confirming creates an expected receipt only - no stock effect (BR-01). */
  async confirm(id: string, actorId: string): Promise<PurchaseDocument> {
    const purchase = await this.model.findById(id);
    if (!purchase) throw new ProblemException('NOT_FOUND', 404, 'Purchase not found.');
    if (purchase.status !== 'DRAFT') {
      throw new InvalidStateTransitionException(`Purchase is already ${purchase.status}.`);
    }

    const amounts = purchase.lines.map((l) => l.amount);
    const shares = apportionOtherCharges(amounts, purchase.otherCharges);

    purchase.lines.forEach((line, i) => {
      line.otherChargesShare = shares[i];
      line.landedUnitCost = roundUnitCost(
        toDecimal(line.amount).plus(shares[i]).dividedBy(line.qtyBase),
      );
    });

    purchase.status = 'CONFIRMED';
    purchase.confirmedBy = actorId as any;
    purchase.confirmedAt = new Date();
    purchase.updatedBy = actorId as any;
    purchase.version += 1;
    await purchase.save();
    return purchase;
  }

  /** PUR-06: confirmed purchases are locked; cancel is blocked while any inward exists. */
  async cancel(id: string, reason: string, actorId: string): Promise<PurchaseDocument> {
    const purchase = await this.model.findById(id);
    if (!purchase) throw new ProblemException('NOT_FOUND', 404, 'Purchase not found.');
    if (purchase.status === 'CANCELLED') {
      throw new InvalidStateTransitionException('Purchase is already cancelled.');
    }

    const anyInward = await this.inwardModel.exists({
      purchaseId: purchase._id,
      status: { $ne: 'CANCELLED' },
    });
    if (anyInward) {
      throw new InvalidStateTransitionException(
        'Cannot cancel: at least one inward exists against this purchase. Cancel the inward(s) first.',
        { purchaseId: id },
      );
    }

    purchase.status = 'CANCELLED';
    purchase.cancelReason = reason;
    purchase.cancelledBy = actorId as any;
    purchase.cancelledAt = new Date();
    purchase.updatedBy = actorId as any;
    purchase.version += 1;
    await purchase.save();
    return purchase;
  }

  /** BR-11: notes/attachments stay editable even on a confirmed purchase. */
  async addAttachment(id: string, url: string, actorId: string): Promise<PurchaseDocument> {
    const purchase = await this.model.findByIdAndUpdate(
      id,
      { $push: { attachmentUrls: url }, $set: { updatedBy: actorId }, $inc: { version: 1 } },
      { new: true },
    );
    if (!purchase) throw new ProblemException('NOT_FOUND', 404, 'Purchase not found.');
    return purchase;
  }

  /** Called by InwardsService after a confirmed inward, to keep the pending-inward view accurate. */
  async bumpReceived(
    purchaseId: string,
    purchaseLineId: string,
    qtyBase: number,
    session: ClientSession,
  ): Promise<void> {
    await this.model.updateOne(
      { _id: purchaseId, 'lines._id': purchaseLineId },
      { $inc: { 'lines.$.qtyReceivedBase': qtyBase } },
      { session },
    );
    const purchase = await this.model.findById(purchaseId).session(session).lean();
    if (!purchase) return;
    const fullyReceived = purchase.lines.every((l) => l.qtyReceivedBase >= l.qtyBase - 0.0005);
    const anyReceived = purchase.lines.some((l) => l.qtyReceivedBase > 0.0005);
    // Falling back to `purchase.status` here (rather than 'CONFIRMED') was a bug: after an
    // inward cancellation drove every line's qtyReceivedBase back to 0, this must revert the
    // purchase to CONFIRMED, not silently keep whatever status it already had (e.g. a stale
    // RECEIVED from before the cancellation).
    const nextStatus = fullyReceived
      ? 'RECEIVED'
      : anyReceived
        ? 'PARTIALLY_RECEIVED'
        : 'CONFIRMED';
    if (nextStatus !== purchase.status) {
      await this.model.updateOne(
        { _id: purchaseId },
        { $set: { status: nextStatus } },
        { session },
      );
    }
  }

  private async buildLines(inputs: PurchaseLineInputDto[]): Promise<PurchaseLine[]> {
    const lines: PurchaseLine[] = [];
    for (const input of inputs) {
      // Unit conversions (MST-04) are keyed by materialId, not materialVariantId - resolve
      // the owning material first.
      const variant = await this.variantModel.findById(input.materialVariantId).lean();
      if (!variant) {
        throw new ProblemException(
          'NOT_FOUND',
          404,
          `Material variant ${input.materialVariantId} not found.`,
        );
      }
      const qtyBase = await this.uomsService.toBaseQuantity(
        String(variant.materialId),
        input.uomId,
        input.qty,
      );
      lines.push({
        materialVariantId: new Types.ObjectId(input.materialVariantId),
        uomId: new Types.ObjectId(input.uomId),
        qty: roundQty(input.qty),
        rate: input.rate,
        amount: roundMoney(toDecimal(input.qty).times(input.rate)),
        qtyBase,
        qtyReceivedBase: 0,
      } as unknown as PurchaseLine);
    }
    return lines;
  }
}
