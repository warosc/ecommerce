import { randomUUID } from 'node:crypto';
import { MovementType } from '../value-objects/movement-type.vo';

export interface StockMovementProps {
  id: string;
  sku: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  createdAt: Date;
}

/** Registro inmutable de un movimiento de stock (historial/auditoría). */
export class StockMovement {
  private constructor(private readonly props: StockMovementProps) {}

  static create(sku: string, type: MovementType, quantity: number, reason?: string): StockMovement {
    return new StockMovement({
      id: randomUUID(),
      sku,
      type,
      quantity,
      reason: reason?.trim() || undefined,
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: StockMovementProps): StockMovement {
    return new StockMovement(props);
  }

  get id(): string {
    return this.props.id;
  }
  get sku(): string {
    return this.props.sku;
  }
  get type(): MovementType {
    return this.props.type;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get reason(): string | undefined {
    return this.props.reason;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
