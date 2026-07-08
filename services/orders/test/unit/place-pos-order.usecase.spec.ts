import { PlacePosOrderUseCase } from '../../src/orders/application/use-cases/orders/place-pos-order.usecase';
import {
  InsufficientStockError,
  InvalidOrderError,
  ProductNotAvailableError,
} from '../../src/orders/domain/errors';
import { ORDER_PLACED_ROUTING_KEY } from '../../src/orders/application/events.constants';
import {
  CollectingPublisher,
  InMemoryOrderRepository,
  StubCatalogGateway,
  StubInventoryGateway,
  product,
} from '../support/in-memory.repositories';

function makeUseCase(opts?: {
  onHand?: Record<string, number | null>;
}) {
  const orders = new InMemoryOrderRepository();
  const catalog = new StubCatalogGateway({
    'FR-1': product('FR-1', { name: 'Montura', unitPriceAmount: 45000 }),
    'LN-1': product('LN-1', { name: 'Lente', unitPriceAmount: 20000 }),
    'OFF-1': product('OFF-1', { active: false }),
  });
  const inventory = new StubInventoryGateway(opts?.onHand ?? { 'FR-1': 10, 'LN-1': 3 });
  const publisher = new CollectingPublisher();
  const useCase = new PlacePosOrderUseCase(orders, catalog, inventory, publisher);
  return { useCase, orders, publisher };
}

describe('PlacePosOrderUseCase', () => {
  it('crea una venta POS, calcula el total y publica order.placed', async () => {
    const { useCase, orders, publisher } = makeUseCase();
    const order = await useCase.execute({
      lines: [
        { sku: 'fr-1', quantity: 2 },
        { sku: 'LN-1', quantity: 1 },
      ],
      paymentMethod: 'CASH',
    });

    expect(order.channel).toBe('POS');
    expect(order.paymentMethod).toBe('CASH');
    expect(order.totalAmount).toBe(45000 * 2 + 20000);
    expect(order.customer.name).toBe('Cliente de mostrador');
    expect(orders.orders).toHaveLength(1);
    expect(publisher.calls).toHaveLength(1);
    expect(publisher.calls[0].key).toBe(ORDER_PLACED_ROUTING_KEY);
  });

  it('usa el cliente indicado cuando se proporciona', async () => {
    const { useCase } = makeUseCase();
    const order = await useCase.execute({
      lines: [{ sku: 'FR-1', quantity: 1 }],
      paymentMethod: 'CARD',
      customer: { name: 'Marta López', email: 'marta@mail.com' },
    });
    expect(order.customer.name).toBe('Marta López');
    expect(order.paymentMethod).toBe('CARD');
  });

  it('rechaza si no hay líneas', async () => {
    const { useCase } = makeUseCase();
    await expect(useCase.execute({ lines: [], paymentMethod: 'CASH' })).rejects.toBeInstanceOf(
      InvalidOrderError,
    );
  });

  it('rechaza un SKU inexistente o inactivo', async () => {
    const { useCase } = makeUseCase();
    await expect(
      useCase.execute({ lines: [{ sku: 'NOPE', quantity: 1 }], paymentMethod: 'CASH' }),
    ).rejects.toBeInstanceOf(ProductNotAvailableError);
    await expect(
      useCase.execute({ lines: [{ sku: 'OFF-1', quantity: 1 }], paymentMethod: 'CASH' }),
    ).rejects.toBeInstanceOf(ProductNotAvailableError);
  });

  it('rechaza si el stock es insuficiente', async () => {
    const { useCase } = makeUseCase({ onHand: { 'LN-1': 1 } });
    await expect(
      useCase.execute({ lines: [{ sku: 'LN-1', quantity: 5 }], paymentMethod: 'CASH' }),
    ).rejects.toBeInstanceOf(InsufficientStockError);
  });

  it('permite vender un SKU sin stock rastreado (onHand null)', async () => {
    const { useCase } = makeUseCase({ onHand: {} });
    const order = await useCase.execute({
      lines: [{ sku: 'FR-1', quantity: 3 }],
      paymentMethod: 'CASH',
    });
    expect(order.lines[0].quantity).toBe(3);
  });
});
