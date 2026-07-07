import { Inject, Injectable } from '@nestjs/common';
import { InventoryItem } from '../../domain/entities/inventory-item.entity';
import {
  INVENTORY_REPOSITORY,
  InventoryRepository,
} from '../../domain/repositories/inventory.repository';

/**
 * Crea el item de inventario para un SKU (idempotente). Lo invoca el consumidor
 * del evento `catalog.product.created`. Si ya existe, no lo altera.
 */
@Injectable()
export class CreateInventoryItemUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepository,
  ) {}

  async execute(sku: string, initialOnHand = 0): Promise<InventoryItem> {
    const normalized = sku.trim().toUpperCase();
    const existing = await this.repository.findBySku(normalized);
    if (existing) {
      return existing;
    }
    const item = InventoryItem.create(normalized, initialOnHand);
    return this.repository.upsert(item);
  }
}
