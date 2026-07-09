import { ProductSort } from '../../../domain/repositories/product.repository';
import { ProductType } from '../../../domain/value-objects/product-type.vo';

/** Entrada (sin normalizar) del caso de uso ListProducts. */
export interface ListProductsQuery {
  page?: number;
  limit?: number;
  type?: ProductType;
  search?: string;
  brand?: string;
  sort?: ProductSort;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
