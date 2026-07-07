import { RegisterMovementUseCase } from '../../src/inventory/application/use-cases/register-movement.usecase';
import { STOCK_CHANGED_ROUTING_KEY } from '../../src/inventory/application/events.constants';
import { EventPublisher } from '../../src/inventory/application/ports/event-publisher';
import { InventoryItem } from '../../src/inventory/domain/entities/inventory-item.entity';
import {
  InsufficientStockError,
  InventoryItemNotFoundError,
} from '../../src/inventory/domain/errors';
import { InMemoryInventoryRepository } from '../support/in-memory-inventory.repository';

function makePublisher(): EventPublisher & { calls: Array<{ key: string; payload: unknown }> } {
  const calls: Array<{ key: string; payload: unknown }> = [];
  return {
    calls,
    async publish(key: string, payload: unknown) {
      calls.push({ key, payload });
    },
  };
}

describe('RegisterMovementUseCase', () => {
  it('aplica el movimiento, persiste y publica stock.changed', async () => {
    const repo = new InMemoryInventoryRepository([InventoryItem.create('FR-1', 5)]);
    const pub = makePublisher();
    const item = await new RegisterMovementUseCase(repo, pub).execute('fr-1', {
      type: 'RECEIPT',
      quantity: 3,
    });

    expect(item.onHand).toBe(8);
    expect(pub.calls).toHaveLength(1);
    expect(pub.calls[0].key).toBe(STOCK_CHANGED_ROUTING_KEY);
    expect(pub.calls[0].payload).toEqual({ sku: 'FR-1', onHand: 8 });
    expect(await repo.findMovements('FR-1')).toHaveLength(1);
  });

  it('lanza NotFound si el SKU no tiene inventario', async () => {
    const useCase = new RegisterMovementUseCase(new InMemoryInventoryRepository(), makePublisher());
    await expect(useCase.execute('nope', { type: 'RECEIPT', quantity: 1 })).rejects.toBeInstanceOf(
      InventoryItemNotFoundError,
    );
  });

  it('propaga InsufficientStock y no publica evento', async () => {
    const repo = new InMemoryInventoryRepository([InventoryItem.create('FR-1', 1)]);
    const pub = makePublisher();
    await expect(
      new RegisterMovementUseCase(repo, pub).execute('FR-1', { type: 'ISSUE', quantity: 5 }),
    ).rejects.toBeInstanceOf(InsufficientStockError);
    expect(pub.calls).toHaveLength(0);
  });
});
