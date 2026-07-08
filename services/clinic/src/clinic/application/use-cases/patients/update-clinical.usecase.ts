import { Inject, Injectable } from '@nestjs/common';
import { Patient } from '../../../domain/entities/patient.entity';
import { PatientNotFoundError } from '../../../domain/errors';
import { PrescriptionData } from '../../../domain/value-objects/prescription.vo';
import {
  PATIENT_REPOSITORY,
  PatientRepository,
} from '../../../domain/repositories/patient.repository';
import { AUDIT_LOG, AuditLog } from '../../ports/audit-log';

export interface UpdateClinicalCommand {
  prescription?: PrescriptionData;
  notes?: string;
}

/** Actualiza graduación y/o notas del expediente. Registra el cambio en auditoría. */
@Injectable()
export class UpdateClinicalUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY) private readonly repo: PatientRepository,
    @Inject(AUDIT_LOG) private readonly audit: AuditLog,
  ) {}

  async execute(id: string, command: UpdateClinicalCommand, actor: string): Promise<Patient> {
    const patient = await this.repo.findById(id);
    if (!patient) {
      throw new PatientNotFoundError(id);
    }
    const updated = patient.updateClinical(
      command.prescription ?? null,
      command.notes ?? null,
    );
    const saved = await this.repo.update(updated);
    await this.audit.record({
      actor,
      action: 'CLINICAL_UPDATED',
      entityType: 'PATIENT',
      entityId: id,
    });
    return saved;
  }
}
