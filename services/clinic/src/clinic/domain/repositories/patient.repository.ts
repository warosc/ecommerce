import { Patient } from '../entities/patient.entity';

export const PATIENT_REPOSITORY = Symbol('PATIENT_REPOSITORY');

export interface ListPatientsFilter {
  page: number;
  limit: number;
  /** Búsqueda por nombre/apellido. */
  search?: string;
}

export interface FindPatientsResult {
  items: Patient[];
  total: number;
}

/**
 * Puerto de persistencia del expediente. El adaptador es responsable de cifrar
 * los datos clínicos en reposo; el dominio siempre maneja datos en claro.
 */
export interface PatientRepository {
  create(patient: Patient): Promise<Patient>;
  findById(id: string): Promise<Patient | null>;
  findMany(filter: ListPatientsFilter): Promise<FindPatientsResult>;
  update(patient: Patient): Promise<Patient>;
}
