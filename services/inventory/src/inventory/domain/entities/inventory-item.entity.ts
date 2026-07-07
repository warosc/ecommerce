import { InsufficientStockError, InvalidMovementError } from '../errors';
import { MovementType } from '../value-objects/movement-type.vo';
import { StockMovement } from './stock-movement.entity';

export interface InventoryItemProps {
  sku: string;
  onHand: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Agregado raíz del contexto Inventario: existencias de un SKU. Encapsula la
 * invariante `onHand >= 0` y la lógica de aplicación de movimientos.
 */
export class InventoryItem {
  private constructor(private readonly props: InventoryItemProps) {}

  static create(sku: string, initialOnHand = 0): InventoryItem {
    const normalizedSku = sku.trim().toUpperCase();
    if (!normalizedSku) {
      throw new InvalidMovementError('El SKU es obligatorio.');
    }
    if (!Number.isInteger(initialOnHand) || initialOnHand < 0) {
      throw new InvalidMovementError(`onHand inicial inválido: '${initialOnHand}'.`);
    }
    const now = new Date();
    return new InventoryItem({
      sku: normalizedSku,
      onHand: initialOnHand,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: InventoryItemProps): InventoryItem {
    return new InventoryItem(props);
  }

  /**
   * Aplica un movimiento sobre las existencias y devuelve el registro del
   * movimiento. Muta `onHand`/`updatedAt` respetando la invariante `onHand >= 0`.
   */
  applyMovement(type: MovementType, quantity: number, reason?: string): StockMovement {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new InvalidMovementError(`Cantidad inválida: '${quantity}'. Debe ser un entero ≥ 0.`);
    }

    switch (type) {
      case 'RECEIPT':
        if (quantity < 1) throw new InvalidMovementError('RECEIPT requiere cantidad ≥ 1.');
        this.props.onHand += quantity;
        break;
      case 'ISSUE':
        if (quantity < 1) throw new InvalidMovementError('ISSUE requiere cantidad ≥ 1.');
        if (quantity > this.props.onHand) {
          throw new InsufficientStockError(this.props.sku, this.props.onHand, quantity);
        }
        this.props.onHand -= quantity;
        break;
      case 'ADJUSTMENT':
        this.props.onHand = quantity;
        break;
    }

    this.props.updatedAt = new Date();
    return StockMovement.create(this.props.sku, type, quantity, reason);
  }

  get sku(): string {
    return this.props.sku;
  }
  get onHand(): number {
    return this.props.onHand;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
