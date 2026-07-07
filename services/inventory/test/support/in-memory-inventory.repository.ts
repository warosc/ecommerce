import { InventoryItem } from '../../src/inventory/domain/entities/inventory-item.entity';
import { StockMovement } from '../../src/inventory/domain/entities/stock-movement.entity';
import {
  FindManyResult,
  InventoryRepository,
  ListInventoryFilter,
} from '../../src/inventory/domain/repositories/inventory.repository';

export class InMemoryInventoryRepository implements InventoryRepository {
  private readonly items: InventoryItem[] = [];
  private readonly movements: StockMovement[] = [];

  constructor(seed: InventoryItem[] = []) {
    this.items.push(...seed);
  }

  async findBySku(sku: string): Promise<InventoryItem | null> {
    return this.items.find((i) => i.sku === sku) ?? null;
  }

  async findMany(filter: ListInventoryFilter): Promise<FindManyResult> {
    let items = this.items;
    if (filter.search) {
      const needle = filter.search.toLowerCase();
      items = items.filter((i) => i.sku.toLowerCase().includes(needle));
    }
    const total = items.length;
    const start = (filter.page - 1) * filter.limit;
    return { items: items.slice(start, start + filter.limit), total };
  }

  async upsert(item: InventoryItem): Promise<InventoryItem> {
    const existing = this.items.find((i) => i.sku === item.sku);
    if (existing) return existing;
    this.items.push(item);
    return item;
  }

  async saveMovement(item: InventoryItem, movement: StockMovement): Promise<void> {
    const idx = this.items.findIndex((i) => i.sku === item.sku);
    if (idx >= 0) this.items[idx] = item;
    this.movements.push(movement);
  }

  async findMovements(sku: string): Promise<StockMovement[]> {
    return this.movements.filter((m) => m.sku === sku);
  }
}
