import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { JobSlipsService } from './job-slips.service';
import {
  CancelJobSlipDto,
  CreateJobSlipDto,
  SetJobSlipStatusDto,
  ShortCloseJobSlipDto,
  WriteOffJobSlipDto,
} from './dto/job-slip.dto';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Idempotent } from '../common/decorators/idempotent.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-request';
import { PERMISSIONS } from '../identity/permissions.catalogue';
import { validateDto } from '../common/utils/validate-dto';

@Controller('api/v1/job-slips')
export class JobSlipsController {
  constructor(private readonly service: JobSlipsService) {}

  @RequirePermissions(PERMISSIONS.JOBSLIP_VIEW)
  @Get()
  list(@Query('status') status?: string, @Query('jobWorkerId') jobWorkerId?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (jobWorkerId) filter.jobWorkerId = jobWorkerId;
    return this.service.list(filter);
  }

  @RequirePermissions(PERMISSIONS.JOBSLIP_VIEW)
  @Get('overdue')
  overdue() {
    return this.service.overdue();
  }

  @RequirePermissions(PERMISSIONS.JOBSLIP_VIEW)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @RequirePermissions(PERMISSIONS.JOBSLIP_VIEW)
  @Get(':id/reconciliation')
  reconciliation(@Param('id') id: string) {
    return this.service.getReconciliation(id);
  }

  @RequirePermissions(PERMISSIONS.JOBSLIP_EDIT)
  @Idempotent()
  @Post()
  async create(@Body() body: unknown, @CurrentUser() actor: AuthenticatedUser) {
    const dto = await validateDto(CreateJobSlipDto, body);
    return this.service.create(dto, actor.id);
  }

  @RequirePermissions(PERMISSIONS.JOBSLIP_EDIT)
  @Post(':id/status')
  async setStatus(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const dto = await validateDto(SetJobSlipStatusDto, body);
    return this.service.setStatus(id, dto.status, actor.id);
  }

  @RequirePermissions(PERMISSIONS.JOBSLIP_EDIT)
  @Post(':id/short-close')
  async shortClose(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const dto = await validateDto(ShortCloseJobSlipDto, body);
    return this.service.shortClose(id, dto.reason, actor.id);
  }

  @RequirePermissions(PERMISSIONS.WRITEOFF_APPROVE)
  @Post(':id/write-off')
  async writeOff(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const dto = await validateDto(WriteOffJobSlipDto, body);
    return this.service.writeOff(id, dto.reason, actor.id);
  }

  @RequirePermissions(PERMISSIONS.JOBSLIP_CLOSE)
  @Idempotent()
  @Post(':id/close')
  close(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.close(id, actor.id);
  }

  @RequirePermissions(PERMISSIONS.JOBSLIP_CANCEL)
  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const dto = await validateDto(CancelJobSlipDto, body);
    return this.service.cancel(id, dto.reason, actor.id);
  }
}
