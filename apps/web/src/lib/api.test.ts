import type { PaginatedResult, ProductDto } from '@optimus/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getProducts, resolveApiBaseUrl } from './api';

const SAMPLE: PaginatedResult<ProductDto> = {
  data: [
    {
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
    },
  ],
  meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

describe('resolveApiBaseUrl', () => {
  const original = process.env.NEXT_PUBLIC_API_BASE_URL;
  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = original;
  });

  it('usa NEXT_PUBLIC_API_BASE_URL en el navegador (jsdom define window)', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://api.test/api';
    expect(resolveApiBaseUrl()).toBe('http://api.test/api');
  });

  it('cae al valor por defecto si no hay variable', () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    expect(resolveApiBaseUrl()).toBe('http://localhost:3001/api');
  });
});

describe('getProducts', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://api.test/api';
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('llama al endpoint /products y devuelve el JSON parseado', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => SAMPLE,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await getProducts();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/products?limit=100',
      expect.objectContaining({ cache: 'no-store' }),
    );
    expect(result.meta.total).toBe(1);
    expect(result.data[0].sku).toBe('FR-1');
  });

  it('lanza un error cuando la respuesta no es ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );
    await expect(getProducts()).rejects.toThrow(/HTTP 500/);
  });
});
