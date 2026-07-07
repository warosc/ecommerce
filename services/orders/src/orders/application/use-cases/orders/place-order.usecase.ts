import { Inject, Injectable } from '@nestjs/common';
import type { OrderPlacedEvent } from '@optimus/contracts';
import { Order } from '../../../domain/entities/order.entity';
import { EmptyCartError, InsufficientStockError } from '../../../domain/errors';
import {
  CART_REPOSITORY,
  CartRepository,
} from '../../../domain/repositories/cart.repository';
import {
  ORDER_REPOSITORY,
  OrderRepository,
} from '../../../domain/repositories/order.repository';
import { Customer } from '../../../domain/value-objects/customer.vo';
import { ORDER_PLACED_ROUTING_KEY } from '../../events.constants';
import { EVENT_PUBLISHER, EventPublisher } from '../../ports/event-publisher';
import { INVENTORY_GATEWAY, InventoryGateway } from '../../ports/inventory.gateway';

export interface PlaceOrderCommand {
  cartId: string;
  customer: { name: string; email: string; phone?: string };
}

/**
 * Checkout: valida el carrito y la disponibilidad (lectura a Inventario), crea
 * el pedido, vacía el carrito y publica `orders.order.placed` (Inventario
 * descontará el stock al consumirlo — consistencia eventual).
 */
@Injectable()
export class PlaceOrderUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: CartRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: OrderRepository,
    @Inject(INVENTORY_GATEWAY) private readonly inventory: InventoryGateway,
    @Inject(EVENT_PUBLISHER) private readonly events: EventPublisher,
  ) {}

  async execute(command: PlaceOrderCommand): Promise<Order> {
    const cart = await this.cartRepository.get(command.cartId);
    if (!cart || cart.isEmpty()) {
      throw new EmptyCartError();
    }

    const customer = Customer.create(
      command.customer.name,
      command.customer.email,
      command.customer.phone,
    );

    // Validación de disponibilidad (best-effort; onHand null = no rastreado).
    for (const line of cart.items) {
      const onHand = await this.inventory.getOnHand(line.sku);
      if (onHand !== null && onHand < line.quantity) {
        throw new InsufficientStockError(line.sku, onHand, line.quantity);
      }
    }

    const order = Order.create(
      customer,
      cart.items.map((l) => ({
        sku: l.sku,
        name: l.name,
        unitPriceAmount: l.unitPriceAmount,
        quantity: l.quantity,
      })),
      cart.currency,
    );

    const saved = await this.orderRepository.create(order);
    await this.cartRepository.delete(command.cartId);

    const event: OrderPlacedEvent = {
      orderId: saved.id,
      lines: saved.lines.map((l) => ({ sku: l.sku, quantity: l.quantity })),
    };
    await this.events.publish(ORDER_PLACED_ROUTING_KEY, event);

    return saved;
  }
}
