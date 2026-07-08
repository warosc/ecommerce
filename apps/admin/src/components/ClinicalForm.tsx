'use client';

import type { Prescription } from '@optimus/contracts';
import { useActionState } from 'react';
import { updateClinicalAction, type CreateProductState } from '@/app/actions';

const INITIAL: CreateProductState = { ok: false, message: '' };

function EyeRow({ prefix, label, rx }: { prefix: string; label: string; rx?: Prescription['od'] }) {
  return (
    <div className="rx-row">
      <span className="rx-eye">{label}</span>
      <input name={`${prefix}_sphere`} type="number" step="0.25" placeholder="Esf." defaultValue={rx?.sphere ?? ''} />
      <input name={`${prefix}_cylinder`} type="number" step="0.25" placeholder="Cil." defaultValue={rx?.cylinder ?? ''} />
      <input name={`${prefix}_axis`} type="number" min="0" max="180" placeholder="Eje" defaultValue={rx?.axis ?? ''} />
      <input name={`${prefix}_add`} type="number" step="0.25" placeholder="Add" defaultValue={rx?.add ?? ''} />
    </div>
  );
}

export function ClinicalForm({
  patientId,
  prescription,
  notes,
}: {
  patientId: string;
  prescription: Prescription | null;
  notes: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateClinicalAction.bind(null, patientId),
    INITIAL,
  );

  return (
    <form action={formAction} className="form">
      <div className="rx">
        <div className="rx-row rx-head">
          <span className="rx-eye" />
          <span>Esfera</span>
          <span>Cilindro</span>
          <span>Eje</span>
          <span>Adición</span>
        </div>
        <EyeRow prefix="od" label="OD" rx={prescription?.od} />
        <EyeRow prefix="os" label="OS" rx={prescription?.os} />
      </div>
      <label className="rx-pd">
        Distancia interpupilar (mm)
        <input name="pd" type="number" step="0.5" min="1" max="90" defaultValue={prescription?.pd ?? ''} />
      </label>
      <label>
        Notas clínicas
        <textarea name="notes" rows={3} defaultValue={notes ?? ''} />
      </label>

      <button className="btn btn--primary" type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar expediente'}
      </button>
      {state.message ? (
        <p className={state.ok ? 'alert alert--ok' : 'alert alert--err'}>{state.message}</p>
      ) : null}
    </form>
  );
}
