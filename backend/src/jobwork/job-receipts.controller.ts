import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { JobReceiptsService } from './job-receipts.service';
import { CancelJobReceiptDto, CreateJobReceiptDto } from './dto/job-receipt.dto';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Idempotent } from '../common/decorators/idempotent.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-request';
import { PERMISSIONS } from '../identity/permissions.catalogue';
import { validateDto } from '../common/utils/validate-dto';

@Controller('api/v1/job-receipts')
export class JobReceiptsController {
  constructor(private readonly service: JobReceiptsService) {}

  @RequirePermissions(PERMISSIONS.RECEIPT_VIEW)
  @Get()
  list(@Query('jobSlipId') jobSlipId?: string) {
    return this.service.list(jobSlipId ? { jobSlipId } : {});
  }

  @RequirePermissions(PERMISSIONS.RECEIPT_VIEW)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @RequirePermissions(PERMISSIONS.RECEIPT_EDIT)
  @Idempotent()
  @Post()
  async create(@Body() body: unknown, @CurrentUser() actor: AuthenticatedUser) {
    const dto = await validateDto(CreateJobReceiptDto, body);
    return this.service.create(dto, actor.id);
  }

  @RequirePermissions(PERMISSIONS.RECEIPT_CONFIRM)
  @Idempotent()
  @Post(':id/confirm')
  confirm(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.confirm(id, actor.id);
  }

  @RequirePermissions(PERMISSIONS.RECEIPT_CANCEL)
  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const dto = await validateDto(CancelJobReceiptDto, body);
    return this.service.cancel(id, dto.reason, actor.id);
  }
}

@Controller('api/v1/job-slips/:jobSlipId')
export class JobComparisonController {
  constructor(private readonly service: JobReceiptsService) {}

  /** JOB-11: expected, actual, difference. */
  @RequirePermissions(PERMISSIONS.JOBSLIP_VIEW)
  @Get('comparison')
  comparison(@Param('jobSlipId') jobSlipId: string) {
    return this.service.getComparison(jobSlipId);
  }
}
