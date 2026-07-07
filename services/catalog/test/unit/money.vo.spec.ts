import { InvalidProductError } from '../../src/catalog/domain/errors/invalid-product.error';
import { Money } from '../../src/catalog/domain/value-objects/money.vo';

describe('Money', () => {
  it('crea dinero válido con moneda por defecto GTQ', () => {
    const money = Money.create(12500);
    expect(money.amount).toBe(12500);
    expect(money.currency).toBe('GTQ');
    expect(money.toJSON()).toEqual({ amount: 12500, currency: 'GTQ' });
  });

  it('acepta importe cero y normaliza la moneda', () => {
    expect(Money.create(0, 'usd').currency).toBe('USD');
  });

  it('compara por valor', () => {
    expect(Money.create(100).equals(Money.create(100))).toBe(true);
    expect(Money.create(100).equals(Money.create(200))).toBe(false);
    expect(Money.create(100, 'GTQ').equals(Money.create(100, 'USD'))).toBe(false);
  });

  it.each([-1, 1.5, Number.NaN])('rechaza el importe inválido %s', (amount) => {
    expect(() => Money.create(amount)).toThrow(InvalidProductError);
  });

  it.each(['', 'GT', 'GTQQ', '12'])('rechaza la moneda inválida "%s"', (currency) => {
    expect(() => Money.create(100, currency)).toThrow(InvalidProductError);
  });
});
