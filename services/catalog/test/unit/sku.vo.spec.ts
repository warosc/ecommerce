import { InvalidProductError } from '../../src/catalog/domain/errors/invalid-product.error';
import { Sku } from '../../src/catalog/domain/value-objects/sku.vo';

describe('Sku', () => {
  it('normaliza a mayúsculas y recorta espacios', () => {
    const sku = Sku.create('  fr-classic-01 ');
    expect(sku.value).toBe('FR-CLASSIC-01');
    expect(sku.toString()).toBe('FR-CLASSIC-01');
  });

  it('considera iguales dos SKU con el mismo valor', () => {
    expect(Sku.create('abc-1').equals(Sku.create('ABC-1'))).toBe(true);
    expect(Sku.create('abc-1').equals(Sku.create('abc-2'))).toBe(false);
  });

  it.each(['', ' ', 'a', '!!', 'con espacio', 'a'.repeat(33)])(
    'rechaza el SKU inválido "%s"',
    (raw) => {
      expect(() => Sku.create(raw)).toThrow(InvalidProductError);
    },
  );
});
