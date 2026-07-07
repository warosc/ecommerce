import { GetProductUseCase } from '../../src/catalog/application/use-cases/get-product/get-product.usecase';
import { Product } from '../../src/catalog/domain/entities/product.entity';
import { ProductNotFoundError } from '../../src/catalog/domain/errors/product-not-found.error';
import { Money } from '../../src/catalog/domain/value-objects/money.vo';
import { Sku } from '../../src/catalog/domain/value-objects/sku.vo';
import { InMemoryProductRepository } from '../support/in-memory-product.repository';

describe('GetProductUseCase', () => {
  const product = Product.create({
    sku: Sku.create('FR-1'),
    name: 'Montura Classic',
    description: '',
    type: 'FRAME',
    brand: 'Optimus',
    price: Money.create(45000),
  });

  it('devuelve el producto cuando existe', async () => {
    const useCase = new GetProductUseCase(new InMemoryProductRepository([product]));
    const found = await useCase.execute(product.id);
    expect(found.id).toBe(product.id);
  });

  it('lanza ProductNotFoundError cuando no existe', async () => {
    const useCase = new GetProductUseCase(new InMemoryProductRepository());
    await expect(useCase.execute('inexistente')).rejects.toBeInstanceOf(
      ProductNotFoundError,
    );
  });
});
