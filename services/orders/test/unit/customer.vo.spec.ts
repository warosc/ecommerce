import { InvalidOrderError } from '../../src/orders/domain/errors';
import { Customer } from '../../src/orders/domain/value-objects/customer.vo';

describe('Customer', () => {
  it('crea un cliente válido y normaliza email', () => {
    const c = Customer.create('  Ana Pérez ', 'ANA@Mail.com', ' 5555-1234 ');
    expect(c.name).toBe('Ana Pérez');
    expect(c.email).toBe('ana@mail.com');
    expect(c.phone).toBe('5555-1234');
  });

  it('permite teléfono ausente', () => {
    expect(Customer.create('Ana', 'ana@mail.com').phone).toBeUndefined();
    expect(Customer.create('Ana', 'ana@mail.com', '  ').phone).toBeUndefined();
  });

  it('rechaza nombre corto o email inválido', () => {
    expect(() => Customer.create('A', 'ana@mail.com')).toThrow(InvalidOrderError);
    expect(() => Customer.create('Ana', 'no-es-email')).toThrow(InvalidOrderError);
  });
});
