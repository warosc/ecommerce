'use client';

import type { AppointmentStatus } from '@optimus/contracts';
import { useState, useTransition } from 'react';
import { updateAppointmentStatusAction } from '@/app/actions';

const LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Programada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

export function AppointmentStatusControls({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: AppointmentStatus;
}) {
  const [current, setCurrent] = useState<AppointmentStatus>(status);
  const [pending, start] = useTransition();

  function change(next: AppointmentStatus) {
    start(async () => {
      const res = await updateAppointmentStatusAction(appointmentId, next);
      if (res.ok) setCurrent(next);
    });
  }

  return (
    <span className="apptstatus">
      <span className={`tag tag--${current.toLowerCase()}`}>{LABELS[current]}</span>
      {current === 'SCHEDULED' ? (
        <>
          <button className="btn btn--sm" type="button" disabled={pending} onClick={() => change('COMPLETED')}>
            Completar
          </button>
          <button className="btn btn--sm" type="button" disabled={pending} onClick={() => change('CANCELLED')}>
            Cancelar
          </button>
        </>
      ) : null}
    </span>
  );
}
