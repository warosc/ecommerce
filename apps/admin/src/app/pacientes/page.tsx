import Link from 'next/link';
import { auth, signIn } from '@/auth';
import { PatientForm } from '@/components/PatientForm';
import { fetchPatients } from '@/lib/clinic';

export const dynamic = 'force-dynamic';

export default async function PacientesPage() {
  const session = await auth();
  if (!session) {
    return (
      <main className="shell">
        <div className="card login">
          <h1>Optimus Clínica</h1>
          <p className="muted">Inicia sesión para gestionar pacientes.</p>
          <form
            action={async () => {
              'use server';
              await signIn('keycloak', { redirectTo: '/pacientes' });
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

  const patients = await fetchPatients();

  return (
    <main className="shell shell--wide">
      <header className="topbar">
        <span className="brand">Optimus Clínica</span>
        <nav className="adminnav">
          <Link href="/">Catálogo</Link>
          <Link href="/pacientes">Pacientes</Link>
          <Link href="/agenda">Agenda</Link>
        </nav>
      </header>

      <div className="cols2">
        <section className="card">
          <h2>Pacientes</h2>
          <p className="muted">La graduación y las notas se guardan cifradas.</p>
          <ul className="prodlist">
            {patients.map((p) => (
              <li key={p.id} className="prodlist__item">
                <div className="prodlist__head">
                  <div>
                    <strong>
                      {p.firstName} {p.lastName}
                    </strong>
                    {p.phone ? <span className="muted"> · {p.phone}</span> : null}
                  </div>
                  <Link className="btn" href={`/pacientes/${p.id}`}>
                    Expediente
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          {patients.length === 0 ? <p className="muted">No hay pacientes todavía.</p> : null}
        </section>

        <section className="card">
          <h2>Nuevo paciente</h2>
          <PatientForm />
        </section>
      </div>
    </main>
  );
}
