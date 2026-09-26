import { Controller, Get } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { dashboardPermission } from '../identity/permissions.catalogue';

/** DSH-01, prd.md §6.1: the six internal-user dashboards. The Factory/Artisan one is portal-only (see portal-dashboard.controller.ts). */
@Controller('api/v1/dashboards')
export class DashboardsController {
  constructor(private readonly service: DashboardsService) {}

  @RequirePermissions(dashboardPermission('admin'))
  @Get('admin')
  admin() {
    return this.service.admin();
  }

  @RequirePermissions(dashboardPermission('purchase'))
  @Get('purchase')
  purchase() {
    return this.service.purchase();
  }

  @RequirePermissions(dashboardPermission('raw_material'))
  @Get('raw-material')
  rawMaterial() {
    return this.service.rawMaterial();
  }

  @RequirePermissions(dashboardPermission('design'))
  @Get('design')
  design() {
    return this.service.design();
  }

  @RequirePermissions(dashboardPermission('packing'))
  @Get('packing')
  packing() {
    return this.service.packing();
  }

  @RequirePermissions(dashboardPermission('sales'))
  @Get('sales')
  sales() {
    return this.service.sales();
  }
}
