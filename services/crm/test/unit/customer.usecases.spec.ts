import { ORDER_PLACED_ROUTING_KEY } from '../../src/crm/application/events.constants';
import { GetCustomerUseCase } from '../../src/crm/application/use-cases/get-customer.usecase';
import { ListCustomersUseCase } from '../../src/crm/application/use-cases/list-customers.usecase';
import { RecordOrderUseCase } from '../../src/crm/application/use-cases/record-order.usecase';
import { Customer } from '../../src/crm/domain/entities/customer.entity';
import { CustomerNotFoundError } from '../../src/crm/domain/errors';
import { InMemoryCustomerRepository } from '../support/in-memory.repositories';

describe('Casos de uso del CRM', () => {
  it('la routing key del evento es la esperada', () => {
    expect(ORDER_PLACED_ROUTING_KEY).toBe('orders.order.placed');
  });
  it('RecordOrder crea el perfil con el primer pedido', async () => {
    const repo = new InMemoryCustomerRepository();
    const c = await new RecordOrderUseCase(repo).execute({
      email: 'Ana@Mail.com',
      name: 'Ana',
      amount: 45000,
      currency: 'GTQ',
      at: new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(c.email).toBe('ana@mail.com');
    expect(c.totalOrders).toBe(1);
    expect(repo.customers).toHaveLength(1);
  });

  it('RecordOrder acumula en pedidos siguientes del mismo email', async () => {
    const repo = new InMemoryCustomerRepository();
    const useCase = new RecordOrderUseCase(repo);
    await useCase.execute({
      email: 'ana@mail.com',
      name: 'Ana',
      amount: 45000,
      currency: 'GTQ',
      at: new Date('2026-01-01T00:00:00.000Z'),
    });
    const c = await useCase.execute({
      email: 'ana@mail.com',
      name: 'Ana',
      amount: 20000,
      currency: 'GTQ',
      at: new Date('2026-02-01T00:00:00.000Z'),
    });
    expect(c.totalOrders).toBe(2);
    expect(c.totalSpentAmount).toBe(65000);
    expect(repo.customers).toHaveLength(1);
  });

  it('ListCustomers ordena por última compra y normaliza filtros', async () => {
    const repo = new InMemoryCustomerRepository([
      Customer.fromFirstOrder({ email: 'a@x.com', name: 'A', amount: 1, currency: 'GTQ', at: new Date('2026-01-01') }),
      Customer.fromFirstOrder({ email: 'b@x.com', name: 'B', amount: 1, currency: 'GTQ', at: new Date('2026-03-01') }),
    ]);
    const res = await new ListCustomersUseCase(repo).execute({});
    expect(res.total).toBe(2);
    expect(res.items[0].email).toBe('b@x.com'); // más reciente primero
  });

  it('ListCustomers respeta page/limit explícitos', async () => {
    const repo = new InMemoryCustomerRepository([
      Customer.fromFirstOrder({ email: 'a@x.com', name: 'A', amount: 1, currency: 'GTQ', at: new Date('2026-01-01') }),
      Customer.fromFirstOrder({ email: 'b@x.com', name: 'B', amount: 1, currency: 'GTQ', at: new Date('2026-02-01') }),
      Customer.fromFirstOrder({ email: 'c@x.com', name: 'C', amount: 1, currency: 'GTQ', at: new Date('2026-03-01') }),
    ]);
    const res = await new ListCustomersUseCase(repo).execute({ page: 1, limit: 2 });
    expect(res.total).toBe(3);
    expect(res.items).toHaveLength(2);
  });

  it('GetCustomer devuelve el perfil o lanza 404', async () => {
    const repo = new InMemoryCustomerRepository([
      Customer.fromFirstOrder({ email: 'a@x.com', name: 'A', amount: 1, currency: 'GTQ', at: new Date() }),
    ]);
    const useCase = new GetCustomerUseCase(repo);
    expect((await useCase.execute('A@X.com')).email).toBe('a@x.com');
    await expect(useCase.execute('nope@x.com')).rejects.toBeInstanceOf(CustomerNotFoundError);
  });
});
