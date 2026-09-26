import { Controller } from '@nestjs/common';
import { MasterCrudController } from '../common/controllers/master-crud.mixin';
import { JobWorkersService } from './job-workers.service';
import { CreateJobWorkerDto, UpdateJobWorkerDto } from './dto/job-worker.dto';
import { PERMISSIONS } from '../identity/permissions.catalogue';

const Base = MasterCrudController<JobWorkersService>({
  viewPermission: PERMISSIONS.MASTER_JOBWORKER_VIEW,
  editPermission: PERMISSIONS.MASTER_JOBWORKER_EDIT,
  createDto: CreateJobWorkerDto,
  updateDto: UpdateJobWorkerDto,
});

@Controller('api/v1/job-workers')
export class JobWorkersController extends Base {
  constructor(service: JobWorkersService) {
    super(service);
  }
}
