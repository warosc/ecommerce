import type { PaginatedResult, ProductDto } from '@optimus/contracts';
import Link from 'next/link';
import { auth, signIn } from '@/auth';
import { PosTerminal } from '@/components/PosTerminal';

export const dynamic = 'force-dynamic';

const CATALOG_API = process.env.CATALOG_API_INTERNAL ?? 'http://catalog-api:3001/api';

async function fetchProducts(): Promise<ProductDto[]> {
  const res = await fetch(`${CATALOG_API}/products?limit=100`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = (await res.json()) as PaginatedResult<ProductDto>;
  return body.data;
}

export default async function PosPage() {
  const session = await auth();
  if (!session) {
    return (
      <main className="shell">
        <div className="card login">
          <h1>Optimus POS</h1>
          <p className="muted">Inicia sesión para vender en tienda.</p>
          <form
            action={async () => {
              'use server';
              await signIn('keycloak', { redirectTo: '/pos' });
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
        <span className="brand">Optimus POS</span>
        <nav className="adminnav">
          <Link href="/">Crear producto</Link>
          <Link href="/productos">Productos</Link>
          <Link href="/pos">Punto de venta</Link>
        </nav>
      </header>

      {loadError ? (
        <p className="alert alert--err">No se pudieron cargar los productos: {loadError}</p>
      ) : (
        <PosTerminal products={products} />
      )}
    </main>
  );
}
