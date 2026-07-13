const KEY = 'optimus_wishlist';

/** Favoritos guardados en el navegador (localStorage). Solo en cliente. */
export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

/** Añade/quita un id; devuelve el nuevo estado (true = favorito). */
export function toggleFavorite(id: string): boolean {
  const set = new Set(getFavorites());
  const now = !set.has(id);
  if (now) set.add(id);
  else set.delete(id);
  window.localStorage.setItem(KEY, JSON.stringify([...set]));
  window.dispatchEvent(new Event('wishlist-change'));
  return now;
}
