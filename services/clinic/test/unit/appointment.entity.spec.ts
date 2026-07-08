import { Appointment } from '../../src/clinic/domain/entities/appointment.entity';
import { InvalidAppointmentError } from '../../src/clinic/domain/errors';

describe('Appointment.create', () => {
  const when = new Date('2026-08-01T15:00:00.000Z');

  it('crea una cita en estado SCHEDULED y expone sus getters', () => {
    const a = Appointment.create({ patientId: 'p1', scheduledAt: when, reason: 'Revisión' });
    expect(a.id).toMatch(/[0-9a-f-]{36}/);
    expect(a.status).toBe('SCHEDULED');
    expect(a.patientId).toBe('p1');
    expect(a.reason).toBe('Revisión');
    expect(a.scheduledAt).toBe(when);
    expect(a.createdAt).toBeInstanceOf(Date);
  });

  it('exige paciente, fecha válida y motivo', () => {
    expect(() =>
      Appointment.create({ patientId: '', scheduledAt: when, reason: 'x y' }),
    ).toThrow(InvalidAppointmentError);
    expect(() =>
      Appointment.create({ patientId: 'p1', scheduledAt: new Date('nope'), reason: 'x y' }),
    ).toThrow(InvalidAppointmentError);
    expect(() =>
      Appointment.create({ patientId: 'p1', scheduledAt: when, reason: 'a' }),
    ).toThrow(InvalidAppointmentError);
  });

  it('withStatus devuelve una copia con el nuevo estado', () => {
    const a = Appointment.create({ patientId: 'p1', scheduledAt: when, reason: 'Revisión' });
    const done = a.withStatus('COMPLETED');
    expect(done).not.toBe(a);
    expect(done.status).toBe('COMPLETED');
    expect(a.status).toBe('SCHEDULED');
  });
});
