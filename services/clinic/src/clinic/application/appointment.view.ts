import { Appointment } from '../domain/entities/appointment.entity';

/** Cita enriquecida con el nombre del paciente (para la respuesta de la API). */
export interface AppointmentView {
  appointment: Appointment;
  patientName: string;
}
