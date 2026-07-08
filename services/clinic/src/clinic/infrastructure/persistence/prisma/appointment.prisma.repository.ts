import { Injectable } from '@nestjs/common';
import { Prisma, Appointment as PrismaAppointment } from '@prisma/client';
import {
  Appointment,
  AppointmentStatus,
} from '../../../domain/entities/appointment.entity';
import {
  AppointmentRepository,
  FindAppointmentsResult,
  ListAppointmentsFilter,
} from '../../../domain/repositories/appointment.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(r: PrismaAppointment): Appointment {
    return Appointment.fromPersistence({
      id: r.id,
      patientId: r.patientId,
      scheduledAt: r.scheduledAt,
      reason: r.reason,
      status: r.status as AppointmentStatus,
      createdAt: r.createdAt,
    });
  }

  async create(a: Appointment): Promise<Appointment> {
    const r = await this.prisma.appointment.create({
      data: {
        id: a.id,
        patientId: a.patientId,
        scheduledAt: a.scheduledAt,
        reason: a.reason,
        status: a.status,
        createdAt: a.createdAt,
      },
    });
    return this.toDomain(r);
  }

  async findById(id: string): Promise<Appointment | null> {
    const r = await this.prisma.appointment.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findMany(filter: ListAppointmentsFilter): Promise<FindAppointmentsResult> {
    const where: Prisma.AppointmentWhereInput = filter.patientId
      ? { patientId: filter.patientId }
      : {};
    const [records, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: { scheduledAt: 'asc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);
    return { items: records.map((r) => this.toDomain(r)), total };
  }

  async update(a: Appointment): Promise<Appointment> {
    const r = await this.prisma.appointment.update({
      where: { id: a.id },
      data: { status: a.status },
    });
    return this.toDomain(r);
  }
}
