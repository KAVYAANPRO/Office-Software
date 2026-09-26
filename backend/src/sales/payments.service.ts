import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { PaymentAllocation, PaymentAllocationDocument } from './schemas/payment-allocation.schema';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { TransactionService } from '../common/services/transaction.service';
import { roundMoney } from '../common/utils/decimal';
import { ProblemException } from '../common/errors/problem.exception';
import { castObjectIdFilter } from '../common/utils/cast-filter';
import { RecordPaymentDto } from './dto/payment.dto';

/** SAL-09, tech.md §8.4 (R1 minimal). Invoice payment status is always derived from allocations, never hand-set. */
@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private readonly model: Model<PaymentDocument>,
    @InjectModel(PaymentAllocation.name)
    private readonly allocationModel: Model<PaymentAllocationDocument>,
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<InvoiceDocument>,
    private readonly transactionService: TransactionService,
  ) {}

  list(filter: Record<string, unknown> = {}) {
    return this.model
      .find(castObjectIdFilter(filter, ['customerId']))
      .sort({ date: -1 })
      .lean();
  }

  allocationsForPayment(paymentId: string) {
    return this.allocationModel.find({ paymentId: new Types.ObjectId(paymentId) }).lean();
  }

  allocationsForInvoice(invoiceId: string) {
    return this.allocationModel.find({ invoiceId: new Types.ObjectId(invoiceId) }).lean();
  }

  /** SAL-09: pending-payments dashboard - every confirmed invoice not yet fully paid. */
  async pendingInvoices() {
    const invoices = await this.invoiceModel
      .find({ status: 'CONFIRMED', paymentStatus: { $ne: 'PAID' } })
      .sort({ docDate: 1 })
      .lean();
    const allocations = await this.allocationModel
      .find({ invoiceId: { $in: invoices.map((i) => i._id) } })
      .lean();
    const allocatedByInvoice = new Map<string, number>();
    for (const a of allocations) {
      const key = String(a.invoiceId);
      allocatedByInvoice.set(key, (allocatedByInvoice.get(key) ?? 0) + a.amount);
    }
    return invoices.map((inv) => {
      const allocated = allocatedByInvoice.get(String(inv._id)) ?? 0;
      return {
        invoiceId: String(inv._id),
        docNo: inv.docNo,
        customerId: String(inv.customerId),
        grandTotal: inv.grandTotal,
        allocated: roundMoney(allocated),
        outstanding: roundMoney(inv.grandTotal - allocated),
        paymentStatus: inv.paymentStatus,
      };
    });
  }

  async record(dto: RecordPaymentDto, actorId: string): Promise<PaymentDocument> {
    return this.transactionService.run(async (session) => {
      const allocations = dto.allocations ?? [];
      const totalAllocated = roundMoney(allocations.reduce((s, a) => s + a.amount, 0));
      if (totalAllocated > dto.amount + 0.005) {
        throw new ProblemException(
          'VALIDATION_FAILED',
          422,
          'Allocations cannot exceed the payment amount.',
        );
      }

      const [payment] = await this.model.create(
        [
          {
            customerId: new Types.ObjectId(dto.customerId),
            date: new Date(dto.date),
            amount: dto.amount,
            mode: dto.mode,
            reference: dto.reference,
            amountAllocated: totalAllocated,
            createdBy: actorId,
          },
        ],
        { session },
      );

      for (const alloc of allocations) {
        const invoice = await this.invoiceModel.findById(alloc.invoiceId).session(session);
        if (!invoice)
          throw new ProblemException('NOT_FOUND', 404, `Invoice ${alloc.invoiceId} not found.`);
        if (invoice.status !== 'CONFIRMED') {
          throw new ProblemException(
            'VALIDATION_FAILED',
            422,
            `Invoice ${invoice.docNo} is not confirmed.`,
          );
        }
        const existing = await this.allocationModel
          .find({ invoiceId: invoice._id })
          .session(session)
          .lean();
        const alreadyAllocated = existing.reduce((s, a) => s + a.amount, 0);
        const outstanding = roundMoney(invoice.grandTotal - alreadyAllocated);
        if (alloc.amount > outstanding + 0.005) {
          throw new ProblemException(
            'VALIDATION_FAILED',
            422,
            `Allocation of ${alloc.amount} exceeds invoice ${invoice.docNo}'s outstanding ${outstanding}.`,
          );
        }

        await this.allocationModel.create(
          [{ paymentId: payment._id, invoiceId: invoice._id, amount: alloc.amount }],
          { session },
        );

        await this.refreshPaymentStatus(String(invoice._id), session);
      }

      return payment;
    });
  }

  /** Removes one allocation, e.g. to unblock an invoice cancellation (tech.md §8.3). */
  async unallocate(paymentId: string, invoiceId: string): Promise<void> {
    return this.transactionService.run(async (session) => {
      const allocation = await this.allocationModel
        .findOne({
          paymentId: new Types.ObjectId(paymentId),
          invoiceId: new Types.ObjectId(invoiceId),
        })
        .session(session);
      if (!allocation)
        throw new ProblemException('NOT_FOUND', 404, 'Payment allocation not found.');

      await this.allocationModel.deleteOne({ _id: allocation._id }).session(session);

      const payment = await this.model.findById(paymentId).session(session);
      if (payment) {
        payment.amountAllocated = roundMoney(
          Math.max(0, payment.amountAllocated - allocation.amount),
        );
        await payment.save({ session });
      }

      await this.refreshPaymentStatus(invoiceId, session);
    });
  }

  private async refreshPaymentStatus(
    invoiceId: string,
    session: import('mongoose').ClientSession,
  ): Promise<void> {
    const invoice = await this.invoiceModel.findById(invoiceId).session(session);
    if (!invoice) return;
    const allocations = await this.allocationModel
      .find({ invoiceId: invoice._id })
      .session(session)
      .lean();
    const allocated = roundMoney(allocations.reduce((s, a) => s + a.amount, 0));
    invoice.paymentStatus =
      allocated <= 0.005 ? 'UNPAID' : allocated >= invoice.grandTotal - 0.005 ? 'PAID' : 'PARTIAL';
    await invoice.save({ session });
  }
}
