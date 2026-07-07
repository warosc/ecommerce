import { Product } from '../entities/product.entity';
import { ProductType } from '../value-objects/product-type.vo';

/** Token de inyección del puerto (se bindea a un adaptador en catalog.module.ts). */
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

/** Filtro ya normalizado que recibe el repositorio para listar productos. */
export interface ListProductsFilter {
  page: number;
  limit: number;
  type?: ProductType;
  search?: string;
}

/** Resultado de una búsqueda paginada a nivel de repositorio. */
export interface FindManyResult {
  items: Product[];
  total: number;
}

/**
 * Puerto de salida del dominio hacia la persistencia. La capa de aplicación
 * depende solo de esta interfaz; la implementación concreta (Prisma, in-memory)
 * vive en infrastructure/test.
 */
export interface ProductRepository {
  findMany(filter: ListProductsFilter): Promise<FindManyResult>;
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  create(product: Product): Promise<Product>;
  /** Actualiza el stock (read-model) de un SKU. Usado por eventos de Inventario. */
  updateStockBySku(sku: string, stock: number): Promise<void>;
}
