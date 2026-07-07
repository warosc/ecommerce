import { DomainError } from './domain.error';

export class DuplicateSkuError extends DomainError {
  readonly code = 'DUPLICATE_SKU';

  constructor(sku: string) {
    super(`Ya existe un producto con el SKU '${sku}'.`);
  }
}
