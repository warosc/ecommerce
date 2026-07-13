import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { WishlistButton } from './WishlistButton';
import { isFavorite } from '@/lib/wishlist';

describe('WishlistButton', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('refleja el estado inicial (no favorito) y alterna al hacer clic', () => {
    render(<WishlistButton id="p1" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(btn);
    expect(isFavorite('p1')).toBe(true);
    expect(btn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(btn);
    expect(isFavorite('p1')).toBe(false);
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('aplica la clase extra recibida', () => {
    render(<WishlistButton id="p1" className="wishbtn--card" />);
    expect(screen.getByRole('button').className).toContain('wishbtn--card');
  });

  it('carga como favorito si ya estaba guardado', () => {
    window.localStorage.setItem('optimus_wishlist', JSON.stringify(['p9']));
    render(<WishlistButton id="p9" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });
});
