import { Customer } from '../../src/crm/domain/entities/customer.entity';

const day = 86_400_000;

describe('Customer', () => {
  it('fromFirstOrder inicia el perfil con un pedido', () => {
    const at = new Date('2026-01-01T10:00:00.000Z');
    const c = Customer.fromFirstOrder({
      email: 'Ana@Mail.com',
      name: 'Ana',
      amount: 45000,
      currency: 'GTQ',
      at,
    });
    expect(c.email).toBe('ana@mail.com'); // normalizado
    expect(c.totalOrders).toBe(1);
    expect(c.totalSpentAmount).toBe(45000);
    expect(c.firstOrderAt).toBe(at);
    expect(c.lastOrderAt).toBe(at);
  });

  it('expone teléfono y moneda; recordOrder actualiza el teléfono', () => {
    let c = Customer.fromFirstOrder({
      email: 'a@x.com',
      name: 'A',
      phone: '5555-0001',
      amount: 1000,
      currency: 'USD',
      at: new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(c.phone).toBe('5555-0001');
    expect(c.currency).toBe('USD');
    c = c.recordOrder({ amount: 500, at: new Date('2026-02-01T00:00:00.000Z'), phone: '5555-9999' });
    expect(c.phone).toBe('5555-9999');
  });

  it('recordOrder acumula pedidos y actualiza lastOrderAt', () => {
    const first = new Date('2026-01-01T10:00:00.000Z');
    const second = new Date('2026-02-01T10:00:00.000Z');
    const c = Customer.fromFirstOrder({
      email: 'ana@mail.com',
      name: 'Ana',
      amount: 45000,
      currency: 'GTQ',
      at: first,
    }).recordOrder({ amount: 20000, at: second, name: 'Ana G.' });
    expect(c.totalOrders).toBe(2);
    expect(c.totalSpentAmount).toBe(65000);
    expect(c.firstOrderAt).toBe(first);
    expect(c.lastOrderAt).toBe(second);
    expect(c.name).toBe('Ana G.'); // actualiza al último nombre
  });

  describe('segments', () => {
    const base = (over: Partial<{ orders: number; spent: number; last: Date }> = {}) => {
      let c = Customer.fromFirstOrder({
        email: 'x@y.com',
        name: 'X',
        amount: over.spent ?? 1000,
        currency: 'GTQ',
        at: over.last ?? new Date('2026-06-01T00:00:00.000Z'),
      });
      for (let i = 1; i < (over.orders ?? 1); i++) {
        c = c.recordOrder({ amount: 0, at: over.last ?? new Date('2026-06-01T00:00:00.000Z') });
      }
      return c;
    };
    const now = new Date('2026-06-10T00:00:00.000Z');

    it('marca NUEVO con un solo pedido', () => {
      expect(base({ orders: 1 }).segments(now)).toContain('NUEVO');
    });

    it('marca RECURRENTE con 3+ pedidos', () => {
      expect(base({ orders: 3 }).segments(now)).toContain('RECURRENTE');
    });

    it('marca VIP al superar el umbral de gasto', () => {
      expect(base({ orders: 1, spent: 250000 }).segments(now)).toContain('VIP');
    });

    it('marca INACTIVO si no compra hace >90 días', () => {
      const last = new Date(now.getTime() - 100 * day);
      expect(base({ orders: 1, last }).segments(now)).toContain('INACTIVO');
    });

    it('no marca INACTIVO si compró recientemente', () => {
      expect(base({ orders: 1 }).segments(now)).not.toContain('INACTIVO');
    });
  });
});
