import { Inject, Injectable } from '@nestjs/common';
import { Prisma, Patient as PrismaPatient } from '@prisma/client';
import { Patient } from '../../../domain/entities/patient.entity';
import {
  FindPatientsResult,
  ListPatientsFilter,
  PatientRepository,
} from '../../../domain/repositories/patient.repository';
import { PrescriptionData } from '../../../domain/value-objects/prescription.vo';
import { FIELD_ENCRYPTOR, FieldEncryptor } from '../../../application/ports/field-encryptor';
import { PrismaService } from './prisma.service';

/**
 * Persistencia del expediente sobre Postgres/Prisma. Cifra la graduación y las
 * notas en reposo (AES-256-GCM) vía el puerto FieldEncryptor; el dominio nunca
 * ve texto cifrado.
 */
@Injectable()
export class PrismaPatientRepository implements PatientRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(FIELD_ENCRYPTOR) private readonly enc: FieldEncryptor,
  ) {}

  private toDomain(r: PrismaPatient): Patient {
    return Patient.fromPersistence({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      phone: r.phone,
      email: r.email,
      birthDate: r.birthDate,
      prescription: r.prescriptionCipher
        ? (JSON.parse(this.enc.decrypt(r.prescriptionCipher)) as PrescriptionData)
        : null,
      notes: r.notesCipher ? this.enc.decrypt(r.notesCipher) : null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    });
  }

  private cipherFields(p: Patient): { prescriptionCipher: string | null; notesCipher: string | null } {
    return {
      prescriptionCipher: p.prescription
        ? this.enc.encrypt(JSON.stringify(p.prescription))
        : null,
      notesCipher: p.notes ? this.enc.encrypt(p.notes) : null,
    };
  }

  async create(p: Patient): Promise<Patient> {
    const r = await this.prisma.patient.create({
      data: {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
        email: p.email,
        birthDate: p.birthDate,
        ...this.cipherFields(p),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      },
    });
    return this.toDomain(r);
  }

  async findById(id: string): Promise<Patient | null> {
    const r = await this.prisma.patient.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findMany(filter: ListPatientsFilter): Promise<FindPatientsResult> {
    const where: Prisma.PatientWhereInput = filter.search
      ? {
          OR: [
            { firstName: { contains: filter.search, mode: 'insensitive' } },
            { lastName: { contains: filter.search, mode: 'insensitive' } },
          ],
        }
      : {};
    const [records, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: { lastName: 'asc' },
      }),
      this.prisma.patient.count({ where }),
    ]);
    return { items: records.map((r) => this.toDomain(r)), total };
  }

  async update(p: Patient): Promise<Patient> {
    const r = await this.prisma.patient.update({
      where: { id: p.id },
      data: {
        phone: p.phone,
        email: p.email,
        ...this.cipherFields(p),
        updatedAt: p.updatedAt,
      },
    });
    return this.toDomain(r);
  }
}
