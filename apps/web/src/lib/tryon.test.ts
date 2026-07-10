import type { ProductDto } from '@optimus/contracts';
import { describe, expect, it } from 'vitest';
import { DEMO_FRAMES, framesFromProducts } from './tryon';

function product(overrides: Partial<ProductDto>): ProductDto {
  return {
    id: 'p1',
    sku: 'FR-1',
    name: 'Montura',
    description: '',
    type: 'FRAME',
    brand: 'Optimus',
    price: { amount: 45000, currency: 'GTQ' },
    stock: 5,
    images: [],
    compareAtAmount: null,
      tryOnImageUrl: null,
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('DEMO_FRAMES', () => {
  it('incluye 3 monturas de demostración con src transparente', () => {
    expect(DEMO_FRAMES).toHaveLength(3);
    expect(DEMO_FRAMES.every((f) => f.src.startsWith('/tryon-frames/'))).toBe(true);
  });
});

describe('framesFromProducts', () => {
  it('mapea solo los productos con tryOnImageUrl', () => {
    const frames = framesFromProducts([
      product({ id: 'a', name: 'Con montura', tryOnImageUrl: 'http://minio/tryon/a.png' }),
      product({ id: 'b', name: 'Sin montura', tryOnImageUrl: null }),
    ]);
    expect(frames).toEqual([
      { id: 'a', label: 'Con montura', src: 'http://minio/tryon/a.png' },
    ]);
  });

  it('devuelve vacío si ningún producto tiene montura', () => {
    expect(framesFromProducts([product({ tryOnImageUrl: null })])).toEqual([]);
  });
});
