import { AddProductImageUseCase } from '../../src/catalog/application/use-cases/add-product-image/add-product-image.usecase';
import { ImageStorage } from '../../src/catalog/application/ports/image-storage';
import { Product } from '../../src/catalog/domain/entities/product.entity';
import { ProductNotFoundError } from '../../src/catalog/domain/errors/product-not-found.error';
import { ProductRepository } from '../../src/catalog/domain/repositories/product.repository';
import { Money } from '../../src/catalog/domain/value-objects/money.vo';
import { Sku } from '../../src/catalog/domain/value-objects/sku.vo';
import { InMemoryProductRepository } from '../support/in-memory-product.repository';

const storage: ImageStorage = {
  async upload(prefix, input) {
    return `http://minio.test/${prefix}/${input.filename}`;
  },
};

function seedProduct(): Product {
  return Product.create({
    sku: Sku.create('FR-1'),
    name: 'Montura',
    description: '',
    type: 'FRAME',
    brand: 'Optimus',
    price: Money.create(45000),
  });
}

describe('AddProductImageUseCase', () => {
  it('sube la imagen y añade su URL al producto', async () => {
    const product = seedProduct();
    const repo = new InMemoryProductRepository([product]);
    const updated = await new AddProductImageUseCase(repo, storage).execute(product.id, {
      buffer: Buffer.from('imagen'),
      filename: 'gafas.jpg',
      contentType: 'image/jpeg',
    });
    expect(updated.images).toContain(
      `http://minio.test/products/${product.id}/gafas.jpg`,
    );
  });

  it('lanza ProductNotFoundError si el producto no existe', async () => {
    const useCase = new AddProductImageUseCase(new InMemoryProductRepository(), storage);
    await expect(
      useCase.execute('nope', { buffer: Buffer.from('x'), filename: 'a.jpg', contentType: 'image/jpeg' }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('lanza ProductNotFoundError si el producto desaparece antes de añadir la imagen', async () => {
    const product = seedProduct();
    const repo = {
      findById: async () => product,
      appendImage: async () => null,
    } as unknown as ProductRepository;
    const useCase = new AddProductImageUseCase(repo, storage);
    await expect(
      useCase.execute(product.id, { buffer: Buffer.from('x'), filename: 'a.jpg', contentType: 'image/jpeg' }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });
});
