import { Inject, Injectable } from '@nestjs/common';
import { AppointmentStatus } from '../../../domain/entities/appointment.entity';
import { AppointmentNotFoundError } from '../../../domain/errors';
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

@Injectable()
export class UpdateAppointmentStatusUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY) private readonly appointments: AppointmentRepository,
    @Inject(PATIENT_REPOSITORY) private readonly patients: PatientRepository,
    @Inject(AUDIT_LOG) private readonly audit: AuditLog,
  ) {}

  async execute(id: string, status: AppointmentStatus, actor: string): Promise<AppointmentView> {
    const appointment = await this.appointments.findById(id);
    if (!appointment) {
      throw new AppointmentNotFoundError(id);
    }
    const saved = await this.appointments.update(appointment.withStatus(status));
    const patient = await this.patients.findById(saved.patientId);
    await this.audit.record({
      actor,
      action: `APPOINTMENT_${status}`,
      entityType: 'APPOINTMENT',
      entityId: id,
    });
    return { appointment: saved, patientName: patient?.fullName ?? '—' };
  }
}
