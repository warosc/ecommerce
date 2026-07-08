import { Order } from '../../src/orders/domain/entities/order.entity';
import { InvalidOrderError } from '../../src/orders/domain/errors';
import { Customer } from '../../src/orders/domain/value-objects/customer.vo';

const customer = Customer.create('Ana', 'ana@mail.com');

describe('Order.create', () => {
  it('crea un pedido con total calculado y estado PLACED (canal WEB por defecto)', () => {
    const order = Order.create(customer, [
      { sku: 'FR-1', name: 'Montura', unitPriceAmount: 5000, quantity: 2 },
      { sku: 'LN-1', name: 'Lente', unitPriceAmount: 20000, quantity: 1 },
    ]);
    expect(order.id).toMatch(/[0-9a-f-]{36}/);
    expect(order.status).toBe('PLACED');
    expect(order.channel).toBe('WEB');
    expect(order.paymentMethod).toBeNull();
    expect(order.totalAmount).toBe(30000);
    expect(order.lines).toHaveLength(2);
    expect(order.createdAt).toBeInstanceOf(Date);
  });

  it('crea una venta POS con método de pago', () => {
    const order = Order.create(
      customer,
      [{ sku: 'FR-1', name: 'Montura', unitPriceAmount: 5000, quantity: 1 }],
      { channel: 'POS', paymentMethod: 'CASH' },
    );
    expect(order.channel).toBe('POS');
    expect(order.paymentMethod).toBe('CASH');
  });

  it('rechaza pedido sin líneas', () => {
    expect(() => Order.create(customer, [])).toThrow(InvalidOrderError);
  });

  it('rechaza cantidad de línea inválida', () => {
    expect(() =>
      Order.create(customer, [{ sku: 'FR-1', name: 'x', unitPriceAmount: 100, quantity: 0 }]),
    ).toThrow(InvalidOrderError);
  });

  it('reconstruye desde persistencia', () => {
    const created = Order.create(customer, [
      { sku: 'FR-1', name: 'Montura', unitPriceAmount: 5000, quantity: 1 },
    ]);
    const restored = Order.fromPersistence({
      id: created.id,
      status: 'PLACED',
      channel: 'WEB',
      paymentMethod: null,
      customer,
      lines: created.lines,
      totalAmount: created.totalAmount,
      currency: 'GTQ',
      createdAt: created.createdAt,
    });
    expect(restored.id).toBe(created.id);
    expect(restored.totalAmount).toBe(5000);
  });
});
