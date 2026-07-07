import {
  InventoryItem as PrismaInventoryItem,
  MovementType as PrismaMovementType,
  StockMovement as PrismaStockMovement,
} from '@prisma/client';
import { InventoryItem } from '../../../domain/entities/inventory-item.entity';
import { StockMovement } from '../../../domain/entities/stock-movement.entity';
import { MovementType } from '../../../domain/value-objects/movement-type.vo';

export class InventoryMapper {
  static toDomain(record: PrismaInventoryItem): InventoryItem {
    return InventoryItem.fromPersistence({
      sku: record.sku,
      onHand: record.onHand,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static movementToDomain(record: PrismaStockMovement): StockMovement {
    return StockMovement.fromPersistence({
      id: record.id,
      sku: record.sku,
      type: record.type as MovementType,
      quantity: record.quantity,
      reason: record.reason ?? undefined,
      createdAt: record.createdAt,
    });
  }

  static movementToPersistence(movement: StockMovement): {
    id: string;
    sku: string;
    type: PrismaMovementType;
    quantity: number;
    reason: string | null;
    createdAt: Date;
  } {
    return {
      id: movement.id,
      sku: movement.sku,
      type: movement.type as PrismaMovementType,
      quantity: movement.quantity,
      reason: movement.reason ?? null,
      createdAt: movement.createdAt,
    };
  }
}
