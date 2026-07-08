import { Inject, Injectable } from '@nestjs/common';
import { Customer } from '../../domain/entities/customer.entity';
import {
  CUSTOMER_REPOSITORY,
  CustomerRepository,
} from '../../domain/repositories/customer.repository';

export interface RecordOrderCommand {
  email: string;
  name: string;
  phone?: string | null;
  amount: number;
  currency: string;
  at: Date;
}

/**
 * Aplica un pedido al perfil del cliente: crea el perfil con el primer pedido o
 * acumula el historial en los siguientes. Idempotencia por email (clave natural).
 */
@Injectable()
export class RecordOrderUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY) private readonly repository: CustomerRepository,
  ) {}

  async execute(command: RecordOrderCommand): Promise<Customer> {
    const email = command.email.trim().toLowerCase();
    const existing = await this.repository.findByEmail(email);
    const customer = existing
      ? existing.recordOrder({
          name: command.name,
          phone: command.phone,
          amount: command.amount,
          at: command.at,
        })
      : Customer.fromFirstOrder({
          email,
          name: command.name,
          phone: command.phone,
          amount: command.amount,
          currency: command.currency,
          at: command.at,
        });
    return this.repository.save(customer);
  }
}
