import { Inject, Injectable } from '@nestjs/common';
import {
  CUSTOMER_REPOSITORY,
  CustomerRepository,
  FindCustomersResult,
} from '../../domain/repositories/customer.repository';

@Injectable()
export class ListCustomersUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly repository: CustomerRepository,
  ) {}

  async execute(filter: { page?: number; limit?: number }): Promise<FindCustomersResult> {
    return this.repository.findMany({
      page: filter.page && filter.page > 0 ? filter.page : 1,
      limit: filter.limit && filter.limit > 0 ? Math.min(filter.limit, 100) : 50,
    });
  }
}
