import { Cart } from '../../src/orders/domain/entities/cart.entity';
import { InvalidOrderError } from '../../src/orders/domain/errors';

function line(sku: string, quantity: number, price = 10000) {
  return { sku, name: `Prod ${sku}`, unitPriceAmount: price, currency: 'GTQ', quantity };
}

describe('Cart', () => {
  it('empieza vacío', () => {
    const cart = Cart.empty('c1');
    expect(cart.isEmpty()).toBe(true);
    expect(cart.totalAmount).toBe(0);
    expect(cart.currency).toBe('GTQ');
  });

  it('agrega líneas y suma cantidades del mismo SKU', () => {
    const cart = Cart.empty('c1');
    cart.addItem(line('FR-1', 2, 5000));
    cart.addItem(line('FR-1', 3, 5000));
    cart.addItem(line('LN-1', 1, 20000));
    expect(cart.items).toHaveLength(2);
    const fr = cart.items.find((l) => l.sku === 'FR-1')!;
    expect(fr.quantity).toBe(5);
    expect(fr.lineTotal).toBe(25000);
    expect(cart.totalAmount).toBe(25000 + 20000);
  });

  it('elimina líneas y se vacía', () => {
    const cart = Cart.fromLines('c1', [line('FR-1', 1), line('LN-1', 1)]);
    cart.removeItem('FR-1');
    expect(cart.items).toHaveLength(1);
    cart.clear();
    expect(cart.isEmpty()).toBe(true);
  });

  it('rechaza cantidad inválida', () => {
    expect(() => Cart.empty('c1').addItem(line('FR-1', 0))).toThrow(InvalidOrderError);
  });
});
