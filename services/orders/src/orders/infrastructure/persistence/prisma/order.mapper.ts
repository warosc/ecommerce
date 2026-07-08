import {
  Order as PrismaOrder,
  OrderLine as PrismaOrderLine,
  OrderStatus as PrismaOrderStatus,
} from '@prisma/client';
import {
  Order,
  OrderChannel,
  OrderLine,
  OrderStatus,
  PaymentMethod,
} from '../../../domain/entities/order.entity';
import { Customer } from '../../../domain/value-objects/customer.vo';

type OrderWithLines = PrismaOrder & { lines: PrismaOrderLine[] };

export class OrderMapper {
  static toDomain(record: OrderWithLines): Order {
    return Order.fromPersistence({
      id: record.id,
      status: record.status as OrderStatus,
      channel: record.channel as OrderChannel,
      paymentMethod: (record.paymentMethod as PaymentMethod | null) ?? null,
      customer: Customer.create(
        record.customerName,
        record.customerEmail,
        record.customerPhone ?? undefined,
      ),
      lines: record.lines.map(
        (l) =>
          new OrderLine({
            sku: l.sku,
            name: l.name,
            unitPriceAmount: l.unitPriceAmount,
            quantity: l.quantity,
          }),
      ),
      totalAmount: record.totalAmount,
      currency: record.currency,
      createdAt: record.createdAt,
    });
  }

  static statusToPersistence(status: OrderStatus): PrismaOrderStatus {
    return status as PrismaOrderStatus;
  }
}
