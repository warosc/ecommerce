'use client';

import { useActionState } from 'react';
import { createPatientAction, type CreateProductState } from '@/app/actions';

const INITIAL: CreateProductState = { ok: false, message: '' };

export function PatientForm() {
  const [state, formAction, pending] = useActionState(createPatientAction, INITIAL);

  return (
    <form action={formAction} className="form">
      <div className="grid2">
        <label>
          Nombre
          <input name="firstName" required placeholder="Ana" />
        </label>
        <label>
          Apellido
          <input name="lastName" required placeholder="García" />
        </label>
      </div>
      <div className="grid2">
        <label>
          Teléfono
          <input name="phone" placeholder="Opcional" />
        </label>
        <label>
          Email
          <input name="email" type="email" placeholder="Opcional" />
        </label>
      </div>
      <label>
        Fecha de nacimiento
        <input name="birthDate" type="date" />
      </label>

      <button className="btn btn--primary" type="submit" disabled={pending}>
        {pending ? 'Creando…' : 'Registrar paciente'}
      </button>
      {state.message ? (
        <p className={state.ok ? 'alert alert--ok' : 'alert alert--err'}>{state.message}</p>
      ) : null}
    </form>
  );
}
