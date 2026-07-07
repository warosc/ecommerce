import { ImageStorage } from '../../src/catalog/application/ports/image-storage';
import { SetProductTryOnImageUseCase } from '../../src/catalog/application/use-cases/set-try-on-image/set-try-on-image.usecase';
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

describe('SetProductTryOnImageUseCase', () => {
  it('sube la montura y fija su URL en tryOnImageUrl', async () => {
    const product = seedProduct();
    expect(product.tryOnImageUrl).toBeNull();
    const repo = new InMemoryProductRepository([product]);
    const updated = await new SetProductTryOnImageUseCase(repo, storage).execute(product.id, {
      buffer: Buffer.from('montura'),
      filename: 'redonda.png',
      contentType: 'image/png',
    });
    expect(updated.tryOnImageUrl).toBe(
      `http://minio.test/tryon/${product.id}/redonda.png`,
    );
  });

  it('reemplaza la montura anterior (una por producto)', async () => {
    const product = seedProduct();
    const repo = new InMemoryProductRepository([product]);
    const useCase = new SetProductTryOnImageUseCase(repo, storage);
    await useCase.execute(product.id, {
      buffer: Buffer.from('a'),
      filename: 'v1.png',
      contentType: 'image/png',
    });
    const second = await useCase.execute(product.id, {
      buffer: Buffer.from('b'),
      filename: 'v2.png',
      contentType: 'image/png',
    });
    expect(second.tryOnImageUrl).toBe(`http://minio.test/tryon/${product.id}/v2.png`);
  });

  it('lanza ProductNotFoundError si el producto no existe', async () => {
    const useCase = new SetProductTryOnImageUseCase(new InMemoryProductRepository(), storage);
    await expect(
      useCase.execute('nope', { buffer: Buffer.from('x'), filename: 'a.png', contentType: 'image/png' }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('lanza ProductNotFoundError si el producto desaparece antes de fijar la URL', async () => {
    const product = seedProduct();
    // El producto existe al buscarlo pero setTryOnImage devuelve null (borrado en carrera).
    const repo = {
      findById: async () => product,
      setTryOnImage: async () => null,
    } as unknown as ProductRepository;
    const useCase = new SetProductTryOnImageUseCase(repo, storage);
    await expect(
      useCase.execute(product.id, { buffer: Buffer.from('x'), filename: 'a.png', contentType: 'image/png' }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });
});
