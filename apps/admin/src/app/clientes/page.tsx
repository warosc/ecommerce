import type { CustomerSegment } from '@optimus/contracts';
import Link from 'next/link';
import { auth, signIn } from '@/auth';
import { fetchCustomers } from '@/lib/crm';

export const dynamic = 'force-dynamic';

const money = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });

const SEGMENT_LABEL: Record<CustomerSegment, string> = {
  NUEVO: 'Nuevo',
  RECURRENTE: 'Recurrente',
  VIP: 'VIP',
  INACTIVO: 'Inactivo',
};

export default async function ClientesPage() {
  const session = await auth();
  if (!session) {
    return (
      <main className="shell">
        <div className="card login">
          <h1>Optimus CRM</h1>
          <p className="muted">Inicia sesión para ver los clientes.</p>
          <form
            action={async () => {
              'use server';
              await signIn('keycloak', { redirectTo: '/clientes' });
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

  const customers = await fetchCustomers();

  return (
    <main className="shell shell--wide">
      <header className="topbar">
        <span className="brand">Optimus CRM</span>
        <nav className="adminnav">
          <Link href="/">Catálogo</Link>
          <Link href="/pacientes">Pacientes</Link>
          <Link href="/clientes">Clientes</Link>
        </nav>
      </header>

      <section className="card">
        <h2>Clientes</h2>
        <p className="muted">
          Perfiles construidos automáticamente a partir de los pedidos (web y POS).
        </p>
        <table className="crm-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Pedidos</th>
              <th>Gasto total</th>
              <th>Última compra</th>
              <th>Segmentos</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.email}>
                <td>
                  <strong>{c.name}</strong>
                  <div className="muted">{c.email}</div>
                </td>
                <td>{c.totalOrders}</td>
                <td>{money.format(c.totalSpentAmount / 100)}</td>
                <td>{new Date(c.lastOrderAt).toLocaleDateString('es-GT')}</td>
                <td>
                  {c.segments.map((s) => (
                    <span key={s} className={`tag seg-${s.toLowerCase()}`}>
                      {SEGMENT_LABEL[s]}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 ? (
          <p className="muted">Aún no hay clientes. Se crearán al confirmarse pedidos.</p>
        ) : null}
      </section>
    </main>
  );
}
