import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../../domain/repositories/product.repository';
import { PRODUCT_SEARCH, ProductSearchIndex } from '../../ports/product-search';

/**
 * Actualiza el stock (read-model) de un producto. Lo invoca el consumidor del
 * evento `inventory.stock.changed`; Inventario es la fuente de verdad del stock.
 * Reindexa en el buscador para que las existencias no queden obsoletas.
 */
@Injectable()
export class UpdateProductStockUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repository: ProductRepository,
    @Inject(PRODUCT_SEARCH) private readonly search: ProductSearchIndex,
  ) {}

  async execute(sku: string, onHand: number): Promise<void> {
    const normalized = (sku ?? '').trim().toUpperCase();
    if (!normalized || !Number.isInteger(onHand) || onHand < 0) {
      return;
    }
    await this.repository.updateStockBySku(normalized, onHand);
    const product = await this.repository.findBySku(normalized);
    if (product) {
      await this.search.index(product).catch(() => undefined);
    }
  }
}
