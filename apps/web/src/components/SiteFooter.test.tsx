import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteFooter } from './SiteFooter';

describe('SiteFooter', () => {
  it('muestra enlaces de ayuda y contacto', () => {
    render(<SiteFooter />);
    expect(screen.getByText('Rastrea tu pedido').closest('a')).toHaveAttribute(
      'href',
      '/rastreo',
    );
    expect(screen.getByText('Garantía').closest('a')).toHaveAttribute('href', '/garantia');
    expect(screen.getByText('hola@optimus.gt')).toBeInTheDocument();
  });
});
