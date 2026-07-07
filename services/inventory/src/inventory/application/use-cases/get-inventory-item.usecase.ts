import { Inject, Injectable } from '@nestjs/common';
import { InventoryItem } from '../../domain/entities/inventory-item.entity';
import { InventoryItemNotFoundError } from '../../domain/errors';
import {
  INVENTORY_REPOSITORY,
  InventoryRepository,
} from '../../domain/repositories/inventory.repository';

@Injectable()
export class GetInventoryItemUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepository,
  ) {}

  async execute(sku: string): Promise<InventoryItem> {
    const normalized = sku.trim().toUpperCase();
    const item = await this.repository.findBySku(normalized);
    if (!item) {
      throw new InventoryItemNotFoundError(normalized);
    }
    return item;
  }
}
