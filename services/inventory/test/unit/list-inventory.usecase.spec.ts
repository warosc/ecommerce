import { ListInventoryUseCase } from '../../src/inventory/application/use-cases/list-inventory.usecase';
import { InventoryItem } from '../../src/inventory/domain/entities/inventory-item.entity';
import { InMemoryInventoryRepository } from '../support/in-memory-inventory.repository';

function seed(n: number): InventoryItem[] {
  return Array.from({ length: n }, (_, i) => InventoryItem.create(`SKU-${i}`, i));
}

describe('ListInventoryUseCase', () => {
  it('pagina con valores por defecto', async () => {
    const result = await new ListInventoryUseCase(
      new InMemoryInventoryRepository(seed(25)),
    ).execute();
    expect(result.data).toHaveLength(20);
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 25, totalPages: 2 });
  });

  it('respeta page/limit y acota el limit', async () => {
    const repo = new InMemoryInventoryRepository(seed(5));
    const r = await new ListInventoryUseCase(repo).execute({ page: 2, limit: 999 });
    expect(r.meta.limit).toBe(100);
    expect(r.meta.page).toBe(2);
  });

  it('devuelve totalPages 0 sin resultados', async () => {
    const r = await new ListInventoryUseCase(new InMemoryInventoryRepository()).execute();
    expect(r.meta.totalPages).toBe(0);
  });

  it('filtra por búsqueda de SKU', async () => {
    const repo = new InMemoryInventoryRepository([
      InventoryItem.create('FR-1', 1),
      InventoryItem.create('LN-2', 2),
    ]);
    const r = await new ListInventoryUseCase(repo).execute({ search: 'ln' });
    expect(r.data).toHaveLength(1);
    expect(r.data[0].sku).toBe('LN-2');
  });
});
