import type { ProductDto } from '@optimus/contracts';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PD_RATIO,
  DEMO_FRAMES,
  framesFromProducts,
  pdRatioFromMeasurements,
} from './tryon';

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
    measurements: null,
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

describe('pdRatioFromMeasurements', () => {
  it('calcula el ratio desde calibre-puente-varilla', () => {
    // 52-18-140: ancho frontal 2·52+18 = 122; centros a 52+18 = 70 → 70/122.
    expect(pdRatioFromMeasurements('52-18-140')).toBeCloseTo(70 / 122, 5);
    // 58-14-140: ancho 130; centros a 72 → 72/130.
    expect(pdRatioFromMeasurements('58-14-140')).toBeCloseTo(72 / 130, 5);
  });

  it('recorta espacios', () => {
    expect(pdRatioFromMeasurements('  50-20-140  ')).toBeCloseTo(70 / 120, 5);
  });

  it('devuelve undefined si no hay medidas o el formato es inválido', () => {
    expect(pdRatioFromMeasurements(null)).toBeUndefined();
    expect(pdRatioFromMeasurements('')).toBeUndefined();
    expect(pdRatioFromMeasurements('52x18x140')).toBeUndefined();
    expect(pdRatioFromMeasurements('grande')).toBeUndefined();
  });

  it('siempre da un ratio plausible (entre 0.5 y 0.6) para medidas reales', () => {
    for (const m of ['48-16-135', '52-18-140', '58-14-140', '55-18-145']) {
      const r = pdRatioFromMeasurements(m) as number;
      expect(r).toBeGreaterThan(0.5);
      expect(r).toBeLessThan(0.6);
    }
  });
});

describe('framesFromProducts', () => {
  it('mapea solo los productos con tryOnImageUrl, con datos de compra', () => {
    const frames = framesFromProducts([
      product({ id: 'a', name: 'Con montura', tryOnImageUrl: 'http://minio/tryon/a.png' }),
      product({ id: 'b', name: 'Sin montura', tryOnImageUrl: null }),
    ]);
    expect(frames).toEqual([
      {
        id: 'a',
        label: 'Con montura',
        src: 'http://minio/tryon/a.png',
        pdRatio: undefined,
        product: { sku: 'FR-1', priceAmount: 45000, currency: 'GTQ', active: true },
      },
    ]);
  });

  it('deriva el pdRatio cuando el producto tiene medidas', () => {
    const [frame] = framesFromProducts([
      product({ tryOnImageUrl: 'http://minio/tryon/a.png', measurements: '52-18-140' }),
    ]);
    expect(frame.pdRatio).toBeCloseTo(70 / 122, 5);
  });

  it('propaga active=false para no ofrecer el carrito', () => {
    const [frame] = framesFromProducts([
      product({ tryOnImageUrl: 'http://minio/tryon/a.png', active: false }),
    ]);
    expect(frame.product?.active).toBe(false);
  });

  it('devuelve vacío si ningún producto tiene montura', () => {
    expect(framesFromProducts([product({ tryOnImageUrl: null })])).toEqual([]);
  });
});

describe('DEFAULT_PD_RATIO', () => {
  it('coincide con la geometría de las demos SVG (centros a 0.4·ancho)', () => {
    expect(DEFAULT_PD_RATIO).toBe(0.4);
  });
});
