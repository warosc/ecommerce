import { CreateInventoryItemUseCase } from '../../src/inventory/application/use-cases/create-inventory-item.usecase';
import { InventoryItem } from '../../src/inventory/domain/entities/inventory-item.entity';
import { InMemoryInventoryRepository } from '../support/in-memory-inventory.repository';

describe('CreateInventoryItemUseCase', () => {
  it('crea el item con el stock inicial (SKU normalizado)', async () => {
    const repo = new InMemoryInventoryRepository();
    const created = await new CreateInventoryItemUseCase(repo).execute('fr-1', 12);
    expect(created.sku).toBe('FR-1');
    expect(created.onHand).toBe(12);
    expect(await repo.findBySku('FR-1')).not.toBeNull();
  });

  it('es idempotente: si el item existe no lo altera', async () => {
    const repo = new InMemoryInventoryRepository([InventoryItem.create('FR-1', 5)]);
    const result = await new CreateInventoryItemUseCase(repo).execute('FR-1', 99);
    expect(result.onHand).toBe(5);
  });
});
