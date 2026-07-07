/** Tipos de movimiento de stock. Definido en el dominio (valor en runtime). */
export const MOVEMENT_TYPES = ['RECEIPT', 'ISSUE', 'ADJUSTMENT'] as const;

export type MovementType = (typeof MOVEMENT_TYPES)[number];

export function isMovementType(value: unknown): value is MovementType {
  return typeof value === 'string' && (MOVEMENT_TYPES as readonly string[]).includes(value);
}
