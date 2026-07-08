export const AUDIT_LOG = Symbol('AUDIT_LOG');

export interface AuditEntry {
  /** Usuario (personal) que realizó la acción. */
  actor: string;
  /** Acción, p. ej. PATIENT_CREATED, PATIENT_VIEWED, PRESCRIPTION_UPDATED. */
  action: string;
  entityType: 'PATIENT' | 'APPOINTMENT';
  entityId: string;
}

/** Registro de auditoría append-only sobre datos clínicos. */
export interface AuditLog {
  record(entry: AuditEntry): Promise<void>;
}
