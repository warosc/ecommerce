import { AddToCartUseCase } from '../../src/orders/application/use-cases/cart/add-to-cart.usecase';
import { PlaceOrderUseCase } from '../../src/orders/application/use-cases/orders/place-order.usecase';
import { ORDER_PLACED_ROUTING_KEY } from '../../src/orders/application/events.constants';
import {
  EmptyCartError,
  InsufficientStockError,
} from '../../src/orders/domain/errors';
import {
  CollectingPublisher,
  InMemoryCartRepository,
  InMemoryOrderRepository,
  StubCatalogGateway,
  StubInventoryGateway,
  product,
} from '../support/in-memory.repositories';

const customer = { name: 'Ana', email: 'ana@mail.com' };

async function seededCart(cartRepo: InMemoryCartRepository, sku: string, qty: number, price = 10000) {
  const catalog = new StubCatalogGateway({ [sku]: product(sku, { unitPriceAmount: price }) });
  await new AddToCartUseCase(cartRepo, catalog).execute('c1', sku, qty);
}

describe('PlaceOrderUseCase', () => {
  it('crea el pedido, vacía el carrito y publica order.placed', async () => {
    const cartRepo = new InMemoryCartRepository();
    const orderRepo = new InMemoryOrderRepository();
    const publisher = new CollectingPublisher();
    await seededCart(cartRepo, 'FR-1', 2, 45000);

    const inventory = new StubInventoryGateway({ 'FR-1': 10 });
    const order = await new PlaceOrderUseCase(cartRepo, orderRepo, inventory, publisher).execute({
      cartId: 'c1',
      customer,
    });

    expect(order.totalAmount).toBe(90000);
    expect(order.status).toBe('PLACED');
    expect((await cartRepo.get('c1'))).toBeNull();
    expect(publisher.calls).toHaveLength(1);
    expect(publisher.calls[0].key).toBe(ORDER_PLACED_ROUTING_KEY);
    expect(publisher.calls[0].payload).toEqual({
      orderId: order.id,
      lines: [{ sku: 'FR-1', quantity: 2 }],
    });
  });

  it('permite checkout cuando el SKU no está rastreado en inventario (onHand null)', async () => {
    const cartRepo = new InMemoryCartRepository();
    await seededCart(cartRepo, 'FR-1', 1);
    const order = await new PlaceOrderUseCase(
      cartRepo,
      new InMemoryOrderRepository(),
      new StubInventoryGateway({}),
      new CollectingPublisher(),
    ).execute({ cartId: 'c1', customer });
    expect(order.status).toBe('PLACED');
  });

  it('lanza EmptyCart si el carrito está vacío', async () => {
    const uc = new PlaceOrderUseCase(
      new InMemoryCartRepository(),
      new InMemoryOrderRepository(),
      new StubInventoryGateway({}),
      new CollectingPublisher(),
    );
    await expect(uc.execute({ cartId: 'vacio', customer })).rejects.toBeInstanceOf(EmptyCartError);
  });

  it('lanza InsufficientStock y no publica si falta stock', async () => {
    const cartRepo = new InMemoryCartRepository();
    await seededCart(cartRepo, 'FR-1', 5);
    const publisher = new CollectingPublisher();
    await expect(
      new PlaceOrderUseCase(
        cartRepo,
        new InMemoryOrderRepository(),
        new StubInventoryGateway({ 'FR-1': 1 }),
        publisher,
      ).execute({ cartId: 'c1', customer }),
    ).rejects.toBeInstanceOf(InsufficientStockError);
    expect(publisher.calls).toHaveLength(0);
  });
});
