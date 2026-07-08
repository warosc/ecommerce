import { randomUUID } from 'node:crypto';
import { InvalidAppointmentError } from '../errors';

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface AppointmentProps {
  id: string;
  patientId: string;
  scheduledAt: Date;
  reason: string;
  status: AppointmentStatus;
  createdAt: Date;
}

export interface NewAppointmentInput {
  patientId: string;
  scheduledAt: Date;
  reason: string;
}

/** Cita de la agenda. */
export class Appointment {
  private constructor(private readonly props: AppointmentProps) {}

  static create(input: NewAppointmentInput): Appointment {
    if (!input.patientId) {
      throw new InvalidAppointmentError('La cita requiere un paciente.');
    }
    if (!(input.scheduledAt instanceof Date) || Number.isNaN(input.scheduledAt.getTime())) {
      throw new InvalidAppointmentError('Fecha/hora de la cita inválida.');
    }
    const reason = (input.reason ?? '').trim();
    if (reason.length < 2) {
      throw new InvalidAppointmentError('El motivo de la cita es obligatorio.');
    }
    return new Appointment({
      id: randomUUID(),
      patientId: input.patientId,
      scheduledAt: input.scheduledAt,
      reason,
      status: 'SCHEDULED',
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: AppointmentProps): Appointment {
    return new Appointment(props);
  }

  /** Devuelve una copia con el nuevo estado (inmutable). */
  withStatus(status: AppointmentStatus): Appointment {
    return new Appointment({ ...this.props, status });
  }

  get id(): string {
    return this.props.id;
  }
  get patientId(): string {
    return this.props.patientId;
  }
  get scheduledAt(): Date {
    return this.props.scheduledAt;
  }
  get reason(): string {
    return this.props.reason;
  }
  get status(): AppointmentStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
