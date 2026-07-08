export abstract class DomainError extends Error {
  abstract readonly code: string;
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PatientNotFoundError extends DomainError {
  readonly code = 'PATIENT_NOT_FOUND';
  constructor(id: string) {
    super(`No existe el paciente '${id}'.`);
  }
}

export class InvalidPatientError extends DomainError {
  readonly code = 'INVALID_PATIENT';
  constructor(message: string) {
    super(message);
  }
}

export class AppointmentNotFoundError extends DomainError {
  readonly code = 'APPOINTMENT_NOT_FOUND';
  constructor(id: string) {
    super(`No existe la cita '${id}'.`);
  }
}

export class InvalidAppointmentError extends DomainError {
  readonly code = 'INVALID_APPOINTMENT';
  constructor(message: string) {
    super(message);
  }
}
