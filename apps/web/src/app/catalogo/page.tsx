import { ProductGrid } from '@/components/ProductGrid';
import { getProducts } from '@/lib/api';

// El catálogo se renderiza en cada petición (datos siempre frescos desde la API).
export const dynamic = 'force-dynamic';

export default async function CatalogoPage() {
  try {
    const { data, meta } = await getProducts();
    return (
      <main className="container">
        <h1 className="page-title">Catálogo</h1>
        <p className="muted">{meta.total} productos disponibles</p>
        <ProductGrid products={data} />
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
