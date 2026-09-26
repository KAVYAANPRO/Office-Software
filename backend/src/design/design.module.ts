import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Design, DesignSchema } from './schemas/design.schema';
import { DesignVariant, DesignVariantSchema } from './schemas/design-variant.schema';
import { DesignBomVersion, DesignBomVersionSchema } from './schemas/design-bom-version.schema';
import { DesignRateHistory, DesignRateHistorySchema } from './schemas/design-rate-history.schema';
import { DesignsService } from './designs.service';
import { DesignsController } from './designs.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Design.name, schema: DesignSchema },
      { name: DesignVariant.name, schema: DesignVariantSchema },
      { name: DesignBomVersion.name, schema: DesignBomVersionSchema },
      { name: DesignRateHistory.name, schema: DesignRateHistorySchema },
    ]),
    InventoryModule,
  ],
  controllers: [DesignsController],
  providers: [DesignsService],
  exports: [DesignsService, MongooseModule],
})
export class DesignModule {}
