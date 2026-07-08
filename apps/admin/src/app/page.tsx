import Link from 'next/link';
import { auth, signIn, signOut } from '@/auth';
import { CreateProductForm } from '@/components/CreateProductForm';

export default async function Home() {
  const session = await auth();

  if (!session) {
    return (
      <main className="shell">
        <div className="card login">
          <h1>Optimus Admin</h1>
          <p className="muted">Panel de administración de la Óptica Optimus.</p>
          <form
            action={async () => {
              'use server';
              await signIn('keycloak', { redirectTo: '/' });
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

  return (
    <main className="shell">
      <header className="topbar">
        <span className="brand">Optimus Admin</span>
        <div className="topbar__right">
          <nav className="adminnav">
            <Link href="/">Crear producto</Link>
            <Link href="/productos">Productos</Link>
            <Link href="/pos">Punto de venta</Link>
            <Link href="/pacientes">Pacientes</Link>
            <Link href="/agenda">Agenda</Link>
            <Link href="/clientes">Clientes</Link>
          </nav>
          <span className="muted">{session.user?.name ?? session.user?.email}</span>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <button className="btn" type="submit">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <section className="card">
        <h2>Crear producto</h2>
        <p className="muted">
          Requiere rol <code>admin</code>. Si no lo tienes, la API responderá 403.
          Para dar montura de probador a productos existentes, ve a{' '}
          <Link href="/productos">Productos</Link>.
        </p>
        <CreateProductForm />
      </section>
    </main>
  );
}
