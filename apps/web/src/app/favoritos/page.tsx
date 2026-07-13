'use client';

import type { ProductDto } from '@optimus/contracts';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { getProducts } from '@/lib/api';
import { getFavorites } from '@/lib/wishlist';

export default function FavoritosPage() {
  const [products, setProducts] = useState<ProductDto[] | null>(null);

  useEffect(() => {
    const load = async () => {
      const ids = new Set(getFavorites());
      if (ids.size === 0) {
        setProducts([]);
        return;
      }
      try {
        const { data } = await getProducts({ limit: 100 });
        setProducts(data.filter((p) => ids.has(p.id)));
      } catch {
        setProducts([]);
      }
    };
    void load();
    window.addEventListener('wishlist-change', load);
    return () => window.removeEventListener('wishlist-change', load);
  }, []);

  return (
    <main className="container">
      <h1 className="page-title">Tus favoritos ♥</h1>
      {products === null ? (
        <p className="muted">Cargando…</p>
      ) : products.length === 0 ? (
        <div className="empty">
          <p className="lede">Aún no has guardado ninguna montura.</p>
          <p className="muted">
            Toca el corazón en cualquier producto para guardarlo aquí.
          </p>
          <Link className="cta" href="/catalogo">
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
