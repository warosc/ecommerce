import type { PaginatedResult, ProductDto } from '@optimus/contracts';

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

/** Obtiene el listado paginado de productos desde el servicio de Catálogo. */
export async function getProducts(): Promise<PaginatedResult<ProductDto>> {
  const response = await fetch(`${resolveApiBaseUrl()}/products`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Error al obtener productos: HTTP ${response.status}`);
  }

  return (await response.json()) as PaginatedResult<ProductDto>;
}
