import { Patient } from '../../src/clinic/domain/entities/patient.entity';
import { InvalidPatientError } from '../../src/clinic/domain/errors';
import { validatePrescription } from '../../src/clinic/domain/value-objects/prescription.vo';

describe('Patient.create', () => {
  it('crea un paciente con datos mínimos', () => {
    const p = Patient.create({ firstName: 'Ana', lastName: 'García' });
    expect(p.id).toMatch(/[0-9a-f-]{36}/);
    expect(p.fullName).toBe('Ana García');
    expect(p.prescription).toBeNull();
    expect(p.notes).toBeNull();
  });

  it('exige nombre y apellido', () => {
    expect(() => Patient.create({ firstName: '', lastName: 'X' })).toThrow(InvalidPatientError);
    expect(() => Patient.create({ firstName: 'X', lastName: '  ' })).toThrow(InvalidPatientError);
  });

  it('valida el email si se indica', () => {
    expect(() =>
      Patient.create({ firstName: 'Ana', lastName: 'G', email: 'no-email' }),
    ).toThrow(InvalidPatientError);
  });

  it('valida la graduación al crear', () => {
    expect(() =>
      Patient.create({ firstName: 'Ana', lastName: 'G', prescription: { od: { axis: 200 } } }),
    ).toThrow(InvalidPatientError);
  });

  it('conserva todos los campos y expone sus getters', () => {
    const birth = new Date('1990-05-20T00:00:00.000Z');
    const p = Patient.create({
      firstName: 'Ana',
      lastName: 'García',
      phone: '5555-1234',
      email: 'ana@mail.com',
      birthDate: birth,
      prescription: { od: { sphere: -1 }, pd: 62 },
      notes: 'nota',
    });
    expect(p.firstName).toBe('Ana');
    expect(p.lastName).toBe('García');
    expect(p.phone).toBe('5555-1234');
    expect(p.email).toBe('ana@mail.com');
    expect(p.birthDate).toBe(birth);
    expect(p.prescription?.pd).toBe(62);
    expect(p.notes).toBe('nota');
    expect(p.createdAt).toBeInstanceOf(Date);
    expect(p.updatedAt).toBeInstanceOf(Date);
  });

  it('normaliza campos opcionales vacíos a null', () => {
    const p = Patient.create({ firstName: 'Ana', lastName: 'G', phone: '   ', notes: '  ' });
    expect(p.phone).toBeNull();
    expect(p.email).toBeNull();
    expect(p.birthDate).toBeNull();
    expect(p.notes).toBeNull();
  });

  it('updateClinical devuelve una copia con nueva graduación/notas', () => {
    const p = Patient.create({ firstName: 'Ana', lastName: 'G' });
    const updated = p.updateClinical({ od: { sphere: -1 }, pd: 62 }, 'Miope leve');
    expect(updated).not.toBe(p);
    expect(updated.prescription?.od?.sphere).toBe(-1);
    expect(updated.notes).toBe('Miope leve');
    expect(p.prescription).toBeNull(); // original intacto
  });

  it('updateClinical conserva lo anterior si se pasa null', () => {
    const p = Patient.create({
      firstName: 'Ana',
      lastName: 'G',
      prescription: { pd: 60 },
      notes: 'previa',
    });
    const updated = p.updateClinical(null, null);
    expect(updated.prescription?.pd).toBe(60);
    expect(updated.notes).toBe('previa');
  });
});

describe('validatePrescription', () => {
  it('acepta una graduación válida', () => {
    expect(() =>
      validatePrescription({ od: { sphere: -2, cylinder: -0.75, axis: 10 }, pd: 63 }),
    ).not.toThrow();
  });

  it('rechaza eje fuera de rango', () => {
    expect(() => validatePrescription({ os: { axis: -5 } })).toThrow(InvalidPatientError);
  });

  it('rechaza DIP inválida', () => {
    expect(() => validatePrescription({ pd: 0 })).toThrow(InvalidPatientError);
    expect(() => validatePrescription({ pd: 200 })).toThrow(InvalidPatientError);
  });

  it('rechaza valores no numéricos', () => {
    expect(() => validatePrescription({ od: { sphere: NaN } })).toThrow(InvalidPatientError);
  });
});
