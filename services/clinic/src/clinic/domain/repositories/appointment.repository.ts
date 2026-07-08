import { Appointment } from '../entities/appointment.entity';

export const APPOINTMENT_REPOSITORY = Symbol('APPOINTMENT_REPOSITORY');

export interface ListAppointmentsFilter {
  page: number;
  limit: number;
  patientId?: string;
}

export interface FindAppointmentsResult {
  items: Appointment[];
  total: number;
}

/** Puerto de persistencia de la agenda. */
export interface AppointmentRepository {
  create(appointment: Appointment): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  findMany(filter: ListAppointmentsFilter): Promise<FindAppointmentsResult>;
  update(appointment: Appointment): Promise<Appointment>;
}
