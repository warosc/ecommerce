import type {
  AppointmentDto,
  PaginatedResult,
  PatientDto,
  PatientSummaryDto,
} from '@optimus/contracts';
import { auth } from '@/auth';

export const CLINIC_API =
  process.env.CLINIC_API_INTERNAL ?? 'http://clinic-api:3007/api';

async function bearer(): Promise<string | null> {
  const session = await auth();
  return session?.accessToken ?? null;
}

/** Lista de pacientes (contacto). Requiere sesión. */
export async function fetchPatients(search?: string): Promise<PatientSummaryDto[]> {
  const token = await bearer();
  if (!token) return [];
  const qs = new URLSearchParams({ limit: '100' });
  if (search) qs.set('search', search);
  const res = await fetch(`${CLINIC_API}/patients?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const body = (await res.json()) as PaginatedResult<PatientSummaryDto>;
  return body.data;
}

/** Expediente completo de un paciente (graduación + notas). Requiere rol admin. */
export async function fetchPatient(id: string): Promise<PatientDto | null> {
  const token = await bearer();
  if (!token) return null;
  const res = await fetch(`${CLINIC_API}/patients/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()) as PatientDto;
}

/** Agenda de citas. Requiere sesión. */
export async function fetchAppointments(): Promise<AppointmentDto[]> {
  const token = await bearer();
  if (!token) return [];
  const res = await fetch(`${CLINIC_API}/appointments?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const body = (await res.json()) as PaginatedResult<AppointmentDto>;
  return body.data;
}
