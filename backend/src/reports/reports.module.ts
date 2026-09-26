import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PurchasingModule } from '../purchasing/purchasing.module';
import { InventoryModule } from '../inventory/inventory.module';
import { JobworkModule } from '../jobwork/jobwork.module';
import { SalesModule } from '../sales/sales.module';
import { DesignModule } from '../design/design.module';
import { CostingModule } from '../costing/costing.module';

@Module({
  imports: [
    PurchasingModule,
    InventoryModule,
    JobworkModule,
    SalesModule,
    DesignModule,
    CostingModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
