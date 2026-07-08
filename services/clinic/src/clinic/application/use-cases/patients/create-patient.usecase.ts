import { Inject, Injectable } from '@nestjs/common';
import { NewPatientInput, Patient } from '../../../domain/entities/patient.entity';
import {
  PATIENT_REPOSITORY,
  PatientRepository,
} from '../../../domain/repositories/patient.repository';
import { AUDIT_LOG, AuditLog } from '../../ports/audit-log';

@Injectable()
export class CreatePatientUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY) private readonly repo: PatientRepository,
    @Inject(AUDIT_LOG) private readonly audit: AuditLog,
  ) {}

  async execute(input: NewPatientInput, actor: string): Promise<Patient> {
    const patient = Patient.create(input);
    const saved = await this.repo.create(patient);
    await this.audit.record({
      actor,
      action: 'PATIENT_CREATED',
      entityType: 'PATIENT',
      entityId: saved.id,
    });
    return saved;
  }
}
