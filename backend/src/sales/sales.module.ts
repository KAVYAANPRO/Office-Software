import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesOrder, SalesOrderSchema } from './schemas/sales-order.schema';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import {
  InvoiceLineAllocation,
  InvoiceLineAllocationSchema,
} from './schemas/invoice-line-allocation.schema';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { PaymentAllocation, PaymentAllocationSchema } from './schemas/payment-allocation.schema';
import { SalesOrdersService } from './sales-orders.service';
import { SalesOrdersController } from './sales-orders.controller';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TraceService } from './trace.service';
import { DesignHistoryService } from './design-history.service';
import { DesignHistoryController } from './design-history.controller';
import { MasterModule } from '../master/master.module';
import { DesignModule } from '../design/design.module';
import { InventoryModule } from '../inventory/inventory.module';
import { JobworkModule } from '../jobwork/jobwork.module';
import { PurchasingModule } from '../purchasing/purchasing.module';
import { CostingModule } from '../costing/costing.module';
import { ReadystockModule } from '../readystock/readystock.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SalesOrder.name, schema: SalesOrderSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: InvoiceLineAllocation.name, schema: InvoiceLineAllocationSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: PaymentAllocation.name, schema: PaymentAllocationSchema },
    ]),
    MasterModule,
    DesignModule,
    InventoryModule,
    JobworkModule,
    PurchasingModule,
    CostingModule,
    ReadystockModule,
  ],
  controllers: [SalesOrdersController, InvoicesController, PaymentsController, DesignHistoryController],
  providers: [SalesOrdersService, InvoicesService, PaymentsService, TraceService, DesignHistoryService],
  exports: [SalesOrdersService, InvoicesService, PaymentsService, MongooseModule],
})
export class SalesModule {}
