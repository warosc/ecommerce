export const CATALOG_GATEWAY = Symbol('CATALOG_GATEWAY');

export interface ProductSummary {
  sku: string;
  name: string;
  unitPriceAmount: number;
  currency: string;
  active: boolean;
}

/** Puerto hacia el servicio de Catálogo (lectura de producto por SKU). */
export interface CatalogGateway {
  getProductBySku(sku: string): Promise<ProductSummary | null>;
}
