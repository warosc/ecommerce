import {
  MOVEMENT_TYPES,
  isMovementType,
} from '../../src/inventory/domain/value-objects/movement-type.vo';

describe('MovementType', () => {
  it('define los tres tipos de movimiento', () => {
    expect([...MOVEMENT_TYPES]).toEqual(['RECEIPT', 'ISSUE', 'ADJUSTMENT']);
  });

  it('valida tipos correctos e incorrectos', () => {
    expect(isMovementType('RECEIPT')).toBe(true);
    expect(isMovementType('ISSUE')).toBe(true);
    expect(isMovementType('unknown')).toBe(false);
    expect(isMovementType(5)).toBe(false);
  });
});
