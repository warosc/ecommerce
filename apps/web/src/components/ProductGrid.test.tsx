import type { ProductDto } from '@optimus/contracts';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductGrid } from './ProductGrid';

function makeProduct(id: string, name: string): ProductDto {
  return {
    id,
    sku: `SKU-${id}`,
    name,
    description: '',
    type: 'FRAME',
    brand: 'Optimus',
    price: { amount: 10000, currency: 'GTQ' },
    stock: 1,
    images: [],
    compareAtAmount: null,
      tryOnImageUrl: null,
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

describe('ProductGrid', () => {
  it('renderiza una tarjeta por producto', () => {
    render(
      <ProductGrid
        products={[makeProduct('1', 'Uno'), makeProduct('2', 'Dos')]}
      />,
    );
    expect(screen.getByText('Uno')).toBeInTheDocument();
    expect(screen.getByText('Dos')).toBeInTheDocument();
  });

  it('muestra un mensaje vacío cuando no hay productos', () => {
    render(<ProductGrid products={[]} />);
    expect(screen.getByText('No hay productos disponibles.')).toBeInTheDocument();
  });
});
