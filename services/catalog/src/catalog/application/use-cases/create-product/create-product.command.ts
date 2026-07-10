import { ProductType } from '../../../domain/value-objects/product-type.vo';

/** Datos de entrada del caso de uso CreateProduct. */
export interface CreateProductCommand {
  sku: string;
  name: string;
  description: string;
  type: ProductType;
  brand: string;
  /** Importe en centavos (entero). */
  priceAmount: number;
  /** Precio anterior en centavos (opcional; para mostrar descuento). */
  compareAtAmount?: number;
  /** ISO 4217; por defecto 'GTQ'. */
  currency?: string;
  stock?: number;
  images?: string[];
}
