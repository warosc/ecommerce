import { DomainError } from './domain.error';

export class ProductNotFoundError extends DomainError {
  readonly code = 'PRODUCT_NOT_FOUND';

  constructor(id: string) {
    super(`No existe un producto con id '${id}'.`);
  }
}
