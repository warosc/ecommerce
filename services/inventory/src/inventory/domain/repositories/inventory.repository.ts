import { InventoryItem } from '../entities/inventory-item.entity';
import { StockMovement } from '../entities/stock-movement.entity';

export const INVENTORY_REPOSITORY = Symbol('INVENTORY_REPOSITORY');

export interface ListInventoryFilter {
  page: number;
  limit: number;
  search?: string;
}

export interface FindManyResult {
  items: InventoryItem[];
  total: number;
}

/** Puerto de salida del dominio de inventario hacia la persistencia. */
export interface InventoryRepository {
  findBySku(sku: string): Promise<InventoryItem | null>;
  findMany(filter: ListInventoryFilter): Promise<FindManyResult>;
  /** Crea o actualiza el item (idempotente por SKU). */
  upsert(item: InventoryItem): Promise<InventoryItem>;
  /** Persiste de forma atómica el item actualizado y el movimiento registrado. */
  saveMovement(item: InventoryItem, movement: StockMovement): Promise<void>;
  findMovements(sku: string): Promise<StockMovement[]>;
}
