/**
 * Formatea un importe en centavos a una cadena de moneda localizada (es-GT).
 * Ej: formatPrice(45000, 'GTQ') → "Q45.00" (según datos ICU disponibles).
 */
export function formatPrice(amountInCents: number, currency: string): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency,
  }).format(amountInCents / 100);
}
