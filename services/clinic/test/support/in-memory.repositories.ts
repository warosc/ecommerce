import { Appointment } from '../../src/clinic/domain/entities/appointment.entity';
import { Patient } from '../../src/clinic/domain/entities/patient.entity';
import {
  AppointmentRepository,
  FindAppointmentsResult,
  ListAppointmentsFilter,
} from '../../src/clinic/domain/repositories/appointment.repository';
import {
  FindPatientsResult,
  ListPatientsFilter,
  PatientRepository,
} from '../../src/clinic/domain/repositories/patient.repository';
import { AuditEntry, AuditLog } from '../../src/clinic/application/ports/audit-log';

export class InMemoryPatientRepository implements PatientRepository {
  readonly patients: Patient[] = [];

  constructor(seed: Patient[] = []) {
    this.patients.push(...seed);
  }

  async create(patient: Patient): Promise<Patient> {
    this.patients.push(patient);
    return patient;
  }
  async findById(id: string): Promise<Patient | null> {
    return this.patients.find((p) => p.id === id) ?? null;
  }
  async findMany(filter: ListPatientsFilter): Promise<FindPatientsResult> {
    let items = this.patients;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) || p.lastName.toLowerCase().includes(q),
      );
    }
    const total = items.length;
    const start = (filter.page - 1) * filter.limit;
    return { items: items.slice(start, start + filter.limit), total };
  }
  async update(patient: Patient): Promise<Patient> {
    const i = this.patients.findIndex((p) => p.id === patient.id);
    if (i >= 0) this.patients[i] = patient;
    return patient;
  }
}

export class InMemoryAppointmentRepository implements AppointmentRepository {
  readonly appointments: Appointment[] = [];

  async create(a: Appointment): Promise<Appointment> {
    this.appointments.push(a);
    return a;
  }
  async findById(id: string): Promise<Appointment | null> {
    return this.appointments.find((a) => a.id === id) ?? null;
  }
  async findMany(filter: ListAppointmentsFilter): Promise<FindAppointmentsResult> {
    let items = this.appointments;
    if (filter.patientId) items = items.filter((a) => a.patientId === filter.patientId);
    const total = items.length;
    const start = (filter.page - 1) * filter.limit;
    return { items: items.slice(start, start + filter.limit), total };
  }
  async update(a: Appointment): Promise<Appointment> {
    const i = this.appointments.findIndex((x) => x.id === a.id);
    if (i >= 0) this.appointments[i] = a;
    return a;
  }
}

export class CollectingAudit implements AuditLog {
  readonly entries: AuditEntry[] = [];
  async record(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }
}
