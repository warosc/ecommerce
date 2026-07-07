import { ListProductsUseCase } from '../../src/catalog/application/use-cases/list-products/list-products.usecase';
import { Product } from '../../src/catalog/domain/entities/product.entity';
import { Money } from '../../src/catalog/domain/value-objects/money.vo';
import { ProductType } from '../../src/catalog/domain/value-objects/product-type.vo';
import { Sku } from '../../src/catalog/domain/value-objects/sku.vo';
import { InMemoryProductRepository } from '../support/in-memory-product.repository';

function makeProduct(sku: string, name: string, type: ProductType): Product {
  return Product.create({
    sku: Sku.create(sku),
    name,
    description: '',
    type,
    brand: 'Optimus',
    price: Money.create(10000),
  });
}

describe('ListProductsUseCase', () => {
  function buildWith(count: number): ListProductsUseCase {
    const products = Array.from({ length: count }, (_, i) =>
      makeProduct(`SKU-${i}`, `Producto ${i}`, 'FRAME'),
    );
    return new ListProductsUseCase(new InMemoryProductRepository(products));
  }

  it('usa page=1 y limit=20 por defecto', async () => {
    const result = await buildWith(25).execute();
    expect(result.data).toHaveLength(20);
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 25, totalPages: 2 });
  });

  it('respeta page y limit personalizados', async () => {
    const result = await buildWith(25).execute({ page: 2, limit: 10 });
    expect(result.data).toHaveLength(10);
    expect(result.meta.page).toBe(2);
    expect(result.meta.totalPages).toBe(3);
  });

  it('limita el limit al máximo permitido (100)', async () => {
    const result = await buildWith(5).execute({ limit: 999 });
    expect(result.meta.limit).toBe(100);
  });

  it('normaliza page/limit inválidos a los valores por defecto', async () => {
    const result = await buildWith(3).execute({ page: 0, limit: -5 });
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(20);
  });

  it('devuelve totalPages=0 cuando no hay resultados', async () => {
    const result = await buildWith(0).execute();
    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
    expect(result.meta.totalPages).toBe(0);
  });

  it('filtra por tipo', async () => {
    const repo = new InMemoryProductRepository([
      makeProduct('A-1', 'Montura', 'FRAME'),
      makeProduct('B-1', 'Lente', 'LENS'),
    ]);
    const result = await new ListProductsUseCase(repo).execute({ type: 'LENS' });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].type).toBe('LENS');
  });

  it('busca por nombre o SKU (case-insensitive)', async () => {
    const repo = new InMemoryProductRepository([
      makeProduct('RAY-1', 'Montura Aviador', 'FRAME'),
      makeProduct('OTR-1', 'Lente Azul', 'LENS'),
    ]);
    const byName = await new ListProductsUseCase(repo).execute({ search: 'aviador' });
    expect(byName.data).toHaveLength(1);

    const bySku = await new ListProductsUseCase(repo).execute({ search: 'ray' });
    expect(bySku.data).toHaveLength(1);
  });
});
