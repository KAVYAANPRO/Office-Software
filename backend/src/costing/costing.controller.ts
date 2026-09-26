import { Controller, Get, Param } from '@nestjs/common';
import { CostingService } from './costing.service';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../identity/permissions.catalogue';

/** CST-06, CST-07: every response here requires costing.view - "grantable per user", no default role has it except Super Admin. */
@Controller('api/v1')
export class CostingController {
  constructor(private readonly service: CostingService) {}

  @RequirePermissions(PERMISSIONS.COSTING_VIEW)
  @Get('job-slips/:id/cost-sheet')
  getCostSheet(@Param('id') id: string) {
    return this.service.getCostSheet(id);
  }

  @RequirePermissions(PERMISSIONS.COSTING_VIEW)
  @Get('costing/designs/:id')
  getMarginsForDesign(@Param('id') id: string) {
    return this.service.getMarginsForDesign(id);
  }
}
