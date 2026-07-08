import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AppointmentDto, PaginatedResult } from '@optimus/contracts';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { Roles } from '../../../auth/roles.decorator';
import { RolesGuard } from '../../../auth/roles.guard';
import { CreateAppointmentUseCase } from '../../application/use-cases/appointments/create-appointment.usecase';
import { ListAppointmentsUseCase } from '../../application/use-cases/appointments/list-appointments.usecase';
import { UpdateAppointmentStatusUseCase } from '../../application/use-cases/appointments/update-appointment-status.usecase';
import { Actor } from './actor.decorator';
import { CreateAppointmentRequestDto } from './dto/create-appointment.request.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments.query.dto';
import { toAppointmentDto } from './dto/response.dto';
import { UpdateAppointmentStatusRequestDto } from './dto/update-appointment-status.request.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'vendedor')
export class AppointmentController {
  constructor(
    private readonly createAppointment: CreateAppointmentUseCase,
    private readonly listAppointments: ListAppointmentsUseCase,
    private readonly updateStatus: UpdateAppointmentStatusUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body() body: CreateAppointmentRequestDto,
    @Actor() actor: string,
  ): Promise<AppointmentDto> {
    const view = await this.createAppointment.execute(
      { patientId: body.patientId, scheduledAt: new Date(body.scheduledAt), reason: body.reason },
      actor,
    );
    return toAppointmentDto(view);
  }

  @Get()
  async list(
    @Query() query: ListAppointmentsQueryDto,
  ): Promise<PaginatedResult<AppointmentDto>> {
    const { items, total } = await this.listAppointments.execute(query);
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 50;
    const page = query.page && query.page > 0 ? query.page : 1;
    return {
      data: items.map(toAppointmentDto),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body() body: UpdateAppointmentStatusRequestDto,
    @Actor() actor: string,
  ): Promise<AppointmentDto> {
    return toAppointmentDto(await this.updateStatus.execute(id, body.status, actor));
  }
}
