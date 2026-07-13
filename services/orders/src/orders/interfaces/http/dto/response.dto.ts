import type { CartDto, OrderDto } from '@optimus/contracts';
import { Cart } from '../../../domain/entities/cart.entity';
import { Order } from '../../../domain/entities/order.entity';

export function toCartDto(cart: Cart): CartDto {
  return {
    cartId: cart.cartId,
    currency: cart.currency,
    totalAmount: cart.totalAmount,
    lines: cart.items.map((l) => ({
      sku: l.sku,
      name: l.name,
      unitPriceAmount: l.unitPriceAmount,
      currency: l.currency,
      quantity: l.quantity,
      lineTotal: l.lineTotal,
    })),
  };
}

export function toOrderDto(order: Order): OrderDto {
  return {
    id: order.id,
    status: order.status,
    channel: order.channel,
    paymentMethod: order.paymentMethod,
    customer: {
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone,
    },
    lensType: order.lensType,
    prescriptionNote: order.prescriptionNote,
    currency: order.currency,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),
    lines: order.lines.map((l) => ({
      sku: l.sku,
      name: l.name,
      unitPriceAmount: l.unitPriceAmount,
      quantity: l.quantity,
      lineTotal: l.lineTotal,
    })),
  };
}
