import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../identity/permissions.catalogue';

/** DOC-01, JOB-05: print-ready HTML - the same view/permission gates as reading the underlying document. */
@Controller('api/v1/documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  private sendHtml(res: Response, html: string) {
    res.header('Content-Type', 'text/html');
    res.send(html);
  }

  @RequirePermissions(PERMISSIONS.SALES_INVOICE_VIEW)
  @Get('invoices/:id/print')
  async invoicePrint(@Param('id') id: string, @Res() res: Response) {
    this.sendHtml(res, await this.service.invoicePrint(id));
  }

  @RequirePermissions(PERMISSIONS.JOBSLIP_VIEW)
  @Get('job-slips/:id/print')
  async jobSlipPrint(@Param('id') id: string, @Res() res: Response) {
    this.sendHtml(res, await this.service.jobSlipPrint(id));
  }

  @RequirePermissions(PERMISSIONS.ISSUE_VIEW)
  @Get('material-issues/:id/print')
  async materialIssuePrint(@Param('id') id: string, @Res() res: Response) {
    this.sendHtml(res, await this.service.materialIssuePrint(id));
  }
}
