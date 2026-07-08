import { ProductGrid } from '@/components/ProductGrid';
import { getProducts, searchProducts } from '@/lib/api';

// El catálogo se renderiza en cada petición (datos siempre frescos desde la API).
export const dynamic = 'force-dynamic';

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  try {
    const { data, meta } = query ? await searchProducts(query) : await getProducts();
    return (
      <main className="container">
        <h1 className="page-title">Catálogo</h1>
        <form className="search" action="/catalogo" method="get">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar monturas, lentes, marcas…"
            aria-label="Buscar productos"
          />
          <button className="cta" type="submit">
            Buscar
          </button>
        </form>
        <p className="muted">
          {query
            ? `${meta.total} resultado(s) para "${query}"`
            : `${meta.total} productos disponibles`}
        </p>
        {data.length === 0 ? (
          <p className="empty">No se encontraron productos.</p>
        ) : (
          <ProductGrid products={data} />
        )}
      </main>
    );
  } catch {
    return (
      <main className="container">
        <h1 className="page-title">Catálogo</h1>
        <p className="error">
          No se pudo cargar el catálogo en este momento. Intenta de nuevo más tarde.
        </p>
      </main>
    );
  }
}
