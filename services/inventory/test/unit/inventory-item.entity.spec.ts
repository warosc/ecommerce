import { InventoryItem } from '../../src/inventory/domain/entities/inventory-item.entity';
import {
  InsufficientStockError,
  InvalidMovementError,
} from '../../src/inventory/domain/errors';

describe('InventoryItem', () => {
  it('crea un item con SKU normalizado y onHand inicial', () => {
    const item = InventoryItem.create('  fr-1 ', 10);
    expect(item.sku).toBe('FR-1');
    expect(item.onHand).toBe(10);
    expect(item.createdAt).toBeInstanceOf(Date);
  });

  it('usa onHand 0 por defecto', () => {
    expect(InventoryItem.create('FR-1').onHand).toBe(0);
  });

  it('rechaza SKU vacío u onHand inválido', () => {
    expect(() => InventoryItem.create('  ')).toThrow(InvalidMovementError);
    expect(() => InventoryItem.create('FR-1', -1)).toThrow(InvalidMovementError);
    expect(() => InventoryItem.create('FR-1', 1.5)).toThrow(InvalidMovementError);
  });

  it('RECEIPT incrementa el onHand y devuelve el movimiento', () => {
    const item = InventoryItem.create('FR-1', 5);
    const mov = item.applyMovement('RECEIPT', 3, 'compra');
    expect(item.onHand).toBe(8);
    expect(mov.type).toBe('RECEIPT');
    expect(mov.quantity).toBe(3);
    expect(mov.reason).toBe('compra');
    expect(mov.sku).toBe('FR-1');
    expect(mov.id).toMatch(/[0-9a-f-]{36}/);
  });

  it('ISSUE decrementa el onHand', () => {
    const item = InventoryItem.create('FR-1', 5);
    item.applyMovement('ISSUE', 2);
    expect(item.onHand).toBe(3);
  });

  it('ISSUE por encima del stock lanza InsufficientStockError', () => {
    const item = InventoryItem.create('FR-1', 1);
    expect(() => item.applyMovement('ISSUE', 5)).toThrow(InsufficientStockError);
    expect(item.onHand).toBe(1);
  });

  it('ADJUSTMENT fija el onHand al valor absoluto (incluido 0)', () => {
    const item = InventoryItem.create('FR-1', 5);
    item.applyMovement('ADJUSTMENT', 0);
    expect(item.onHand).toBe(0);
    item.applyMovement('ADJUSTMENT', 42);
    expect(item.onHand).toBe(42);
  });

  it('rechaza cantidades inválidas', () => {
    const item = InventoryItem.create('FR-1', 5);
    expect(() => item.applyMovement('RECEIPT', 0)).toThrow(InvalidMovementError);
    expect(() => item.applyMovement('ISSUE', 0)).toThrow(InvalidMovementError);
    expect(() => item.applyMovement('RECEIPT', -3)).toThrow(InvalidMovementError);
  });

  it('reconstruye desde persistencia sin alterar valores', () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z');
    const item = InventoryItem.fromPersistence({
      sku: 'AC-1',
      onHand: 7,
      createdAt,
      updatedAt: createdAt,
    });
    expect(item.sku).toBe('AC-1');
    expect(item.onHand).toBe(7);
    expect(item.updatedAt).toBe(createdAt);
  });
});
