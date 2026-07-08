import { Inject, Injectable } from '@nestjs/common';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerNotFoundError } from '../../domain/errors';
import {
  CUSTOMER_REPOSITORY,
  CustomerRepository,
} from '../../domain/repositories/customer.repository';

@Injectable()
export class GetCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly repository: CustomerRepository,
  ) {}

  async execute(email: string): Promise<Customer> {
    const customer = await this.repository.findByEmail(email.trim().toLowerCase());
    if (!customer) {
      throw new CustomerNotFoundError(email);
    }
    return customer;
  }
}
