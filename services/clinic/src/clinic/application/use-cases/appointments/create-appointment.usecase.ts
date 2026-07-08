import { Inject, Injectable } from '@nestjs/common';
import { Appointment } from '../../../domain/entities/appointment.entity';
import { PatientNotFoundError } from '../../../domain/errors';
import {
  APPOINTMENT_REPOSITORY,
  AppointmentRepository,
} from '../../../domain/repositories/appointment.repository';
import {
  PATIENT_REPOSITORY,
  PatientRepository,
} from '../../../domain/repositories/patient.repository';
import { AppointmentView } from '../../appointment.view';
import { AUDIT_LOG, AuditLog } from '../../ports/audit-log';

export interface CreateAppointmentCommand {
  patientId: string;
  scheduledAt: Date;
  reason: string;
}

@Injectable()
export class CreateAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY) private readonly appointments: AppointmentRepository,
    @Inject(PATIENT_REPOSITORY) private readonly patients: PatientRepository,
    @Inject(AUDIT_LOG) private readonly audit: AuditLog,
  ) {}

  async execute(command: CreateAppointmentCommand, actor: string): Promise<AppointmentView> {
    const patient = await this.patients.findById(command.patientId);
    if (!patient) {
      throw new PatientNotFoundError(command.patientId);
    }
    const appointment = Appointment.create(command);
    const saved = await this.appointments.create(appointment);
    await this.audit.record({
      actor,
      action: 'APPOINTMENT_CREATED',
      entityType: 'APPOINTMENT',
      entityId: saved.id,
    });
    return { appointment: saved, patientName: patient.fullName };
  }
}
