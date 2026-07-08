import { Product } from '../../domain/entities/product.entity';
import { ProductType } from '../../domain/value-objects/product-type.vo';

export const PRODUCT_SEARCH = Symbol('PRODUCT_SEARCH');

export interface SearchProductsParams {
  q: string;
  type?: ProductType;
  page: number;
  limit: number;
}

export interface SearchProductsResult {
  items: Product[];
  total: number;
}

/**
 * Puerto de búsqueda de texto completo sobre el catálogo. La implementación
 * (OpenSearch) indexa los productos y resuelve búsquedas por relevancia y con
 * tolerancia a erratas. La capa de aplicación cae a la BD si esto falla.
 */
export interface ProductSearchIndex {
  index(product: Product): Promise<void>;
  indexMany(products: Product[]): Promise<void>;
  search(params: SearchProductsParams): Promise<SearchProductsResult>;
}
