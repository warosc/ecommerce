import { DomainError } from './domain.error';

export { DomainError };

export class InventoryItemNotFoundError extends DomainError {
  readonly code = 'INVENTORY_ITEM_NOT_FOUND';
  constructor(sku: string) {
    super(`No existe inventario para el SKU '${sku}'.`);
  }
}

export class InsufficientStockError extends DomainError {
  readonly code = 'INSUFFICIENT_STOCK';
  constructor(sku: string, onHand: number, requested: number) {
    super(`Stock insuficiente para '${sku}': disponible ${onHand}, solicitado ${requested}.`);
  }
}

export class InvalidMovementError extends DomainError {
  readonly code = 'INVALID_MOVEMENT';
  constructor(message: string) {
    super(message);
  }
}
