import { Inject, Injectable } from '@nestjs/common';
import { StockMovement } from '../../domain/entities/stock-movement.entity';
import {
  INVENTORY_REPOSITORY,
  InventoryRepository,
} from '../../domain/repositories/inventory.repository';

@Injectable()
export class ListMovementsUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepository,
  ) {}

  async execute(sku: string): Promise<StockMovement[]> {
    const normalized = sku.trim().toUpperCase();
    return this.repository.findMovements(normalized);
  }
}
