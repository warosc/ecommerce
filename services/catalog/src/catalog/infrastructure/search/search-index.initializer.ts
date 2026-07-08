import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../domain/repositories/product.repository';
import { PRODUCT_SEARCH, ProductSearchIndex } from '../../application/ports/product-search';

/**
 * Al arrancar, reindexa todos los productos existentes en el buscador (backfill
 * idempotente). Best-effort: si OpenSearch no está listo, se registra y sigue.
 */
@Injectable()
export class SearchIndexInitializer implements OnApplicationBootstrap {
  private readonly logger = new Logger(SearchIndexInitializer.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repository: ProductRepository,
    @Inject(PRODUCT_SEARCH) private readonly search: ProductSearchIndex,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const { items } = await this.repository.findMany({ page: 1, limit: 1000 });
      await this.search.indexMany(items);
      this.logger.log(`Backfill: ${items.length} productos indexados en el buscador.`);
    } catch (err) {
      this.logger.warn(`No se pudo hacer el backfill del buscador: ${(err as Error).message}`);
    }
  }
}
