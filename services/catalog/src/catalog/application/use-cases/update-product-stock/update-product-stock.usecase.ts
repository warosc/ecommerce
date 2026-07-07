import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../../domain/repositories/product.repository';

/**
 * Actualiza el stock (read-model) de un producto. Lo invoca el consumidor del
 * evento `inventory.stock.changed`; Inventario es la fuente de verdad del stock.
 */
@Injectable()
export class UpdateProductStockUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repository: ProductRepository,
  ) {}

  async execute(sku: string, onHand: number): Promise<void> {
    const normalized = (sku ?? '').trim().toUpperCase();
    if (!normalized || !Number.isInteger(onHand) || onHand < 0) {
      return;
    }
    await this.repository.updateStockBySku(normalized, onHand);
  }
}
