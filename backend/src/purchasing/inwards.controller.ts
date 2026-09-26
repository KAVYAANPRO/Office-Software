import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { InwardsService } from './inwards.service';
import { CancelInwardDto, CreateInwardDto } from './dto/inward.dto';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Idempotent } from '../common/decorators/idempotent.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-request';
import { PERMISSIONS } from '../identity/permissions.catalogue';
import { validateDto } from '../common/utils/validate-dto';

@Controller('api/v1/inwards')
export class InwardsController {
  constructor(private readonly service: InwardsService) {}

  @RequirePermissions(PERMISSIONS.INWARD_VIEW)
  @Get()
  list(@Query('status') status?: string, @Query('purchaseId') purchaseId?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (purchaseId) filter.purchaseId = purchaseId;
    return this.service.list(filter);
  }

  @RequirePermissions(PERMISSIONS.INWARD_VIEW)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @RequirePermissions(PERMISSIONS.INWARD_EDIT)
  @Idempotent()
  @Post()
  async create(@Body() body: unknown, @CurrentUser() actor: AuthenticatedUser) {
    const dto = await validateDto(CreateInwardDto, body);
    return this.service.create(dto, actor.id);
  }

  @RequirePermissions(PERMISSIONS.INWARD_CONFIRM)
  @Idempotent()
  @Post(':id/confirm')
  confirm(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.confirm(id, actor.id);
  }

  @RequirePermissions(PERMISSIONS.INWARD_CANCEL)
  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const dto = await validateDto(CancelInwardDto, body);
    return this.service.cancel(id, dto.reason, actor.id);
  }
}
