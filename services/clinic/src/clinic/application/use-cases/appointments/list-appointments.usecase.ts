import { Inject, Injectable } from '@nestjs/common';
import {
  APPOINTMENT_REPOSITORY,
  AppointmentRepository,
} from '../../../domain/repositories/appointment.repository';
import {
  PATIENT_REPOSITORY,
  PatientRepository,
} from '../../../domain/repositories/patient.repository';
import { AppointmentView } from '../../appointment.view';

export interface ListAppointmentsResult {
  items: AppointmentView[];
  total: number;
}

@Injectable()
export class ListAppointmentsUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY) private readonly appointments: AppointmentRepository,
    @Inject(PATIENT_REPOSITORY) private readonly patients: PatientRepository,
  ) {}

  async execute(filter: {
    page?: number;
    limit?: number;
    patientId?: string;
  }): Promise<ListAppointmentsResult> {
    const { items, total } = await this.appointments.findMany({
      page: filter.page && filter.page > 0 ? filter.page : 1,
      limit: filter.limit && filter.limit > 0 ? Math.min(filter.limit, 100) : 50,
      patientId: filter.patientId,
    });

    const names = new Map<string, string>();
    const views: AppointmentView[] = [];
    for (const appointment of items) {
      let patientName = names.get(appointment.patientId);
      if (patientName === undefined) {
        const patient = await this.patients.findById(appointment.patientId);
        patientName = patient?.fullName ?? '—';
        names.set(appointment.patientId, patientName);
      }
      views.push({ appointment, patientName });
    }
    return { items: views, total };
  }
}
