import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Purchase, PurchaseSchema } from './schemas/purchase.schema';
import { Inward, InwardSchema } from './schemas/inward.schema';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { InwardsService } from './inwards.service';
import { InwardsController } from './inwards.controller';
import { MasterModule } from '../master/master.module';
import { InventoryModule } from '../inventory/inventory.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Purchase.name, schema: PurchaseSchema },
      { name: Inward.name, schema: InwardSchema },
    ]),
    MasterModule,
    InventoryModule,
    UploadsModule,
  ],
  controllers: [PurchasesController, InwardsController],
  providers: [PurchasesService, InwardsService],
  exports: [PurchasesService, InwardsService, MongooseModule],
})
export class PurchasingModule {}
