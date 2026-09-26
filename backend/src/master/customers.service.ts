import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MasterCrudService } from '../common/services/master-crud.service';
import { Customer, CustomerDocument } from './schemas/customer.schema';

@Injectable()
export class CustomersService extends MasterCrudService<Customer> {
  constructor(@InjectModel(Customer.name) model: Model<CustomerDocument>) {
    super(model);
  }
}
