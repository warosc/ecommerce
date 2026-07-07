import { DomainError } from './domain.error';

/** Se lanza cuando se viola una invariante de dominio (SKU, precio, stock, etc.). */
export class InvalidProductError extends DomainError {
  readonly code = 'INVALID_PRODUCT';

  constructor(message: string) {
    super(message);
  }
}
