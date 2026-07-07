import { StockMovement } from '../../src/inventory/domain/entities/stock-movement.entity';

describe('StockMovement', () => {
  it('crea un movimiento con todos sus campos accesibles', () => {
    const mov = StockMovement.create('FR-1', 'RECEIPT', 5, 'compra');
    expect(mov.id).toMatch(/[0-9a-f-]{36}/);
    expect(mov.sku).toBe('FR-1');
    expect(mov.type).toBe('RECEIPT');
    expect(mov.quantity).toBe(5);
    expect(mov.reason).toBe('compra');
    expect(mov.createdAt).toBeInstanceOf(Date);
  });

  it('normaliza reason vacío/espacios a undefined', () => {
    expect(StockMovement.create('FR-1', 'ISSUE', 1, '   ').reason).toBeUndefined();
    expect(StockMovement.create('FR-1', 'ISSUE', 1).reason).toBeUndefined();
  });

  it('reconstruye desde persistencia', () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z');
    const mov = StockMovement.fromPersistence({
      id: 'fixed',
      sku: 'AC-1',
      type: 'ADJUSTMENT',
      quantity: 3,
      reason: 'ajuste',
      createdAt,
    });
    expect(mov.id).toBe('fixed');
    expect(mov.type).toBe('ADJUSTMENT');
    expect(mov.createdAt).toBe(createdAt);
    expect(mov.reason).toBe('ajuste');
  });
});
