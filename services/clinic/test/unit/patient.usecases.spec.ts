import { CreatePatientUseCase } from '../../src/clinic/application/use-cases/patients/create-patient.usecase';
import { GetPatientUseCase } from '../../src/clinic/application/use-cases/patients/get-patient.usecase';
import { ListPatientsUseCase } from '../../src/clinic/application/use-cases/patients/list-patients.usecase';
import { UpdateClinicalUseCase } from '../../src/clinic/application/use-cases/patients/update-clinical.usecase';
import { Patient } from '../../src/clinic/domain/entities/patient.entity';
import { PatientNotFoundError } from '../../src/clinic/domain/errors';
import { CollectingAudit, InMemoryPatientRepository } from '../support/in-memory.repositories';

describe('Casos de uso de Pacientes', () => {
  it('CreatePatient crea y registra auditoría', async () => {
    const repo = new InMemoryPatientRepository();
    const audit = new CollectingAudit();
    const patient = await new CreatePatientUseCase(repo, audit).execute(
      { firstName: 'Ana', lastName: 'García', prescription: { pd: 63 } },
      'admin',
    );
    expect(repo.patients).toHaveLength(1);
    expect(audit.entries[0]).toMatchObject({
      actor: 'admin',
      action: 'PATIENT_CREATED',
      entityType: 'PATIENT',
      entityId: patient.id,
    });
  });

  it('GetPatient devuelve el expediente y audita el acceso', async () => {
    const p = Patient.create({ firstName: 'Ana', lastName: 'G' });
    const repo = new InMemoryPatientRepository([p]);
    const audit = new CollectingAudit();
    const got = await new GetPatientUseCase(repo, audit).execute(p.id, 'dra.ruiz');
    expect(got.id).toBe(p.id);
    expect(audit.entries[0].action).toBe('PATIENT_VIEWED');
    expect(audit.entries[0].actor).toBe('dra.ruiz');
  });

  it('GetPatient lanza 404 si no existe', async () => {
    const useCase = new GetPatientUseCase(new InMemoryPatientRepository(), new CollectingAudit());
    await expect(useCase.execute('nope', 'admin')).rejects.toBeInstanceOf(PatientNotFoundError);
  });

  it('ListPatients normaliza filtros y busca', async () => {
    const repo = new InMemoryPatientRepository([
      Patient.create({ firstName: 'Ana', lastName: 'García' }),
      Patient.create({ firstName: 'Luis', lastName: 'Pérez' }),
    ]);
    const res = await new ListPatientsUseCase(repo).execute({ search: 'garcía' });
    expect(res.total).toBe(1);
    expect(res.items[0].lastName).toBe('García');
  });

  it('ListPatients respeta page/limit explícitos', async () => {
    const repo = new InMemoryPatientRepository([
      Patient.create({ firstName: 'A', lastName: 'A' }),
      Patient.create({ firstName: 'B', lastName: 'B' }),
      Patient.create({ firstName: 'C', lastName: 'C' }),
    ]);
    const res = await new ListPatientsUseCase(repo).execute({ page: 1, limit: 2 });
    expect(res.total).toBe(3);
    expect(res.items).toHaveLength(2);
  });

  it('UpdateClinical permite actualizar solo las notas', async () => {
    const p = Patient.create({ firstName: 'Ana', lastName: 'G', prescription: { pd: 60 } });
    const repo = new InMemoryPatientRepository([p]);
    const updated = await new UpdateClinicalUseCase(repo, new CollectingAudit()).execute(
      p.id,
      { notes: 'solo notas' },
      'admin',
    );
    expect(updated.notes).toBe('solo notas');
    expect(updated.prescription?.pd).toBe(60); // se conserva
  });

  it('UpdateClinical actualiza y audita', async () => {
    const p = Patient.create({ firstName: 'Ana', lastName: 'G' });
    const repo = new InMemoryPatientRepository([p]);
    const audit = new CollectingAudit();
    const updated = await new UpdateClinicalUseCase(repo, audit).execute(
      p.id,
      { prescription: { od: { sphere: -1.5 } }, notes: 'control' },
      'admin',
    );
    expect(updated.prescription?.od?.sphere).toBe(-1.5);
    expect(updated.notes).toBe('control');
    expect(audit.entries[0].action).toBe('CLINICAL_UPDATED');
  });

  it('UpdateClinical lanza 404 si el paciente no existe', async () => {
    const useCase = new UpdateClinicalUseCase(new InMemoryPatientRepository(), new CollectingAudit());
    await expect(useCase.execute('nope', { notes: 'x' }, 'admin')).rejects.toBeInstanceOf(
      PatientNotFoundError,
    );
  });
});
