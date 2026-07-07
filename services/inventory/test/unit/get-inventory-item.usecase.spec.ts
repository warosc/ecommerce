import { GetInventoryItemUseCase } from '../../src/inventory/application/use-cases/get-inventory-item.usecase';
import { InventoryItem } from '../../src/inventory/domain/entities/inventory-item.entity';
import { InventoryItemNotFoundError } from '../../src/inventory/domain/errors';
import { InMemoryInventoryRepository } from '../support/in-memory-inventory.repository';

describe('GetInventoryItemUseCase', () => {
  it('devuelve el item existente (normaliza el SKU)', async () => {
    const repo = new InMemoryInventoryRepository([InventoryItem.create('FR-1', 3)]);
    const item = await new GetInventoryItemUseCase(repo).execute('fr-1');
    expect(item.onHand).toBe(3);
  });

  it('lanza InventoryItemNotFoundError si no existe', async () => {
    const useCase = new GetInventoryItemUseCase(new InMemoryInventoryRepository());
    await expect(useCase.execute('nope')).rejects.toBeInstanceOf(InventoryItemNotFoundError);
  });
});
