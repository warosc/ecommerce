import {
  PRODUCT_TYPES,
  isProductType,
} from '../../src/catalog/domain/value-objects/product-type.vo';

describe('ProductType', () => {
  it('expone los tres tipos de producto de una óptica', () => {
    expect([...PRODUCT_TYPES]).toEqual(['FRAME', 'LENS', 'ACCESSORY']);
  });

  it('isProductType acepta valores válidos', () => {
    expect(isProductType('FRAME')).toBe(true);
    expect(isProductType('LENS')).toBe(true);
    expect(isProductType('ACCESSORY')).toBe(true);
  });

  it('isProductType rechaza valores inválidos o no-string', () => {
    expect(isProductType('frame')).toBe(false);
    expect(isProductType('UNKNOWN')).toBe(false);
    expect(isProductType(123)).toBe(false);
    expect(isProductType(null)).toBe(false);
  });
});
