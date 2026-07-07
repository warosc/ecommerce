import type { InventoryItemDto, StockMovementDto } from '@optimus/contracts';
import { InventoryItem } from '../../../domain/entities/inventory-item.entity';
import { StockMovement } from '../../../domain/entities/stock-movement.entity';

export function toInventoryItemDto(item: InventoryItem): InventoryItemDto {
  return {
    sku: item.sku,
    onHand: item.onHand,
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function toStockMovementDto(movement: StockMovement): StockMovementDto {
  return {
    id: movement.id,
    sku: movement.sku,
    type: movement.type,
    quantity: movement.quantity,
    reason: movement.reason,
    createdAt: movement.createdAt.toISOString(),
  };
}
