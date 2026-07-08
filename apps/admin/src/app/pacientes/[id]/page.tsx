import Link from 'next/link';
import { auth } from '@/auth';
import { ClinicalForm } from '@/components/ClinicalForm';
import { fetchPatient } from '@/lib/clinic';

export const dynamic = 'force-dynamic';

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) {
    return (
      <main className="shell">
        <p className="alert alert--err">Inicia sesión para ver el expediente.</p>
        <Link className="btn" href="/pacientes">
          Volver
        </Link>
      </main>
    );
  }

  const patient = await fetchPatient(id);

  return (
    <main className="shell shell--wide">
      <header className="topbar">
        <span className="brand">Optimus Clínica</span>
        <nav className="adminnav">
          <Link href="/pacientes">Pacientes</Link>
          <Link href="/agenda">Agenda</Link>
        </nav>
      </header>

      {!patient ? (
        <p className="alert alert--err">
          No se pudo cargar el expediente (¿sin rol clínico? el expediente completo requiere
          rol <code>admin</code>).
        </p>
      ) : (
        <div className="cols2">
          <section className="card">
            <h2>
              {patient.firstName} {patient.lastName}
            </h2>
            <p className="muted">
              {patient.phone ?? 'sin teléfono'} · {patient.email ?? 'sin email'}
              {patient.birthDate
                ? ` · nac. ${new Date(patient.birthDate).toLocaleDateString('es-GT')}`
                : ''}
            </p>
            <p className="muted">
              Datos clínicos cifrados en reposo; este acceso queda auditado.
            </p>
          </section>

          <section className="card">
            <h2>Graduación y notas</h2>
            <ClinicalForm
              patientId={patient.id}
              prescription={patient.prescription}
              notes={patient.notes}
            />
          </section>
        </div>
      )}
    </main>
  );
}
