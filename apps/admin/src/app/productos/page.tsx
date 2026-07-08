import type { PaginatedResult, ProductDto } from '@optimus/contracts';
import Link from 'next/link';
import { auth, signIn } from '@/auth';
import { TryOnUploader } from '@/components/TryOnUploader';

export const dynamic = 'force-dynamic';

const CATALOG_API = process.env.CATALOG_API_INTERNAL ?? 'http://catalog-api:3001/api';

async function fetchProducts(): Promise<ProductDto[]> {
  const res = await fetch(`${CATALOG_API}/products?limit=100`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = (await res.json()) as PaginatedResult<ProductDto>;
  return body.data;
}

export default async function ProductosPage() {
  const session = await auth();
  if (!session) {
    return (
      <main className="shell">
        <div className="card login">
          <h1>Optimus Admin</h1>
          <p className="muted">Inicia sesión para gestionar los productos.</p>
          <form
            action={async () => {
              'use server';
              await signIn('keycloak', { redirectTo: '/productos' });
            }}
          >
            <button className="btn btn--primary" type="submit">
              Iniciar sesión con Keycloak
            </button>
          </form>
        </div>
      </main>
    );
  }

  let products: ProductDto[] = [];
  let loadError = '';
  try {
    products = await fetchProducts();
  } catch (err) {
    loadError = (err as Error).message;
  }

  return (
    <main className="shell shell--wide">
      <header className="topbar">
        <span className="brand">Optimus Admin</span>
        <nav className="adminnav">
          <Link href="/">Crear producto</Link>
          <Link href="/productos">Productos</Link>
        </nav>
      </header>

      <section className="card">
        <h2>Productos — montura del probador</h2>
        <p className="muted">
          Sube una <strong>foto normal</strong> de la montura; el fondo se quita
          automáticamente en tu navegador y se guarda como imagen del probador
          virtual. En cuanto un producto tiene montura, aparece en el probador.
        </p>
        {loadError ? (
          <p className="alert alert--err">No se pudieron cargar los productos: {loadError}</p>
        ) : null}

        <ul className="prodlist">
          {products.map((p) => (
            <li key={p.id} className="prodlist__item">
              <div className="prodlist__head">
                <div>
                  <strong>{p.name}</strong>
                  <span className="muted"> · {p.sku} · {p.type}</span>
                </div>
                <span className={`tag ${p.tryOnImageUrl ? 'tag--ok' : 'tag--muted'}`}>
                  {p.tryOnImageUrl ? 'Con montura' : 'Sin montura'}
                </span>
              </div>
              <TryOnUploader productId={p.id} sku={p.sku} currentTryOn={p.tryOnImageUrl} />
            </li>
          ))}
        </ul>
        {products.length === 0 && !loadError ? (
          <p className="muted">No hay productos todavía.</p>
        ) : null}
      </section>
    </main>
  );
}
