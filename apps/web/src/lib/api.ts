import type { PaginatedResult, ProductDto, ProductSort, ProductType } from '@optimus/contracts';

const DEFAULT_BASE_URL = 'http://localhost:3001/api';

/**
 * Resuelve la URL base de la API según el entorno de ejecución:
 * - En el servidor (Server Components dentro del contenedor) usa la red interna
 *   de Docker (`API_BASE_URL_INTERNAL`).
 * - En el navegador usa la URL pública (`NEXT_PUBLIC_API_BASE_URL`).
 */
export function resolveApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return (
      process.env.API_BASE_URL_INTERNAL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      DEFAULT_BASE_URL
    );
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;
}

export interface ProductFilters {
  type?: ProductType;
  brand?: string;
  sort?: ProductSort;
  limit?: number;
}

/** Obtiene el listado paginado de productos (con filtros opcionales). */
export async function getProducts(
  filters: ProductFilters = {},
): Promise<PaginatedResult<ProductDto>> {
  const qs = new URLSearchParams();
  if (filters.type) qs.set('type', filters.type);
  if (filters.brand) qs.set('brand', filters.brand);
  if (filters.sort) qs.set('sort', filters.sort);
  qs.set('limit', String(filters.limit ?? 100));

  const response = await fetch(`${resolveApiBaseUrl()}/products?${qs}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Error al obtener productos: HTTP ${response.status}`);
  }

  return (await response.json()) as PaginatedResult<ProductDto>;
}

/** Obtiene un producto por id. Devuelve null si no existe (404). */
export async function getProduct(id: string): Promise<ProductDto | null> {
  const response = await fetch(`${resolveApiBaseUrl()}/products/${id}`, {
    cache: 'no-store',
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Error al obtener el producto: HTTP ${response.status}`);
  }
  return (await response.json()) as ProductDto;
}

/**
 * Busca productos por texto (OpenSearch con respaldo en BD, resuelto por el
 * Catálogo). Devuelve el mismo formato paginado que {@link getProducts}.
 */
export async function searchProducts(
  q: string,
  type?: ProductType,
): Promise<PaginatedResult<ProductDto>> {
  const qs = new URLSearchParams({ q, limit: '100' });
  if (type) qs.set('type', type);
  const response = await fetch(`${resolveApiBaseUrl()}/products/search?${qs}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Error al buscar productos: HTTP ${response.status}`);
  }

  return (await response.json()) as PaginatedResult<ProductDto>;
}
