import { Inject, Injectable } from '@nestjs/common';
import { Patient } from '../../../domain/entities/patient.entity';
import { PatientNotFoundError } from '../../../domain/errors';
import {
  PATIENT_REPOSITORY,
  PatientRepository,
} from '../../../domain/repositories/patient.repository';
import { AUDIT_LOG, AuditLog } from '../../ports/audit-log';

/** Lee el expediente completo (con datos clínicos). Registra el acceso en auditoría. */
@Injectable()
export class GetPatientUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY) private readonly repo: PatientRepository,
    @Inject(AUDIT_LOG) private readonly audit: AuditLog,
  ) {}

  async execute(id: string, actor: string): Promise<Patient> {
    const patient = await this.repo.findById(id);
    if (!patient) {
      throw new PatientNotFoundError(id);
    }
    await this.audit.record({
      actor,
      action: 'PATIENT_VIEWED',
      entityType: 'PATIENT',
      entityId: id,
    });
    return patient;
  }
}
