import { Inject, Injectable } from '@nestjs/common';
import type { PaginatedResult } from '@optimus/contracts';
import { Product } from '../../../domain/entities/product.entity';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../../domain/repositories/product.repository';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  ListProductsQuery,
  MAX_LIMIT,
} from './list-products.query';

/**
 * Lista productos con paginación y filtros opcionales (tipo, búsqueda).
 * Normaliza `page`/`limit` a rangos seguros antes de consultar el repositorio.
 */
@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repository: ProductRepository,
  ) {}

  async execute(query: ListProductsQuery = {}): Promise<PaginatedResult<Product>> {
    const page = this.normalizePage(query.page);
    const limit = this.normalizeLimit(query.limit);
    const search = query.search?.trim() || undefined;

    const { items, total } = await this.repository.findMany({
      page,
      limit,
      type: query.type,
      search,
      brand: query.brand?.trim() || undefined,
      sort: query.sort,
    });

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  private normalizePage(page?: number): number {
    if (!page || !Number.isFinite(page) || page < 1) return DEFAULT_PAGE;
    return Math.floor(page);
  }

  private normalizeLimit(limit?: number): number {
    if (!limit || !Number.isFinite(limit) || limit < 1) return DEFAULT_LIMIT;
    return Math.min(Math.floor(limit), MAX_LIMIT);
  }
}
