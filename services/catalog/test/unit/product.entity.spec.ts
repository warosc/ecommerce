import { Product } from '../../src/catalog/domain/entities/product.entity';
import { InvalidProductError } from '../../src/catalog/domain/errors/invalid-product.error';
import { Money } from '../../src/catalog/domain/value-objects/money.vo';
import { Sku } from '../../src/catalog/domain/value-objects/sku.vo';

function validInput(overrides: Partial<Parameters<typeof Product.create>[0]> = {}) {
  return {
    sku: Sku.create('FR-1'),
    name: 'Montura Classic',
    description: 'Una montura',
    type: 'FRAME' as const,
    brand: 'Optimus',
    price: Money.create(45000),
    ...overrides,
  };
}

describe('Product.create', () => {
  it('crea un producto válido con id, timestamps y valores por defecto', () => {
    const product = Product.create(validInput());

    expect(product.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(product.name).toBe('Montura Classic');
    expect(product.stock).toBe(0);
    expect(product.images).toEqual([]);
    expect(product.active).toBe(true);
    expect(product.createdAt).toBeInstanceOf(Date);
    expect(product.updatedAt).toBeInstanceOf(Date);
  });

  it('acepta un precio anterior (compareAtAmount) válido', () => {
    const product = Product.create(validInput({ compareAtAmount: 60000 }));
    expect(product.compareAtAmount).toBe(60000);
  });

  it('deja compareAtAmount en null si se omite', () => {
    expect(Product.create(validInput()).compareAtAmount).toBeNull();
  });

  it('rechaza un compareAtAmount inválido', () => {
    expect(() => Product.create(validInput({ compareAtAmount: -100 }))).toThrow(InvalidProductError);
    expect(() => Product.create(validInput({ compareAtAmount: 12.5 }))).toThrow(InvalidProductError);
  });

  it('acepta medidas en notación óptica y las recorta', () => {
    const product = Product.create(validInput({ measurements: ' 52-18-140 ' }));
    expect(product.measurements).toBe('52-18-140');
  });

  it('deja measurements en null si se omite o va vacío', () => {
    expect(Product.create(validInput()).measurements).toBeNull();
    expect(Product.create(validInput({ measurements: '   ' })).measurements).toBeNull();
  });

  it('rechaza medidas con formato inválido', () => {
    expect(() => Product.create(validInput({ measurements: '52x18x140' }))).toThrow(
      InvalidProductError,
    );
    expect(() => Product.create(validInput({ measurements: 'grande' }))).toThrow(
      InvalidProductError,
    );
  });

  it('aplica descripción vacía por defecto cuando se omite', () => {
    const input = validInput();
    delete (input as { description?: string }).description;
    const product = Product.create(input);
    expect(product.description).toBe('');
  });

  it('recorta el nombre y respeta stock/images/active provistos', () => {
    const product = Product.create(
      validInput({ name: '  Lente Azul  ', stock: 7, images: ['a.jpg'], active: false }),
    );
    expect(product.name).toBe('Lente Azul');
    expect(product.stock).toBe(7);
    expect(product.images).toEqual(['a.jpg']);
    expect(product.active).toBe(false);
  });

  it('devuelve una copia de images (encapsulación)', () => {
    const product = Product.create(validInput({ images: ['a.jpg'] }));
    product.images.push('b.jpg');
    expect(product.images).toEqual(['a.jpg']);
  });

  it('rechaza nombre demasiado corto', () => {
    expect(() => Product.create(validInput({ name: 'a' }))).toThrow(InvalidProductError);
  });

  it('rechaza marca vacía', () => {
    expect(() => Product.create(validInput({ brand: '  ' }))).toThrow(InvalidProductError);
  });

  it.each([-1, 2.5])('rechaza stock inválido %s', (stock) => {
    expect(() => Product.create(validInput({ stock }))).toThrow(InvalidProductError);
  });

  it('rechaza imágenes con URLs vacías', () => {
    expect(() => Product.create(validInput({ images: [''] }))).toThrow(InvalidProductError);
  });
});

describe('Product.fromPersistence', () => {
  it('reconstruye sin regenerar id ni fechas', () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z');
    const product = Product.fromPersistence({
      id: 'fixed-id',
      sku: Sku.create('AC-1'),
      name: 'Estuche',
      description: '',
      type: 'ACCESSORY',
      brand: 'Optimus',
      price: Money.create(6000),
      compareAtAmount: null,
      measurements: null,
      stock: 10,
      images: [],
      tryOnImageUrl: null,
      active: true,
      createdAt,
      updatedAt: createdAt,
    });
    expect(product.id).toBe('fixed-id');
    expect(product.createdAt).toBe(createdAt);
    expect(product.type).toBe('ACCESSORY');
    expect(product.sku.value).toBe('AC-1');
    expect(product.tryOnImageUrl).toBeNull();
  });
});
