import { InvalidOrderError } from '../errors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Datos del cliente del pedido. Value Object inmutable con validación básica. */
export class Customer {
  private constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly phone?: string,
  ) {}

  static create(name: string, email: string, phone?: string): Customer {
    const trimmedName = (name ?? '').trim();
    if (trimmedName.length < 2) {
      throw new InvalidOrderError('El nombre del cliente es obligatorio.');
    }
    const trimmedEmail = (email ?? '').trim().toLowerCase();
    if (!EMAIL_RE.test(trimmedEmail)) {
      throw new InvalidOrderError(`Email inválido: '${email}'.`);
    }
    const trimmedPhone = phone?.trim() || undefined;
    return new Customer(trimmedName, trimmedEmail, trimmedPhone);
  }
}
