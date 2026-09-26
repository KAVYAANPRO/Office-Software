import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { PurchasesService } from './purchases.service';
import { CancelPurchaseDto, CreatePurchaseDto, UpdatePurchaseDto } from './dto/purchase.dto';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Idempotent } from '../common/decorators/idempotent.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-request';
import { PERMISSIONS } from '../identity/permissions.catalogue';
import { validateDto } from '../common/utils/validate-dto';

class AddAttachmentDto {
  @IsString() @MinLength(1) url!: string;
}

@Controller('api/v1/purchases')
export class PurchasesController {
  constructor(private readonly service: PurchasesService) {}

  @RequirePermissions(PERMISSIONS.PURCHASE_VIEW)
  @Get()
  list(@Query('status') status?: string) {
    return this.service.list(status ? { status } : {});
  }

  @RequirePermissions(PERMISSIONS.PURCHASE_VIEW)
  @Get('pending-inward')
  pendingInward() {
    return this.service.pendingInward();
  }

  @RequirePermissions(PERMISSIONS.PURCHASE_VIEW)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @RequirePermissions(PERMISSIONS.PURCHASE_EDIT)
  @Idempotent()
  @Post()
  async create(@Body() body: unknown, @CurrentUser() actor: AuthenticatedUser) {
    const dto = await validateDto(CreatePurchaseDto, body);
    return this.service.create(dto, actor.id);
  }

  @RequirePermissions(PERMISSIONS.PURCHASE_EDIT)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() actor: AuthenticatedUser,
    @Headers('if-match') ifMatch?: string,
  ) {
    const dto = await validateDto(UpdatePurchaseDto, body);
    const expectedVersion =
      ifMatch !== undefined ? parseInt(ifMatch.replace(/"/g, ''), 10) : undefined;
    return this.service.update(id, dto, actor.id, expectedVersion);
  }

  @RequirePermissions(PERMISSIONS.PURCHASE_CONFIRM)
  @Idempotent()
  @Post(':id/confirm')
  confirm(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.confirm(id, actor.id);
  }

  @RequirePermissions(PERMISSIONS.PURCHASE_CANCEL)
  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const dto = await validateDto(CancelPurchaseDto, body);
    return this.service.cancel(id, dto.reason, actor.id);
  }

  /**
   * PUR-07: attachment upload. Object storage (T-10, S3-compatible) isn't wired up in this
   * pass, so this stores a caller-supplied URL rather than accepting a binary upload - a
   * documented placeholder until file storage exists.
   */
  @RequirePermissions(PERMISSIONS.PURCHASE_EDIT)
  @Post(':id/attachments')
  async addAttachment(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const dto = await validateDto(AddAttachmentDto, body);
    return this.service.addAttachment(id, dto.url, actor.id);
  }
}
