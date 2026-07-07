/**
 * Tipos de producto de una óptica. Se define aquí (dominio) el valor en runtime
 * usado para validar; @optimus/contracts solo expone el tipo estático.
 */
export const PRODUCT_TYPES = ['FRAME', 'LENS', 'ACCESSORY'] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

/** Type guard: comprueba si un string arbitrario es un ProductType válido. */
export function isProductType(value: unknown): value is ProductType {
  return typeof value === 'string' && (PRODUCT_TYPES as readonly string[]).includes(value);
}
