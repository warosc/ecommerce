import { Cart, CartLineProps } from '../../src/orders/domain/entities/cart.entity';
import { Order } from '../../src/orders/domain/entities/order.entity';
import { CartRepository } from '../../src/orders/domain/repositories/cart.repository';
import {
  FindManyResult,
  ListOrdersFilter,
  OrderRepository,
} from '../../src/orders/domain/repositories/order.repository';
import {
  CatalogGateway,
  ProductSummary,
} from '../../src/orders/application/ports/catalog.gateway';
import { InventoryGateway } from '../../src/orders/application/ports/inventory.gateway';
import { EventPublisher } from '../../src/orders/application/ports/event-publisher';

export class InMemoryCartRepository implements CartRepository {
  private readonly store = new Map<string, CartLineProps[]>();

  async get(cartId: string): Promise<Cart | null> {
    const lines = this.store.get(cartId);
    return lines ? Cart.fromLines(cartId, lines) : null;
  }
  async save(cart: Cart): Promise<void> {
    this.store.set(
      cart.cartId,
      cart.items.map((l) => ({
        sku: l.sku,
        name: l.name,
        unitPriceAmount: l.unitPriceAmount,
        currency: l.currency,
        quantity: l.quantity,
      })),
    );
  }
  async delete(cartId: string): Promise<void> {
    this.store.delete(cartId);
  }
}

export class InMemoryOrderRepository implements OrderRepository {
  readonly orders: Order[] = [];
  async create(order: Order): Promise<Order> {
    this.orders.push(order);
    return order;
  }
  async findById(id: string): Promise<Order | null> {
    return this.orders.find((o) => o.id === id) ?? null;
  }
  async findMany(filter: ListOrdersFilter): Promise<FindManyResult> {
    const total = this.orders.length;
    const start = (filter.page - 1) * filter.limit;
    return { items: this.orders.slice(start, start + filter.limit), total };
  }
}

export class StubCatalogGateway implements CatalogGateway {
  constructor(private readonly products: Record<string, ProductSummary>) {}
  async getProductBySku(sku: string): Promise<ProductSummary | null> {
    return this.products[sku] ?? null;
  }
}

export class StubInventoryGateway implements InventoryGateway {
  constructor(private readonly onHandBySku: Record<string, number | null>) {}
  async getOnHand(sku: string): Promise<number | null> {
    return sku in this.onHandBySku ? this.onHandBySku[sku] : null;
  }
}

export class CollectingPublisher implements EventPublisher {
  readonly calls: Array<{ key: string; payload: unknown }> = [];
  async publish(key: string, payload: unknown): Promise<void> {
    this.calls.push({ key, payload });
  }
}

export function product(sku: string, overrides: Partial<ProductSummary> = {}): ProductSummary {
  return {
    sku,
    name: `Producto ${sku}`,
    unitPriceAmount: 10000,
    currency: 'GTQ',
    active: true,
    ...overrides,
  };
}
