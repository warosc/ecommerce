import Link from 'next/link';
import { auth, signIn } from '@/auth';
import { AppointmentForm } from '@/components/AppointmentForm';
import { AppointmentStatusControls } from '@/components/AppointmentStatusControls';
import { fetchAppointments, fetchPatients } from '@/lib/clinic';

export const dynamic = 'force-dynamic';

export default async function AgendaPage() {
  const session = await auth();
  if (!session) {
    return (
      <main className="shell">
        <div className="card login">
          <h1>Optimus Agenda</h1>
          <p className="muted">Inicia sesión para gestionar la agenda.</p>
          <form
            action={async () => {
              'use server';
              await signIn('keycloak', { redirectTo: '/agenda' });
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

  const [appointments, patients] = await Promise.all([fetchAppointments(), fetchPatients()]);

  return (
    <main className="shell shell--wide">
      <header className="topbar">
        <span className="brand">Optimus Agenda</span>
        <nav className="adminnav">
          <Link href="/">Catálogo</Link>
          <Link href="/pacientes">Pacientes</Link>
          <Link href="/agenda">Agenda</Link>
        </nav>
      </header>

      <div className="cols2">
        <section className="card">
          <h2>Citas</h2>
          <ul className="prodlist">
            {appointments.map((a) => (
              <li key={a.id} className="prodlist__item">
                <div className="prodlist__head">
                  <div>
                    <strong>{new Date(a.scheduledAt).toLocaleString('es-GT')}</strong>
                    <span className="muted"> · {a.patientName}</span>
                    <div className="muted">{a.reason}</div>
                  </div>
                  <AppointmentStatusControls appointmentId={a.id} status={a.status} />
                </div>
              </li>
            ))}
          </ul>
          {appointments.length === 0 ? <p className="muted">No hay citas.</p> : null}
        </section>

        <section className="card">
          <h2>Nueva cita</h2>
          <AppointmentForm patients={patients} />
        </section>
      </div>
    </main>
  );
}
