import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CreateAppointmentUseCase } from '../../src/clinic/application/use-cases/appointments/create-appointment.usecase';
import { ListAppointmentsUseCase } from '../../src/clinic/application/use-cases/appointments/list-appointments.usecase';
import { UpdateAppointmentStatusUseCase } from '../../src/clinic/application/use-cases/appointments/update-appointment-status.usecase';
import { CreatePatientUseCase } from '../../src/clinic/application/use-cases/patients/create-patient.usecase';
import { GetPatientUseCase } from '../../src/clinic/application/use-cases/patients/get-patient.usecase';
import { ListPatientsUseCase } from '../../src/clinic/application/use-cases/patients/list-patients.usecase';
import { UpdateClinicalUseCase } from '../../src/clinic/application/use-cases/patients/update-clinical.usecase';
import { AUDIT_LOG } from '../../src/clinic/application/ports/audit-log';
import { APPOINTMENT_REPOSITORY } from '../../src/clinic/domain/repositories/appointment.repository';
import { PATIENT_REPOSITORY } from '../../src/clinic/domain/repositories/patient.repository';
import { DomainExceptionFilter } from '../../src/clinic/interfaces/http/filters/domain-exception.filter';
import { AppointmentController } from '../../src/clinic/interfaces/http/appointment.controller';
import { PatientController } from '../../src/clinic/interfaces/http/patient.controller';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/auth/roles.guard';
import {
  CollectingAudit,
  InMemoryAppointmentRepository,
  InMemoryPatientRepository,
} from '../support/in-memory.repositories';

describe('Clinic (e2e)', () => {
  let app: INestApplication;
  let audit: CollectingAudit;

  beforeEach(async () => {
    audit = new CollectingAudit();
    const moduleRef = await Test.createTestingModule({
      controllers: [PatientController, AppointmentController],
      providers: [
        CreatePatientUseCase,
        GetPatientUseCase,
        ListPatientsUseCase,
        UpdateClinicalUseCase,
        CreateAppointmentUseCase,
        ListAppointmentsUseCase,
        UpdateAppointmentStatusUseCase,
        { provide: PATIENT_REPOSITORY, useValue: new InMemoryPatientRepository() },
        { provide: APPOINTMENT_REPOSITORY, useValue: new InMemoryAppointmentRepository() },
        { provide: AUDIT_LOG, useValue: audit },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  async function createPatient(): Promise<string> {
    const res = await request(server())
      .post('/api/patients')
      .send({
        firstName: 'Ana',
        lastName: 'García',
        phone: '5555-1234',
        prescription: { od: { sphere: -1.25, axis: 90 }, pd: 63 },
        notes: 'Miopía leve',
      })
      .expect(201);
    return res.body.id as string;
  }

  it('crea paciente con graduación (201) y la devuelve', async () => {
    const res = await request(server())
      .post('/api/patients')
      .send({ firstName: 'Ana', lastName: 'García', prescription: { pd: 63 } })
      .expect(201);
    expect(res.body.prescription.pd).toBe(63);
    expect(audit.entries.some((e) => e.action === 'PATIENT_CREATED')).toBe(true);
  });

  it('rechaza paciente sin nombre (400)', async () => {
    await request(server()).post('/api/patients').send({ lastName: 'X' }).expect(400);
  });

  it('rechaza eje de graduación inválido (400)', async () => {
    await request(server())
      .post('/api/patients')
      .send({ firstName: 'A', lastName: 'B', prescription: { od: { axis: 400 } } })
      .expect(400);
  });

  it('lista pacientes sin exponer datos clínicos', async () => {
    await createPatient();
    const res = await request(server()).get('/api/patients').expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].prescription).toBeUndefined();
    expect(res.body.data[0].notes).toBeUndefined();
  });

  it('obtiene el expediente completo y audita el acceso', async () => {
    const id = await createPatient();
    const res = await request(server()).get(`/api/patients/${id}`).expect(200);
    expect(res.body.prescription.od.sphere).toBe(-1.25);
    expect(res.body.notes).toBe('Miopía leve');
    expect(audit.entries.some((e) => e.action === 'PATIENT_VIEWED')).toBe(true);
  });

  it('devuelve 404 al obtener un paciente inexistente', async () => {
    const res = await request(server()).get('/api/patients/nope').expect(404);
    expect(res.body.error).toBe('PATIENT_NOT_FOUND');
  });

  it('actualiza graduación/notas (PUT clinical)', async () => {
    const id = await createPatient();
    const res = await request(server())
      .put(`/api/patients/${id}/clinical`)
      .send({ prescription: { os: { sphere: -2 } }, notes: 'control 6m' })
      .expect(200);
    expect(res.body.prescription.os.sphere).toBe(-2);
    expect(res.body.notes).toBe('control 6m');
  });

  it('agenda una cita (201) y la lista con el nombre del paciente', async () => {
    const id = await createPatient();
    const res = await request(server())
      .post('/api/appointments')
      .send({ patientId: id, scheduledAt: '2026-08-01T15:00:00.000Z', reason: 'Revisión' })
      .expect(201);
    expect(res.body.patientName).toBe('Ana García');
    expect(res.body.status).toBe('SCHEDULED');

    await request(server())
      .get('/api/appointments')
      .expect(200)
      .expect((r) => expect(r.body.data[0].patientName).toBe('Ana García'));
  });

  it('cita con paciente inexistente -> 404', async () => {
    await request(server())
      .post('/api/appointments')
      .send({ patientId: 'nope', scheduledAt: '2026-08-01T15:00:00.000Z', reason: 'Revisión' })
      .expect(404);
  });

  it('rechaza estado de cita inválido (400)', async () => {
    const id = await createPatient();
    const appt = await request(server())
      .post('/api/appointments')
      .send({ patientId: id, scheduledAt: '2026-08-01T15:00:00.000Z', reason: 'Revisión' })
      .expect(201);
    await request(server())
      .patch(`/api/appointments/${appt.body.id}/status`)
      .send({ status: 'INVALID' })
      .expect(400);
  });

  it('cambia el estado de una cita', async () => {
    const id = await createPatient();
    const appt = await request(server())
      .post('/api/appointments')
      .send({ patientId: id, scheduledAt: '2026-08-01T15:00:00.000Z', reason: 'Revisión' })
      .expect(201);
    await request(server())
      .patch(`/api/appointments/${appt.body.id}/status`)
      .send({ status: 'COMPLETED' })
      .expect(200)
      .expect((r) => expect(r.body.status).toBe('COMPLETED'));
  });
});
