import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MaterialReturnsService } from './material-returns.service';
import { CreateMaterialReturnDto } from './dto/material-return.dto';
import { CancelMaterialIssueDto as CancelReasonDto } from './dto/material-issue.dto';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Idempotent } from '../common/decorators/idempotent.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-request';
import { PERMISSIONS } from '../identity/permissions.catalogue';
import { validateDto } from '../common/utils/validate-dto';

@Controller('api/v1/material-returns')
export class MaterialReturnsController {
  constructor(private readonly service: MaterialReturnsService) {}

  @RequirePermissions(PERMISSIONS.ISSUE_VIEW)
  @Get()
  list(@Query('jobSlipId') jobSlipId?: string) {
    return this.service.list(jobSlipId ? { jobSlipId } : {});
  }

  @RequirePermissions(PERMISSIONS.ISSUE_VIEW)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @RequirePermissions(PERMISSIONS.ISSUE_EDIT)
  @Idempotent()
  @Post()
  async create(@Body() body: unknown, @CurrentUser() actor: AuthenticatedUser) {
    const dto = await validateDto(CreateMaterialReturnDto, body);
    return this.service.create(dto, actor.id);
  }

  @RequirePermissions(PERMISSIONS.ISSUE_CONFIRM)
  @Idempotent()
  @Post(':id/confirm')
  confirm(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.confirm(id, actor.id);
  }

  @RequirePermissions(PERMISSIONS.ISSUE_CANCEL)
  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const dto = await validateDto(CancelReasonDto, body);
    return this.service.cancel(id, dto.reason, actor.id);
  }
}
