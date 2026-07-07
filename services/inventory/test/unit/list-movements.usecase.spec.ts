import { ListMovementsUseCase } from '../../src/inventory/application/use-cases/list-movements.usecase';
import { RegisterMovementUseCase } from '../../src/inventory/application/use-cases/register-movement.usecase';
import { InventoryItem } from '../../src/inventory/domain/entities/inventory-item.entity';
import { InMemoryInventoryRepository } from '../support/in-memory-inventory.repository';

describe('ListMovementsUseCase', () => {
  it('devuelve los movimientos registrados de un SKU', async () => {
    const repo = new InMemoryInventoryRepository([InventoryItem.create('FR-1', 5)]);
    const publisher = { publish: async () => undefined };
    await new RegisterMovementUseCase(repo, publisher).execute('FR-1', {
      type: 'RECEIPT',
      quantity: 2,
    });

    const movements = await new ListMovementsUseCase(repo).execute('fr-1');
    expect(movements).toHaveLength(1);
    expect(movements[0].type).toBe('RECEIPT');
  });

  it('devuelve lista vacía si no hay movimientos', async () => {
    const movements = await new ListMovementsUseCase(new InMemoryInventoryRepository()).execute('x');
    expect(movements).toEqual([]);
  });
});
