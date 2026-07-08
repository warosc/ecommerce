import type { AppointmentDto, PatientDto, PatientSummaryDto } from '@optimus/contracts';
import { Patient } from '../../../domain/entities/patient.entity';
import { AppointmentView } from '../../../application/appointment.view';

export function toPatientDto(patient: Patient): PatientDto {
  return {
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    phone: patient.phone,
    email: patient.email,
    birthDate: patient.birthDate ? patient.birthDate.toISOString() : null,
    prescription: patient.prescription,
    notes: patient.notes,
    createdAt: patient.createdAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString(),
  };
}

export function toPatientSummaryDto(patient: Patient): PatientSummaryDto {
  return {
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    phone: patient.phone,
    createdAt: patient.createdAt.toISOString(),
  };
}

export function toAppointmentDto(view: AppointmentView): AppointmentDto {
  const a = view.appointment;
  return {
    id: a.id,
    patientId: a.patientId,
    patientName: view.patientName,
    scheduledAt: a.scheduledAt.toISOString(),
    reason: a.reason,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
  };
}
