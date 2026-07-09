import type { ProductSort, ProductType } from '@optimus/contracts';
import { ProductGrid } from '@/components/ProductGrid';
import { getProducts, searchProducts } from '@/lib/api';

export const dynamic = 'force-dynamic';

const TYPES: { value: ProductType; label: string }[] = [
  { value: 'FRAME', label: 'Monturas' },
  { value: 'LENS', label: 'Lentes' },
  { value: 'ACCESSORY', label: 'Accesorios' },
];

const SORTS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
];

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: ProductType; brand?: string; sort?: ProductSort }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const type = sp.type;
  const brand = (sp.brand ?? '').trim();
  const sort = sp.sort;

  try {
    // Marcas disponibles (para el desplegable) a partir de todo el catálogo.
    const all = await getProducts({ limit: 100 });
    const brands = [...new Set(all.data.map((p) => p.brand))].sort();

    // Resultados: búsqueda de texto (OpenSearch) o navegación con filtros.
    const { data, meta } = q
      ? await searchProducts(q, type)
      : await getProducts({ type, brand: brand || undefined, sort });

    return (
      <main className="container">
        <h1 className="page-title">Catálogo</h1>

        <form className="filters" action="/catalogo" method="get">
          <input
            className="filters__search"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar monturas, lentes, marcas…"
            aria-label="Buscar"
          />
          <select name="type" defaultValue={type ?? ''} aria-label="Tipo">
            <option value="">Todos los tipos</option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select name="brand" defaultValue={brand} aria-label="Marca">
            <option value="">Todas las marcas</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select name="sort" defaultValue={sort ?? 'newest'} aria-label="Orden">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button className="cta" type="submit">
            Aplicar
          </button>
        </form>

        <p className="muted">
          {q ? `${meta.total} resultado(s) para "${q}"` : `${meta.total} producto(s)`}
        </p>
        {data.length === 0 ? (
          <p className="empty">No se encontraron productos con esos criterios.</p>
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
