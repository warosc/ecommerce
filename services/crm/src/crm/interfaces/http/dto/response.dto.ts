import type { CrmCustomerDto } from '@optimus/contracts';
import { Customer } from '../../../domain/entities/customer.entity';

export function toCrmCustomerDto(customer: Customer, now: Date): CrmCustomerDto {
  return {
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    totalOrders: customer.totalOrders,
    totalSpentAmount: customer.totalSpentAmount,
    currency: customer.currency,
    firstOrderAt: customer.firstOrderAt.toISOString(),
    lastOrderAt: customer.lastOrderAt.toISOString(),
    segments: customer.segments(now),
  };
}
