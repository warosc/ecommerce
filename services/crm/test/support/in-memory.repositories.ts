import { Customer } from '../../src/crm/domain/entities/customer.entity';
import {
  CustomerRepository,
  FindCustomersResult,
  ListCustomersFilter,
} from '../../src/crm/domain/repositories/customer.repository';

export class InMemoryCustomerRepository implements CustomerRepository {
  readonly customers: Customer[] = [];

  constructor(seed: Customer[] = []) {
    this.customers.push(...seed);
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.customers.find((c) => c.email === email) ?? null;
  }

  async save(customer: Customer): Promise<Customer> {
    const i = this.customers.findIndex((c) => c.email === customer.email);
    if (i >= 0) this.customers[i] = customer;
    else this.customers.push(customer);
    return customer;
  }

  async findMany(filter: ListCustomersFilter): Promise<FindCustomersResult> {
    const sorted = [...this.customers].sort(
      (a, b) => b.lastOrderAt.getTime() - a.lastOrderAt.getTime(),
    );
    const total = sorted.length;
    const start = (filter.page - 1) * filter.limit;
    return { items: sorted.slice(start, start + filter.limit), total };
  }
}
