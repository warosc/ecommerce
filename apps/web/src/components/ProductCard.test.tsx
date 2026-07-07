import type { ProductDto } from '@optimus/contracts';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductCard } from './ProductCard';

function makeProduct(overrides: Partial<ProductDto> = {}): ProductDto {
  return {
    id: 'p1',
    sku: 'FR-1',
    name: 'Montura Classic',
    description: 'Una montura',
    type: 'FRAME',
    brand: 'Optimus',
    price: { amount: 45000, currency: 'GTQ' },
    stock: 5,
    images: ['https://example.com/a.jpg'],
    active: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('ProductCard', () => {
  it('muestra nombre, marca, etiqueta de tipo y precio formateado', () => {
    render(<ProductCard product={makeProduct()} />);

    expect(screen.getByText('Montura Classic')).toBeInTheDocument();
    expect(screen.getByText('Optimus')).toBeInTheDocument();
    expect(screen.getByText('Montura')).toBeInTheDocument();
    // El precio (45000 centavos → 450.00) debe aparecer formateado.
    expect(screen.getByText(/450[.,]00/)).toBeInTheDocument();
  });

  it('muestra la imagen del producto con su alt', () => {
    render(<ProductCard product={makeProduct()} />);
    const img = screen.getByAltText('Montura Classic') as HTMLImageElement;
    expect(img.src).toContain('a.jpg');
  });

  it('muestra el stock cuando hay existencias', () => {
    render(<ProductCard product={makeProduct({ stock: 3 })} />);
    expect(screen.getByText('Stock: 3')).toBeInTheDocument();
  });

  it('muestra "Agotado" y un placeholder cuando no hay stock ni imagen', () => {
    const { container } = render(
      <ProductCard product={makeProduct({ stock: 0, images: [] })} />,
    );
    expect(screen.getByText('Agotado')).toBeInTheDocument();
    expect(container.querySelector('.card__img--placeholder')).not.toBeNull();
  });
});
