import { randomUUID } from 'node:crypto';
import { InvalidPatientError } from '../errors';
import { PrescriptionData, validatePrescription } from '../value-objects/prescription.vo';

export interface PatientProps {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  birthDate: Date | null;
  prescription: PrescriptionData | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewPatientInput {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  birthDate?: Date;
  prescription?: PrescriptionData;
  notes?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Agregado raíz del expediente del paciente. Contiene datos clínicos sensibles. */
export class Patient {
  private constructor(private readonly props: PatientProps) {}

  static create(input: NewPatientInput): Patient {
    const firstName = (input.firstName ?? '').trim();
    const lastName = (input.lastName ?? '').trim();
    if (firstName.length < 1 || lastName.length < 1) {
      throw new InvalidPatientError('Nombre y apellido son obligatorios.');
    }
    const email = input.email?.trim() || undefined;
    if (email && !EMAIL_RE.test(email)) {
      throw new InvalidPatientError(`Email inválido: '${input.email}'.`);
    }
    if (input.prescription) validatePrescription(input.prescription);

    const now = new Date();
    return new Patient({
      id: randomUUID(),
      firstName,
      lastName,
      phone: input.phone?.trim() || null,
      email: email ?? null,
      birthDate: input.birthDate ?? null,
      prescription: input.prescription ?? null,
      notes: input.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: PatientProps): Patient {
    return new Patient(props);
  }

  /** Devuelve una copia con la graduación/notas actualizadas (inmutable). */
  updateClinical(prescription: PrescriptionData | null, notes: string | null): Patient {
    if (prescription) validatePrescription(prescription);
    return new Patient({
      ...this.props,
      prescription: prescription ?? this.props.prescription,
      notes: notes ?? this.props.notes,
      updatedAt: new Date(),
    });
  }

  get id(): string {
    return this.props.id;
  }
  get firstName(): string {
    return this.props.firstName;
  }
  get lastName(): string {
    return this.props.lastName;
  }
  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }
  get phone(): string | null {
    return this.props.phone;
  }
  get email(): string | null {
    return this.props.email;
  }
  get birthDate(): Date | null {
    return this.props.birthDate;
  }
  get prescription(): PrescriptionData | null {
    return this.props.prescription;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
