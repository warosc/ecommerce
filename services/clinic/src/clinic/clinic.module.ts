import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AUDIT_LOG } from './application/ports/audit-log';
import { FIELD_ENCRYPTOR } from './application/ports/field-encryptor';
import { CreateAppointmentUseCase } from './application/use-cases/appointments/create-appointment.usecase';
import { ListAppointmentsUseCase } from './application/use-cases/appointments/list-appointments.usecase';
import { UpdateAppointmentStatusUseCase } from './application/use-cases/appointments/update-appointment-status.usecase';
import { CreatePatientUseCase } from './application/use-cases/patients/create-patient.usecase';
import { GetPatientUseCase } from './application/use-cases/patients/get-patient.usecase';
import { ListPatientsUseCase } from './application/use-cases/patients/list-patients.usecase';
import { UpdateClinicalUseCase } from './application/use-cases/patients/update-clinical.usecase';
import { APPOINTMENT_REPOSITORY } from './domain/repositories/appointment.repository';
import { PATIENT_REPOSITORY } from './domain/repositories/patient.repository';
import { PrismaAuditLog } from './infrastructure/audit/prisma-audit-log';
import { AesFieldEncryptor } from './infrastructure/crypto/aes-field-encryptor';
import { PrismaAppointmentRepository } from './infrastructure/persistence/prisma/appointment.prisma.repository';
import { PrismaPatientRepository } from './infrastructure/persistence/prisma/patient.prisma.repository';
import { PrismaService } from './infrastructure/persistence/prisma/prisma.service';
import { AppointmentController } from './interfaces/http/appointment.controller';
import { PatientController } from './interfaces/http/patient.controller';

/**
 * Módulo Clínico. Cablea puertos → adaptadores. Los datos clínicos se cifran en
 * reposo (FieldEncryptor) y cada acceso/cambio se audita (AuditLog).
 */
@Module({
  imports: [AuthModule],
  controllers: [PatientController, AppointmentController],
  providers: [
    PrismaService,
    { provide: PATIENT_REPOSITORY, useClass: PrismaPatientRepository },
    { provide: APPOINTMENT_REPOSITORY, useClass: PrismaAppointmentRepository },
    // useFactory: la clave se lee de env dentro del adaptador; evita que Nest
    // intente inyectar el parámetro `string` del constructor.
    { provide: FIELD_ENCRYPTOR, useFactory: (): AesFieldEncryptor => new AesFieldEncryptor() },
    { provide: AUDIT_LOG, useClass: PrismaAuditLog },
    CreatePatientUseCase,
    GetPatientUseCase,
    ListPatientsUseCase,
    UpdateClinicalUseCase,
    CreateAppointmentUseCase,
    ListAppointmentsUseCase,
    UpdateAppointmentStatusUseCase,
  ],
})
export class ClinicModule {}
