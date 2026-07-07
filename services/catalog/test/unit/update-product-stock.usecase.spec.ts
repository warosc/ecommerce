import { UpdateProductStockUseCase } from '../../src/catalog/application/use-cases/update-product-stock/update-product-stock.usecase';
import { Product } from '../../src/catalog/domain/entities/product.entity';
import { Money } from '../../src/catalog/domain/value-objects/money.vo';
import { Sku } from '../../src/catalog/domain/value-objects/sku.vo';
import { InMemoryProductRepository } from '../support/in-memory-product.repository';

function seedProduct(): Product {
  return Product.create({
    sku: Sku.create('FR-1'),
    name: 'Montura',
    description: '',
    type: 'FRAME',
    brand: 'Optimus',
    price: Money.create(45000),
    stock: 5,
  });
}

describe('UpdateProductStockUseCase', () => {
  it('actualiza el stock del producto por SKU (read-model)', async () => {
    const repo = new InMemoryProductRepository([seedProduct()]);
    await new UpdateProductStockUseCase(repo).execute('fr-1', 12);
    const product = await repo.findBySku('FR-1');
    expect(product?.stock).toBe(12);
  });

  it('ignora entradas inválidas sin lanzar', async () => {
    const repo = new InMemoryProductRepository([seedProduct()]);
    await new UpdateProductStockUseCase(repo).execute('', 5);
    await new UpdateProductStockUseCase(repo).execute('FR-1', -1);
    await new UpdateProductStockUseCase(repo).execute('FR-1', 1.5);
    const product = await repo.findBySku('FR-1');
    expect(product?.stock).toBe(5);
  });
});
