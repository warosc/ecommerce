import { GetOrderUseCase } from '../../src/orders/application/use-cases/orders/get-order.usecase';
import { ListOrdersUseCase } from '../../src/orders/application/use-cases/orders/list-orders.usecase';
import { Order } from '../../src/orders/domain/entities/order.entity';
import { OrderNotFoundError } from '../../src/orders/domain/errors';
import { Customer } from '../../src/orders/domain/value-objects/customer.vo';
import { InMemoryOrderRepository } from '../support/in-memory.repositories';

function makeOrder(): Order {
  return Order.create(Customer.create('Ana', 'ana@mail.com'), [
    { sku: 'FR-1', name: 'Montura', unitPriceAmount: 5000, quantity: 1 },
  ]);
}

describe('Order query use cases', () => {
  it('GetOrder devuelve el pedido / lanza NotFound', async () => {
    const repo = new InMemoryOrderRepository();
    const order = makeOrder();
    await repo.create(order);
    expect((await new GetOrderUseCase(repo).execute(order.id)).id).toBe(order.id);
    await expect(new GetOrderUseCase(repo).execute('nope')).rejects.toBeInstanceOf(
      OrderNotFoundError,
    );
  });

  it('ListOrders pagina', async () => {
    const repo = new InMemoryOrderRepository();
    for (let i = 0; i < 3; i++) await repo.create(makeOrder());
    const result = await new ListOrdersUseCase(repo).execute({ page: 1, limit: 2 });
    expect(result.data).toHaveLength(2);
    expect(result.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
  });

  it('ListOrders con valores por defecto y sin resultados', async () => {
    const result = await new ListOrdersUseCase(new InMemoryOrderRepository()).execute();
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
  });
});
