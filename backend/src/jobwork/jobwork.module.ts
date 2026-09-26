import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductionOrder, ProductionOrderSchema } from './schemas/production-order.schema';
import { JobSlip, JobSlipSchema } from './schemas/job-slip.schema';
import { JobMaterialLine, JobMaterialLineSchema } from './schemas/job-material-line.schema';
import { MaterialIssue, MaterialIssueSchema } from './schemas/material-issue.schema';
import { MaterialReturn, MaterialReturnSchema } from './schemas/material-return.schema';
import { JobReceipt, JobReceiptSchema } from './schemas/job-receipt.schema';
import { JobCharge, JobChargeSchema } from './schemas/job-charge.schema';
import { ProductionOrdersService } from './production-orders.service';
import { ProductionOrdersController } from './production-orders.controller';
import { JobSlipsService } from './job-slips.service';
import { JobSlipsController } from './job-slips.controller';
import { MaterialIssuesService } from './material-issues.service';
import { MaterialIssuesController } from './material-issues.controller';
import { MaterialReturnsService } from './material-returns.service';
import { MaterialReturnsController } from './material-returns.controller';
import { JobReceiptsService } from './job-receipts.service';
import { JobReceiptsController, JobComparisonController } from './job-receipts.controller';
import { PortalJobsController } from './portal-jobs.controller';
import { DesignModule } from '../design/design.module';
import { MasterModule } from '../master/master.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CommonModule } from '../common/common.module';
import { CostingModule } from '../costing/costing.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductionOrder.name, schema: ProductionOrderSchema },
      { name: JobSlip.name, schema: JobSlipSchema },
      { name: JobMaterialLine.name, schema: JobMaterialLineSchema },
      { name: MaterialIssue.name, schema: MaterialIssueSchema },
      { name: MaterialReturn.name, schema: MaterialReturnSchema },
      { name: JobReceipt.name, schema: JobReceiptSchema },
      { name: JobCharge.name, schema: JobChargeSchema },
    ]),
    DesignModule,
    MasterModule,
    InventoryModule,
    CommonModule,
    forwardRef(() => CostingModule),
  ],
  controllers: [
    ProductionOrdersController,
    JobSlipsController,
    MaterialIssuesController,
    MaterialReturnsController,
    JobReceiptsController,
    JobComparisonController,
    PortalJobsController,
  ],
  providers: [
    ProductionOrdersService,
    JobSlipsService,
    MaterialIssuesService,
    MaterialReturnsService,
    JobReceiptsService,
  ],
  exports: [ProductionOrdersService, JobSlipsService, MongooseModule],
})
export class JobworkModule {}
