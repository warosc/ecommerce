import { InvalidProductError } from '../errors/invalid-product.error';

/**
 * Dinero como entero en centavos + moneda ISO 4217. Inmutable. Se evita el
 * punto flotante: `amount` siempre es un entero ≥ 0.
 */
export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {}

  static create(amount: number, currency = 'GTQ'): Money {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new InvalidProductError(
        `Importe inválido: '${amount}'. Debe ser un entero ≥ 0 (centavos).`,
      );
    }
    const normalized = (currency ?? '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalized)) {
      throw new InvalidProductError(
        `Moneda inválida: '${currency}'. Debe ser un código ISO 4217 de 3 letras.`,
      );
    }
    return new Money(amount, normalized);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toJSON(): { amount: number; currency: string } {
    return { amount: this.amount, currency: this.currency };
  }
}
