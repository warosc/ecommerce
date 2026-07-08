import { Injectable } from '@nestjs/common';
import { Customer as PrismaCustomer } from '@prisma/client';
import { Customer } from '../../../domain/entities/customer.entity';
import {
  CustomerRepository,
  FindCustomersResult,
  ListCustomersFilter,
} from '../../../domain/repositories/customer.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(r: PrismaCustomer): Customer {
    return Customer.fromPersistence({
      email: r.email,
      name: r.name,
      phone: r.phone,
      totalOrders: r.totalOrders,
      totalSpentAmount: r.totalSpentAmount,
      currency: r.currency,
      firstOrderAt: r.firstOrderAt,
      lastOrderAt: r.lastOrderAt,
    });
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const r = await this.prisma.customer.findUnique({ where: { email } });
    return r ? this.toDomain(r) : null;
  }

  async save(c: Customer): Promise<Customer> {
    const data = {
      name: c.name,
      phone: c.phone,
      totalOrders: c.totalOrders,
      totalSpentAmount: c.totalSpentAmount,
      currency: c.currency,
      firstOrderAt: c.firstOrderAt,
      lastOrderAt: c.lastOrderAt,
    };
    const r = await this.prisma.customer.upsert({
      where: { email: c.email },
      create: { email: c.email, ...data },
      update: data,
    });
    return this.toDomain(r);
  }

  async findMany(filter: ListCustomersFilter): Promise<FindCustomersResult> {
    const [records, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: { lastOrderAt: 'desc' },
      }),
      this.prisma.customer.count(),
    ]);
    return { items: records.map((r) => this.toDomain(r)), total };
  }
}
