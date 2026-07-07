import { CreateProductUseCase } from '../../src/catalog/application/use-cases/create-product/create-product.usecase';
import { CreateProductCommand } from '../../src/catalog/application/use-cases/create-product/create-product.command';
import { PRODUCT_CREATED_ROUTING_KEY } from '../../src/catalog/application/events.constants';
import { EventPublisher } from '../../src/catalog/application/ports/event-publisher';
import { Product } from '../../src/catalog/domain/entities/product.entity';
import { DuplicateSkuError } from '../../src/catalog/domain/errors/duplicate-sku.error';
import { InvalidProductError } from '../../src/catalog/domain/errors/invalid-product.error';
import { Money } from '../../src/catalog/domain/value-objects/money.vo';
import { Sku } from '../../src/catalog/domain/value-objects/sku.vo';
import { InMemoryProductRepository } from '../support/in-memory-product.repository';

const baseCommand: CreateProductCommand = {
  sku: 'ln-nueva-01',
  name: 'Lente Nueva',
  description: 'Descripción',
  type: 'LENS',
  brand: 'Optimus Vision',
  priceAmount: 55000,
};

function makePublisher(): EventPublisher & { calls: Array<{ key: string; payload: unknown }> } {
  const calls: Array<{ key: string; payload: unknown }> = [];
  return {
    calls,
    async publish(key: string, payload: unknown) {
      calls.push({ key, payload });
    },
  };
}

describe('CreateProductUseCase', () => {
  it('crea, persiste y publica el evento product.created', async () => {
    const repo = new InMemoryProductRepository();
    const publisher = makePublisher();
    const created = await new CreateProductUseCase(repo, publisher).execute(baseCommand);

    expect(created.sku.value).toBe('LN-NUEVA-01');
    expect(created.price.amount).toBe(55000);
    expect(await repo.findById(created.id)).not.toBeNull();

    expect(publisher.calls).toHaveLength(1);
    expect(publisher.calls[0].key).toBe(PRODUCT_CREATED_ROUTING_KEY);
    expect(publisher.calls[0].payload).toMatchObject({ sku: 'LN-NUEVA-01', name: 'Lente Nueva' });
  });

  it('usa GTQ como moneda por defecto', async () => {
    const created = await new CreateProductUseCase(
      new InMemoryProductRepository(),
      makePublisher(),
    ).execute(baseCommand);
    expect(created.price.currency).toBe('GTQ');
  });

  it('lanza DuplicateSkuError y no publica evento si el SKU ya existe', async () => {
    const existing = Product.create({
      sku: Sku.create('LN-NUEVA-01'),
      name: 'Existente',
      description: '',
      type: 'LENS',
      brand: 'Optimus',
      price: Money.create(1000),
    });
    const publisher = makePublisher();
    const useCase = new CreateProductUseCase(
      new InMemoryProductRepository([existing]),
      publisher,
    );

    await expect(useCase.execute(baseCommand)).rejects.toBeInstanceOf(DuplicateSkuError);
    expect(publisher.calls).toHaveLength(0);
  });

  it('lanza InvalidProductError si el SKU tiene formato inválido', async () => {
    const useCase = new CreateProductUseCase(new InMemoryProductRepository(), makePublisher());
    await expect(
      useCase.execute({ ...baseCommand, sku: '!!' }),
    ).rejects.toBeInstanceOf(InvalidProductError);
  });
});
