import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobSlip, JobSlipDocument } from '../jobwork/schemas/job-slip.schema';
import { JobReceipt, JobReceiptDocument } from '../jobwork/schemas/job-receipt.schema';
import { Purchase, PurchaseDocument } from '../purchasing/schemas/purchase.schema';
import { Inward, InwardDocument } from '../purchasing/schemas/inward.schema';
import { Invoice, InvoiceDocument } from '../sales/schemas/invoice.schema';
import { SalesOrder, SalesOrderDocument } from '../sales/schemas/sales-order.schema';
import { Design, DesignDocument } from '../design/schemas/design.schema';
import { Customer, CustomerDocument } from '../master/schemas/customer.schema';
import { StockItem, StockItemDocument } from '../inventory/schemas/stock-item.schema';
import { StockBalance, StockBalanceDocument } from '../inventory/schemas/stock-balance.schema';
import { StockQueryService } from '../inventory/stock-query.service';
import { ReadyStockService } from '../readystock/ready-stock.service';
import { PackingService } from '../readystock/packing.service';
import { PaymentsService } from '../sales/payments.service';
import { roundMoney, roundQty } from '../common/utils/decimal';

const OPEN_JOB_STATUSES = ['MATERIAL_ISSUED', 'IN_PROCESS', 'READY', 'PARTIALLY_RECEIVED'];

/**
 * DSH-01, prd.md §6.1. Core KPIs only (advanced/trend KPIs are R2). Every number here is
 * computed live from existing collections - nothing is a separately-maintained counter, so
 * these can never drift from the data they summarise.
 */
@Injectable()
export class DashboardsService {
  constructor(
    @InjectModel(JobSlip.name) private readonly jobSlipModel: Model<JobSlipDocument>,
    @InjectModel(JobReceipt.name) private readonly receiptModel: Model<JobReceiptDocument>,
    @InjectModel(Purchase.name) private readonly purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Inward.name) private readonly inwardModel: Model<InwardDocument>,
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<InvoiceDocument>,
    @InjectModel(SalesOrder.name) private readonly salesOrderModel: Model<SalesOrderDocument>,
    @InjectModel(Design.name) private readonly designModel: Model<DesignDocument>,
    @InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(StockItem.name) private readonly stockItemModel: Model<StockItemDocument>,
    @InjectModel(StockBalance.name) private readonly balanceModel: Model<StockBalanceDocument>,
    private readonly stockQueryService: StockQueryService,
    private readonly readyStockService: ReadyStockService,
    private readonly packingService: PackingService,
    private readonly paymentsService: PaymentsService,
  ) {}

  private async rawStockValue(): Promise<number> {
    const rawItemIds = await this.stockItemModel
      .find({ kind: { $ne: 'FINISHED_GOOD' } })
      .distinct('_id');
    const rows = await this.balanceModel.aggregate([
      { $match: { stockItemId: { $in: rawItemIds }, qty: { $ne: 0 } } },
      {
        $lookup: {
          from: 'stock_locations',
          localField: 'locationId',
          foreignField: '_id',
          as: 'loc',
        },
      },
      { $unwind: '$loc' },
      { $match: { 'loc.kind': 'WAREHOUSE' } },
      { $lookup: { from: 'stock_lots', localField: 'lotId', foreignField: '_id', as: 'lot' } },
      { $unwind: '$lot' },
      { $group: { _id: null, value: { $sum: { $multiply: ['$qty', '$lot.unitCost'] } } } },
    ]);
    return roundMoney(rows[0]?.value ?? 0);
  }

  private async materialWithFactoriesQty(): Promise<number> {
    const rows = await this.balanceModel.aggregate([
      { $match: { qty: { $ne: 0 } } },
      {
        $lookup: {
          from: 'stock_locations',
          localField: 'locationId',
          foreignField: '_id',
          as: 'loc',
        },
      },
      { $unwind: '$loc' },
      { $match: { 'loc.kind': 'FACTORY_CUSTODY' } },
      { $group: { _id: null, qty: { $sum: '$qty' } } },
    ]);
    return roundQty(rows[0]?.qty ?? 0);
  }

  async admin() {
    const [
      rawStockValue,
      readyStockRows,
      materialWithFactories,
      jobsInProgress,
      pendingJobs,
      salesTotal,
      pendingPayments,
      lowStock,
    ] = await Promise.all([
      this.rawStockValue(),
      this.readyStockService.summary({}, false),
      this.materialWithFactoriesQty(),
      this.jobSlipModel.countDocuments({ status: { $in: OPEN_JOB_STATUSES } }),
      this.jobSlipModel.countDocuments({ status: 'CREATED' }),
      this.invoiceModel.aggregate([
        { $match: { status: 'CONFIRMED' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
      this.paymentsService.pendingInvoices(),
      this.stockQueryService.lowStock(),
    ]);

    const totalReadyStock = readyStockRows.reduce((s, g) => s + g.totalQty, 0);
    const productionCompleted = await this.receiptModel.aggregate([
      { $match: { status: 'CONFIRMED' } },
      { $unwind: '$lines' },
      {
        $group: {
          _id: null,
          qty: { $sum: { $ifNull: ['$lines.acceptedQty', '$lines.receivedQty'] } },
        },
      },
    ]);

    return {
      totalRawStockValue: rawStockValue,
      totalReadyStock: roundQty(totalReadyStock),
      materialWithFactories,
      jobsInProgress,
      pendingJobs,
      productionCompleted: roundQty(productionCompleted[0]?.qty ?? 0),
      sales: roundMoney(salesTotal[0]?.total ?? 0),
      pendingPaymentsTotal: roundMoney(pendingPayments.reduce((s, p) => s + p.outstanding, 0)),
      pendingPaymentsCount: pendingPayments.length,
      lowStockCount: lowStock.length,
    };
  }

  async purchase() {
    const [recentPurchases, pendingInward, purchases] = await Promise.all([
      this.purchaseModel.find().sort({ createdAt: -1 }).limit(10).lean(),
      this.purchaseModel.countDocuments({ status: { $in: ['CONFIRMED', 'PARTIALLY_RECEIVED'] } }),
      this.purchaseModel.find({ status: { $ne: 'CANCELLED' } }).lean(),
    ]);

    const bySupplier = new Map<string, number>();
    const byMaterial = new Map<string, number>();
    for (const p of purchases) {
      const supplierKey = String(p.supplierId);
      const lineTotal = p.lines.reduce((s: number, l: any) => s + l.amount, 0);
      bySupplier.set(supplierKey, (bySupplier.get(supplierKey) ?? 0) + lineTotal);
      for (const l of p.lines) {
        const key = String(l.materialVariantId);
        byMaterial.set(key, (byMaterial.get(key) ?? 0) + l.qty);
      }
    }

    return {
      recentPurchases: recentPurchases.map((p) => ({
        id: String(p._id),
        docNo: p.docNo,
        docDate: p.docDate,
        status: p.status,
      })),
      pendingInward,
      supplierWisePurchases: Array.from(bySupplier.entries()).map(([supplierId, total]) => ({
        supplierId,
        total: roundMoney(total),
      })),
      materialPurchased: Array.from(byMaterial.entries()).map(([materialVariantId, qty]) => ({
        materialVariantId,
        qty: roundQty(qty),
      })),
    };
  }

  async rawMaterial() {
    const [currentStock, materialWithFactories, lowStock] = await Promise.all([
      this.rawStockValue(),
      this.materialWithFactoriesQty(),
      this.stockQueryService.lowStock(),
    ]);

    const issuedAgg = await this.jobSlipModel.db
      .model('JobMaterialLine')
      .aggregate([{ $group: { _id: null, issued: { $sum: '$qtyIssued' } } }]);
    const processedAgg = await this.stockItemModel.aggregate([
      { $match: { kind: 'PROCESSED_MATERIAL' } },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);

    return {
      currentRawStockValue: currentStock,
      materialIssued: roundQty((issuedAgg[0] as any)?.issued ?? 0),
      materialWithFactories,
      processedMaterialItemCount: processedAgg[0]?.count ?? 0,
      lowStock,
    };
  }

  async design() {
    const [totalDesigns, activeDesigns, designs] = await Promise.all([
      this.designModel.countDocuments({}),
      this.designModel.countDocuments({ isActive: true }),
      this.designModel.find({ isActive: true }).lean(),
    ]);

    const designWiseProduction: Array<{ designId: string; designNo: string; producedQty: number }> =
      [];
    const designWiseStock: Array<{ designId: string; designNo: string; onHand: number }> = [];
    for (const d of designs) {
      const production = await this.receiptModel.aggregate([
        { $match: { status: 'CONFIRMED' } },
        {
          $lookup: { from: 'job_slips', localField: 'jobSlipId', foreignField: '_id', as: 'slip' },
        },
        { $unwind: '$slip' },
        { $match: { 'slip.designId': d._id } },
        { $unwind: '$lines' },
        {
          $group: {
            _id: null,
            qty: { $sum: { $ifNull: ['$lines.acceptedQty', '$lines.receivedQty'] } },
          },
        },
      ]);
      designWiseProduction.push({
        designId: String(d._id),
        designNo: d.designNo,
        producedQty: roundQty(production[0]?.qty ?? 0),
      });

      const stock = await this.readyStockService.summary({ designId: String(d._id) }, false);
      const onHand = stock.reduce((s, g) => s + g.totalQty, 0);
      designWiseStock.push({
        designId: String(d._id),
        designNo: d.designNo,
        onHand: roundQty(onHand),
      });
    }

    return { totalDesigns, activeDesigns, designWiseProduction, designWiseStock };
  }

  async packing() {
    const rows = await this.packingService.dashboard({});
    return {
      readyStockTotal: roundQty(rows.reduce((s, r) => s + r.onHand, 0)),
      pendingPackingTotal: roundQty(rows.reduce((s, r) => s + r.pendingQty, 0)),
      packedQtyTotal: roundQty(rows.reduce((s, r) => s + r.packedQty, 0)),
      designWiseStock: rows,
    };
  }

  async sales() {
    const [salesOrders, recentSales, customers, readyStockRows, invoices] = await Promise.all([
      this.salesOrderModel.countDocuments({ status: { $in: ['CONFIRMED', 'PARTIALLY_INVOICED'] } }),
      this.invoiceModel.find({ status: 'CONFIRMED' }).sort({ docDate: -1 }).limit(10).lean(),
      this.customerModel.countDocuments({ isActive: true }),
      this.readyStockService.summary({}, false),
      this.invoiceModel.find({ status: 'CONFIRMED' }).lean(),
    ]);

    const billing = roundMoney(invoices.reduce((s, i) => s + i.grandTotal, 0));
    const availableReadyStock = roundQty(readyStockRows.reduce((s, g) => s + g.totalQty, 0));

    return {
      salesOrdersOpen: salesOrders,
      recentSales: recentSales.map((i) => ({
        id: String(i._id),
        docNo: i.docNo,
        docDate: i.docDate,
        grandTotal: i.grandTotal,
      })),
      customers,
      availableReadyStock,
      billing,
      salesHistoryCount: invoices.length,
    };
  }

  /** "Own data only" - scoped to one job worker (factory/artisan), served from the portal, never the admin dashboard route. */
  async factoryArtisan(jobWorkerId: string) {
    const jwId = new Types.ObjectId(jobWorkerId);
    const [assignedJobs, pendingJobs, completedJobs, receiptAgg, returnAgg] = await Promise.all([
      this.jobSlipModel.countDocuments({ jobWorkerId: jwId, status: { $ne: 'CANCELLED' } }),
      this.jobSlipModel.countDocuments({ jobWorkerId: jwId, status: { $in: OPEN_JOB_STATUSES } }),
      this.jobSlipModel.countDocuments({ jobWorkerId: jwId, status: 'CLOSED' }),
      this.receiptModel.aggregate([
        { $match: { status: 'CONFIRMED' } },
        {
          $lookup: { from: 'job_slips', localField: 'jobSlipId', foreignField: '_id', as: 'slip' },
        },
        { $unwind: '$slip' },
        { $match: { 'slip.jobWorkerId': jwId } },
        { $unwind: '$lines' },
        {
          $group: {
            _id: null,
            expected: { $sum: '$lines.expectedQty' },
            actual: { $sum: { $ifNull: ['$lines.acceptedQty', '$lines.receivedQty'] } },
          },
        },
      ]),
      this.jobSlipModel.db
        .model('MaterialReturn')
        .aggregate([
          { $match: { jobWorkerId: jwId, status: 'CONFIRMED' } },
          { $unwind: '$lines' },
          { $group: { _id: null, qty: { $sum: '$lines.qtyBase' } } },
        ]),
    ]);

    const materialReceived = await this.jobSlipModel.db
      .model('MaterialIssue')
      .aggregate([
        { $match: { jobWorkerId: jwId, status: 'CONFIRMED' } },
        { $unwind: '$lines' },
        { $group: { _id: null, qty: { $sum: '$lines.qtyBase' } } },
      ]);

    return {
      assignedJobs,
      materialReceived: roundQty(materialReceived[0]?.qty ?? 0),
      pendingJobs,
      completedJobs,
      expectedProduction: roundQty(receiptAgg[0]?.expected ?? 0),
      actualProduction: roundQty(receiptAgg[0]?.actual ?? 0),
      returnedProducts: roundQty(returnAgg[0]?.qty ?? 0),
    };
  }
}
