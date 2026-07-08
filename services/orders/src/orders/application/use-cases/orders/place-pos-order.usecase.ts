import { Inject, Injectable } from '@nestjs/common';
import type { OrderPlacedEvent, PaymentMethod } from '@optimus/contracts';
import { Order, OrderLineProps } from '../../../domain/entities/order.entity';
import {
  InsufficientStockError,
  InvalidOrderError,
  ProductNotAvailableError,
} from '../../../domain/errors';
import {
  ORDER_REPOSITORY,
  OrderRepository,
} from '../../../domain/repositories/order.repository';
import { Customer } from '../../../domain/value-objects/customer.vo';
import { ORDER_PLACED_ROUTING_KEY } from '../../events.constants';
import { CATALOG_GATEWAY, CatalogGateway } from '../../ports/catalog.gateway';
import { EVENT_PUBLISHER, EventPublisher } from '../../ports/event-publisher';
import { INVENTORY_GATEWAY, InventoryGateway } from '../../ports/inventory.gateway';

export interface PosOrderLineInput {
  sku: string;
  quantity: number;
}

export interface PlacePosOrderCommand {
  lines: PosOrderLineInput[];
  paymentMethod: PaymentMethod;
  customer?: { name: string; email: string; phone?: string };
}

/** Cliente genérico de mostrador cuando la venta POS no registra datos. */
const WALK_IN = { name: 'Cliente de mostrador', email: 'mostrador@pos.local' };

/**
 * Venta en tienda (POS): resuelve nombre y precio de cada SKU en Catálogo, valida
 * disponibilidad en Inventario, crea el pedido (channel=POS, con método de pago) y
 * publica `orders.order.placed` para que Inventario descuente el stock.
 */
@Injectable()
export class PlacePosOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: OrderRepository,
    @Inject(CATALOG_GATEWAY) private readonly catalog: CatalogGateway,
    @Inject(INVENTORY_GATEWAY) private readonly inventory: InventoryGateway,
    @Inject(EVENT_PUBLISHER) private readonly events: EventPublisher,
  ) {}

  async execute(command: PlacePosOrderCommand): Promise<Order> {
    if (!command.lines || command.lines.length === 0) {
      throw new InvalidOrderError('La venta debe tener al menos una línea.');
    }

    const orderLines: OrderLineProps[] = [];
    let currency = 'GTQ';

    for (const line of command.lines) {
      const sku = line.sku.trim().toUpperCase();
      const product = await this.catalog.getProductBySku(sku);
      if (!product || !product.active) {
        throw new ProductNotAvailableError(sku);
      }
      const onHand = await this.inventory.getOnHand(sku);
      if (onHand !== null && onHand < line.quantity) {
        throw new InsufficientStockError(sku, onHand, line.quantity);
      }
      currency = product.currency;
      orderLines.push({
        sku: product.sku,
        name: product.name,
        unitPriceAmount: product.unitPriceAmount,
        quantity: line.quantity,
      });
    }

    const customer = command.customer
      ? Customer.create(command.customer.name, command.customer.email, command.customer.phone)
      : Customer.create(WALK_IN.name, WALK_IN.email);

    const order = Order.create(customer, orderLines, {
      currency,
      channel: 'POS',
      paymentMethod: command.paymentMethod,
    });

    const saved = await this.orderRepository.create(order);

    const event: OrderPlacedEvent = {
      orderId: saved.id,
      lines: saved.lines.map((l) => ({ sku: l.sku, quantity: l.quantity })),
    };
    await this.events.publish(ORDER_PLACED_ROUTING_KEY, event);

    return saved;
  }
}
