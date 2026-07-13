'use client';

import { useEffect, useState } from 'react';
import { isFavorite, toggleFavorite } from '@/lib/wishlist';

/** Corazón que marca/desmarca un producto como favorito (localStorage). */
export function WishlistButton({ id, className }: { id: string; className?: string }) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(isFavorite(id));
    const sync = () => setFav(isFavorite(id));
    window.addEventListener('wishlist-change', sync);
    return () => window.removeEventListener('wishlist-change', sync);
  }, [id]);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setFav(toggleFavorite(id));
  }

  return (
    <button
      type="button"
      className={`wishbtn${fav ? ' wishbtn--on' : ''}${className ? ` ${className}` : ''}`}
      onClick={onClick}
      aria-pressed={fav}
      aria-label={fav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      title={fav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
    >
      {fav ? '♥' : '♡'}
    </button>
  );
}
