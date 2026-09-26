import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { SalesModule } from '../sales/sales.module';
import { JobworkModule } from '../jobwork/jobwork.module';
import { MasterModule } from '../master/master.module';
import { DesignModule } from '../design/design.module';

@Module({
  imports: [SalesModule, JobworkModule, MasterModule, DesignModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
