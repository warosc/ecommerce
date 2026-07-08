import { Inject, Injectable, Logger } from '@nestjs/common';
import { Product } from '../../../domain/entities/product.entity';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../../domain/repositories/product.repository';
import { ProductType } from '../../../domain/value-objects/product-type.vo';
import { PRODUCT_SEARCH, ProductSearchIndex } from '../../ports/product-search';

export interface SearchProductsQuery {
  q?: string;
  type?: ProductType;
  page?: number;
  limit?: number;
}

/**
 * Busca productos por texto. Usa OpenSearch (relevancia + tolerancia a erratas) y,
 * si el buscador no responde, **cae a la BD** (contains) para no romper la web.
 */
@Injectable()
export class SearchProductsUseCase {
  private readonly logger = new Logger(SearchProductsUseCase.name);

  constructor(
    @Inject(PRODUCT_SEARCH) private readonly search: ProductSearchIndex,
    @Inject(PRODUCT_REPOSITORY) private readonly repository: ProductRepository,
  ) {}

  async execute(query: SearchProductsQuery): Promise<{ items: Product[]; total: number }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
    const q = (query.q ?? '').trim();

    try {
      return await this.search.search({ q, type: query.type, page, limit });
    } catch (err) {
      this.logger.warn(
        `Búsqueda vía OpenSearch falló; usando la BD como respaldo: ${(err as Error).message}`,
      );
      return this.repository.findMany({ page, limit, type: query.type, search: q || undefined });
    }
  }
}
