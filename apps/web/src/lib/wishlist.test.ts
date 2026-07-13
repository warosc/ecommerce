import { beforeEach, describe, expect, it } from 'vitest';
import { getFavorites, isFavorite, toggleFavorite } from './wishlist';

describe('wishlist', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('parte de una lista vacía', () => {
    expect(getFavorites()).toEqual([]);
    expect(isFavorite('p1')).toBe(false);
  });

  it('añade y quita un favorito alternando', () => {
    expect(toggleFavorite('p1')).toBe(true);
    expect(isFavorite('p1')).toBe(true);
    expect(getFavorites()).toEqual(['p1']);

    expect(toggleFavorite('p1')).toBe(false);
    expect(isFavorite('p1')).toBe(false);
    expect(getFavorites()).toEqual([]);
  });

  it('mantiene varios favoritos', () => {
    toggleFavorite('a');
    toggleFavorite('b');
    expect(getFavorites().sort()).toEqual(['a', 'b']);
  });

  it('emite un evento wishlist-change al cambiar', () => {
    let fired = 0;
    const handler = () => {
      fired += 1;
    };
    window.addEventListener('wishlist-change', handler);
    toggleFavorite('p1');
    window.removeEventListener('wishlist-change', handler);
    expect(fired).toBe(1);
  });

  it('devuelve lista vacía si el almacenamiento está corrupto', () => {
    window.localStorage.setItem('optimus_wishlist', 'no-es-json');
    expect(getFavorites()).toEqual([]);
  });
});
