import { SearchProductsUseCase } from '../../src/catalog/application/use-cases/search-products/search-products.usecase';
import {
  ProductSearchIndex,
  SearchProductsParams,
} from '../../src/catalog/application/ports/product-search';
import { Product } from '../../src/catalog/domain/entities/product.entity';
import { Money } from '../../src/catalog/domain/value-objects/money.vo';
import { Sku } from '../../src/catalog/domain/value-objects/sku.vo';
import { InMemoryProductRepository } from '../support/in-memory-product.repository';

function makeProduct(sku: string, name: string): Product {
  return Product.create({
    sku: Sku.create(sku),
    name,
    description: '',
    type: 'FRAME',
    brand: 'Optimus',
    price: Money.create(1000),
  });
}

function searchStub(
  impl: (params: SearchProductsParams) => Promise<{ items: Product[]; total: number }>,
): ProductSearchIndex {
  return { async index() {}, async indexMany() {}, search: impl };
}

describe('SearchProductsUseCase', () => {
  it('devuelve resultados de OpenSearch cuando responde', async () => {
    const p = makeProduct('FR-1', 'Montura Uno');
    const useCase = new SearchProductsUseCase(
      searchStub(async () => ({ items: [p], total: 1 })),
      new InMemoryProductRepository(),
    );
    const res = await useCase.execute({ q: 'montura' });
    expect(res.total).toBe(1);
    expect(res.items[0].sku.value).toBe('FR-1');
  });

  it('cae a la BD si OpenSearch lanza error', async () => {
    const p = makeProduct('FR-2', 'Montura Dos');
    const repo = new InMemoryProductRepository([p]);
    const useCase = new SearchProductsUseCase(
      searchStub(async () => {
        throw new Error('opensearch down');
      }),
      repo,
    );
    const res = await useCase.execute({ q: 'dos' });
    expect(res.items).toHaveLength(1);
    expect(res.items[0].sku.value).toBe('FR-2');
  });

  it('fallback con q vacío y page/limit explícitos (busca todo en la BD)', async () => {
    const repo = new InMemoryProductRepository([makeProduct('FR-9', 'Nueve')]);
    const useCase = new SearchProductsUseCase(
      searchStub(async () => {
        throw new Error('down');
      }),
      repo,
    );
    const res = await useCase.execute({ q: '', page: 1, limit: 5 });
    expect(res.total).toBe(1);
  });

  it('normaliza page/limit y recorta el límite a 100', async () => {
    let captured: SearchProductsParams | null = null;
    const useCase = new SearchProductsUseCase(
      searchStub(async (params) => {
        captured = params;
        return { items: [], total: 0 };
      }),
      new InMemoryProductRepository(),
    );
    await useCase.execute({ q: '  gafas  ', type: 'LENS', limit: 999 });
    expect(captured).toEqual({ q: 'gafas', type: 'LENS', page: 1, limit: 100 });
  });
});
