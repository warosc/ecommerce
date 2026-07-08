import { Inject, Injectable } from '@nestjs/common';
import {
  FindPatientsResult,
  ListPatientsFilter,
  PATIENT_REPOSITORY,
  PatientRepository,
} from '../../../domain/repositories/patient.repository';

/**
 * Lista pacientes (solo datos de contacto, sin graduación ni notas), por lo que
 * no requiere registro de auditoría de acceso clínico.
 */
@Injectable()
export class ListPatientsUseCase {
  constructor(
    @Inject(PATIENT_REPOSITORY) private readonly repo: PatientRepository,
  ) {}

  async execute(filter: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<FindPatientsResult> {
    const normalized: ListPatientsFilter = {
      page: filter.page && filter.page > 0 ? filter.page : 1,
      limit: filter.limit && filter.limit > 0 ? Math.min(filter.limit, 100) : 20,
      search: filter.search?.trim() || undefined,
    };
    return this.repo.findMany(normalized);
  }
}
