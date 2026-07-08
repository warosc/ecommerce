'use client';

import type { PatientSummaryDto } from '@optimus/contracts';
import { useActionState } from 'react';
import { createAppointmentAction, type CreateProductState } from '@/app/actions';

const INITIAL: CreateProductState = { ok: false, message: '' };

export function AppointmentForm({ patients }: { patients: PatientSummaryDto[] }) {
  const [state, formAction, pending] = useActionState(createAppointmentAction, INITIAL);

  return (
    <form action={formAction} className="form">
      <label>
        Paciente
        <select name="patientId" required defaultValue="">
          <option value="" disabled>
            Elige un paciente…
          </option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.firstName} {p.lastName}
            </option>
          ))}
        </select>
      </label>
      <label>
        Fecha y hora
        <input name="scheduledAt" type="datetime-local" required />
      </label>
      <label>
        Motivo
        <input name="reason" required placeholder="Revisión / examen de la vista" />
      </label>

      <button className="btn btn--primary" type="submit" disabled={pending || patients.length === 0}>
        {pending ? 'Agendando…' : 'Agendar cita'}
      </button>
      {patients.length === 0 ? (
        <p className="muted">Registra un paciente primero.</p>
      ) : null}
      {state.message ? (
        <p className={state.ok ? 'alert alert--ok' : 'alert alert--err'}>{state.message}</p>
      ) : null}
    </form>
  );
}
