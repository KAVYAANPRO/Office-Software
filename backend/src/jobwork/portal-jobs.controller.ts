import { Body, Controller, ForbiddenException, Get, Param, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobSlipsService } from './job-slips.service';
import { MaterialIssuesService } from './material-issues.service';
import { JobMaterialLine, JobMaterialLineDocument } from './schemas/job-material-line.schema';
import { PartyScopeService } from '../common/services/party-scope.service';
import { RequestContextStore } from '../common/context/request-context';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-request';
import { PERMISSIONS } from '../identity/permissions.catalogue';
import { validateDto } from '../common/utils/validate-dto';
import { AcknowledgeMaterialIssueDto } from './dto/material-issue.dto';
import { SetJobSlipStatusDto, DispatchDeclarationDto } from './dto/job-slip.dto';

/**
 * JOB-14: the factory/artisan-facing surface for job work. Extends the minimal `/portal/v1`
 * surface from Phase 1 (see src/portal/portal.controller.ts's note on the hardening this
 * shares - one session mechanism, PartyScopeService as the only isolation layer).
 */
@Controller('portal/v1/jobs')
export class PortalJobsController {
  constructor(
    private readonly jobSlipsService: JobSlipsService,
    private readonly materialIssuesService: MaterialIssuesService,
    private readonly partyScope: PartyScopeService,
    @InjectModel(JobMaterialLine.name)
    private readonly materialLineModel: Model<JobMaterialLineDocument>,
  ) {}

  @RequirePermissions(PERMISSIONS.PORTAL_JOB_VIEW)
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    this.assertParty(user);
    return this.jobSlipsService.list({ jobWorkerId: user.jobWorkerId });
  }

  @RequirePermissions(PERMISSIONS.PORTAL_JOB_VIEW)
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    this.assertParty(user);
    const slip = await this.jobSlipsService.findById(id);
    this.partyScope.assertOwnParty(String(slip.jobWorkerId), RequestContextStore.getOrThrow());
    return slip;
  }

  /** Material currently with me (JOB-04's "own V") - cost fields are never included here. */
  @RequirePermissions(PERMISSIONS.PORTAL_JOB_VIEW)
  @Get(':id/material')
  async material(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    this.assertParty(user);
    const slip = await this.jobSlipsService.findById(id);
    this.partyScope.assertOwnParty(String(slip.jobWorkerId), RequestContextStore.getOrThrow());

    const lines = await this.materialLineModel.find({ jobSlipId: new Types.ObjectId(id) }).lean();
    return lines.map((l) => ({
      stockItemId: String(l.stockItemId),
      lotId: String(l.lotId),
      bomRole: l.bomRole,
      qtyIssued: l.qtyIssued,
      qtyReturned: l.qtyReturned,
      qtyRemaining: l.qtyIssued - l.qtyReturned - l.qtyConsumed - l.qtyWrittenOff,
      // unitCost deliberately omitted (AUTH-07/tech.md §9.4 - the portal never sees a rate or cost).
    }));
  }

  @RequirePermissions(PERMISSIONS.PORTAL_JOB_ACKNOWLEDGE)
  @Post(':id/acknowledge')
  async acknowledge(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertParty(user);
    const slip = await this.jobSlipsService.findById(id);
    this.partyScope.assertOwnParty(String(slip.jobWorkerId), RequestContextStore.getOrThrow());
    const dto = await validateDto(AcknowledgeMaterialIssueDto, body);
    return this.materialIssuesService.acknowledgeLatestForJobSlip(id, dto.discrepancyNote, user.id);
  }

  @RequirePermissions(PERMISSIONS.PORTAL_JOB_STATUS)
  @Post(':id/status')
  async setStatus(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertParty(user);
    const slip = await this.jobSlipsService.findById(id);
    this.partyScope.assertOwnParty(String(slip.jobWorkerId), RequestContextStore.getOrThrow());
    const dto = await validateDto(SetJobSlipStatusDto, body);
    return this.jobSlipsService.setStatus(id, dto.status, user.id);
  }

  @RequirePermissions(PERMISSIONS.PORTAL_JOB_DISPATCH)
  @Post(':id/dispatch-declaration')
  async declareDispatch(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertParty(user);
    const slip = await this.jobSlipsService.findById(id);
    this.partyScope.assertOwnParty(String(slip.jobWorkerId), RequestContextStore.getOrThrow());
    const dto = await validateDto(DispatchDeclarationDto, body);
    return this.jobSlipsService.declareDispatch(id, dto.qty, dto.note, user.id);
  }

  private assertParty(user: AuthenticatedUser): void {
    if (user.principal !== 'party') {
      throw new ForbiddenException('The portal surface is for factory/artisan accounts only.');
    }
  }
}
