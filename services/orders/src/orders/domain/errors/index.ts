export abstract class DomainError extends Error {
  abstract readonly code: string;
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EmptyCartError extends DomainError {
  readonly code = 'EMPTY_CART';
  constructor() {
    super('El carrito está vacío.');
  }
}

export class ProductNotAvailableError extends DomainError {
  readonly code = 'PRODUCT_NOT_AVAILABLE';
  constructor(sku: string) {
    super(`El producto '${sku}' no existe o no está disponible.`);
  }
}

export class InsufficientStockError extends DomainError {
  readonly code = 'INSUFFICIENT_STOCK';
  constructor(sku: string, available: number, requested: number) {
    super(`Stock insuficiente para '${sku}': disponible ${available}, solicitado ${requested}.`);
  }
}

export class OrderNotFoundError extends DomainError {
  readonly code = 'ORDER_NOT_FOUND';
  constructor(id: string) {
    super(`No existe el pedido '${id}'.`);
  }
}

export class InvalidOrderError extends DomainError {
  readonly code = 'INVALID_ORDER';
  constructor(message: string) {
    super(message);
  }
}
