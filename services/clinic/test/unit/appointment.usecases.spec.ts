import { CreateAppointmentUseCase } from '../../src/clinic/application/use-cases/appointments/create-appointment.usecase';
import { ListAppointmentsUseCase } from '../../src/clinic/application/use-cases/appointments/list-appointments.usecase';
import { UpdateAppointmentStatusUseCase } from '../../src/clinic/application/use-cases/appointments/update-appointment-status.usecase';
import { Appointment } from '../../src/clinic/domain/entities/appointment.entity';
import { Patient } from '../../src/clinic/domain/entities/patient.entity';
import { AppointmentNotFoundError, PatientNotFoundError } from '../../src/clinic/domain/errors';
import {
  CollectingAudit,
  InMemoryAppointmentRepository,
  InMemoryPatientRepository,
} from '../support/in-memory.repositories';

const when = new Date('2026-08-01T15:00:00.000Z');

function setup() {
  const patient = Patient.create({ firstName: 'Ana', lastName: 'García' });
  const patients = new InMemoryPatientRepository([patient]);
  const appointments = new InMemoryAppointmentRepository();
  const audit = new CollectingAudit();
  return { patient, patients, appointments, audit };
}

describe('Casos de uso de Agenda', () => {
  it('CreateAppointment crea la cita, resuelve el nombre y audita', async () => {
    const { patient, patients, appointments, audit } = setup();
    const view = await new CreateAppointmentUseCase(appointments, patients, audit).execute(
      { patientId: patient.id, scheduledAt: when, reason: 'Revisión anual' },
      'recepcion',
    );
    expect(view.patientName).toBe('Ana García');
    expect(view.appointment.status).toBe('SCHEDULED');
    expect(audit.entries[0].action).toBe('APPOINTMENT_CREATED');
  });

  it('CreateAppointment lanza 404 si el paciente no existe', async () => {
    const { appointments, patients, audit } = setup();
    const useCase = new CreateAppointmentUseCase(appointments, patients, audit);
    await expect(
      useCase.execute({ patientId: 'nope', scheduledAt: when, reason: 'x y' }, 'admin'),
    ).rejects.toBeInstanceOf(PatientNotFoundError);
  });

  it('ListAppointments resuelve el nombre del paciente', async () => {
    const { patient, patients, appointments, audit } = setup();
    await new CreateAppointmentUseCase(appointments, patients, audit).execute(
      { patientId: patient.id, scheduledAt: when, reason: 'Revisión' },
      'admin',
    );
    const res = await new ListAppointmentsUseCase(appointments, patients).execute({});
    expect(res.total).toBe(1);
    expect(res.items[0].patientName).toBe('Ana García');
  });

  it('ListAppointments cachea el nombre y usa "—" si falta el paciente', async () => {
    const { patient, patients, appointments } = setup();
    // Dos citas del mismo paciente (segunda usa la caché de nombre)…
    await appointments.create(
      Appointment.create({ patientId: patient.id, scheduledAt: when, reason: 'Uno' }),
    );
    await appointments.create(
      Appointment.create({ patientId: patient.id, scheduledAt: when, reason: 'Dos' }),
    );
    // …y una cita cuyo paciente ya no existe.
    await appointments.create(
      Appointment.create({ patientId: 'fantasma', scheduledAt: when, reason: 'Tres' }),
    );
    const res = await new ListAppointmentsUseCase(appointments, patients).execute({
      page: 1,
      limit: 10,
    });
    const names = res.items.map((v) => v.patientName);
    expect(names.filter((n) => n === 'Ana García')).toHaveLength(2);
    expect(names).toContain('—');
  });

  it('UpdateAppointmentStatus usa "—" si el paciente ya no existe', async () => {
    const { appointments, patients, audit } = setup();
    const appt = await appointments.create(
      Appointment.create({ patientId: 'fantasma', scheduledAt: when, reason: 'Revisión' }),
    );
    const view = await new UpdateAppointmentStatusUseCase(appointments, patients, audit).execute(
      appt.id,
      'CANCELLED',
      'admin',
    );
    expect(view.patientName).toBe('—');
    expect(view.appointment.status).toBe('CANCELLED');
  });

  it('UpdateAppointmentStatus cambia el estado y audita', async () => {
    const { patient, patients, appointments, audit } = setup();
    const created = await new CreateAppointmentUseCase(appointments, patients, audit).execute(
      { patientId: patient.id, scheduledAt: when, reason: 'Revisión' },
      'admin',
    );
    const updated = await new UpdateAppointmentStatusUseCase(appointments, patients, audit).execute(
      created.appointment.id,
      'COMPLETED',
      'admin',
    );
    expect(updated.appointment.status).toBe('COMPLETED');
    expect(audit.entries.at(-1)?.action).toBe('APPOINTMENT_COMPLETED');
  });

  it('UpdateAppointmentStatus lanza 404 si la cita no existe', async () => {
    const { appointments, patients, audit } = setup();
    const useCase = new UpdateAppointmentStatusUseCase(appointments, patients, audit);
    await expect(useCase.execute('nope', 'CANCELLED', 'admin')).rejects.toBeInstanceOf(
      AppointmentNotFoundError,
    );
  });
});
