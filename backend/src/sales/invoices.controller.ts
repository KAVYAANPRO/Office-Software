import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { TraceService } from './trace.service';
import { CreateInvoiceDto, CancelInvoiceDto } from './dto/invoice.dto';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Idempotent } from '../common/decorators/idempotent.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-request';
import { PERMISSIONS } from '../identity/permissions.catalogue';
import { validateDto } from '../common/utils/validate-dto';

@Controller('api/v1/invoices')
export class InvoicesController {
  constructor(
    private readonly service: InvoicesService,
    private readonly traceService: TraceService,
  ) {}

  @RequirePermissions(PERMISSIONS.SALES_INVOICE_VIEW)
  @Get()
  list(@Query('customerId') customerId?: string, @Query('salesOrderId') salesOrderId?: string) {
    const filter: Record<string, unknown> = {};
    if (customerId) filter.customerId = customerId;
    if (salesOrderId) filter.salesOrderId = salesOrderId;
    return this.service.list(filter);
  }

  @RequirePermissions(PERMISSIONS.SALES_INVOICE_VIEW)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @RequirePermissions(PERMISSIONS.COSTING_VIEW)
  @Get(':id/margin')
  margin(@Param('id') id: string) {
    return this.service.getMargin(id);
  }

  @RequirePermissions(PERMISSIONS.COSTING_VIEW)
  @Get('lines/:invoiceLineId/trace')
  trace(@Param('invoiceLineId') invoiceLineId: string) {
    return this.traceService.traceInvoiceLine(invoiceLineId);
  }

  @RequirePermissions(PERMISSIONS.SALES_INVOICE_EDIT)
  @Idempotent()
  @Post()
  async create(@Body() body: unknown, @CurrentUser() actor: AuthenticatedUser) {
    const dto = await validateDto(CreateInvoiceDto, body);
    return this.service.create(dto, actor.id);
  }

  @RequirePermissions(PERMISSIONS.SALES_INVOICE_CONFIRM)
  @Idempotent()
  @Post(':id/confirm')
  confirm(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.confirm(id, actor.id);
  }

  @RequirePermissions(PERMISSIONS.SALES_INVOICE_CANCEL)
  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const dto = await validateDto(CancelInvoiceDto, body);
    return this.service.cancel(id, dto.reason, actor.id);
  }
}
