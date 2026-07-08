import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { PaginatedResult, PatientDto, PatientSummaryDto } from '@optimus/contracts';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { Roles } from '../../../auth/roles.decorator';
import { RolesGuard } from '../../../auth/roles.guard';
import { CreatePatientUseCase } from '../../application/use-cases/patients/create-patient.usecase';
import { GetPatientUseCase } from '../../application/use-cases/patients/get-patient.usecase';
import { ListPatientsUseCase } from '../../application/use-cases/patients/list-patients.usecase';
import { UpdateClinicalUseCase } from '../../application/use-cases/patients/update-clinical.usecase';
import { Actor } from './actor.decorator';
import { CreatePatientRequestDto } from './dto/create-patient.request.dto';
import { ListPatientsQueryDto } from './dto/list-patients.query.dto';
import { toPatientDto, toPatientSummaryDto } from './dto/response.dto';
import { UpdateClinicalRequestDto } from './dto/update-clinical.request.dto';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientController {
  constructor(
    private readonly createPatient: CreatePatientUseCase,
    private readonly getPatient: GetPatientUseCase,
    private readonly listPatients: ListPatientsUseCase,
    private readonly updateClinical: UpdateClinicalUseCase,
  ) {}

  /** Registrar paciente (recepción). */
  @Post()
  @HttpCode(201)
  @Roles('admin', 'vendedor')
  async create(
    @Body() body: CreatePatientRequestDto,
    @Actor() actor: string,
  ): Promise<PatientDto> {
    const patient = await this.createPatient.execute(
      {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
        prescription: body.prescription,
        notes: body.notes,
      },
      actor,
    );
    return toPatientDto(patient);
  }

  /** Listado de contacto (sin datos clínicos). */
  @Get()
  @Roles('admin', 'vendedor')
  async list(
    @Query() query: ListPatientsQueryDto,
  ): Promise<PaginatedResult<PatientSummaryDto>> {
    const { items, total } = await this.listPatients.execute(query);
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
    const page = query.page && query.page > 0 ? query.page : 1;
    return {
      data: items.map(toPatientSummaryDto),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  /** Expediente completo con graduación/notas. Solo rol clínico (admin). */
  @Get(':id')
  @Roles('admin')
  async getById(@Param('id') id: string, @Actor() actor: string): Promise<PatientDto> {
    return toPatientDto(await this.getPatient.execute(id, actor));
  }

  /** Actualizar graduación y/o notas. Solo rol clínico (admin). */
  @Put(':id/clinical')
  @Roles('admin')
  async updateClinicalData(
    @Param('id') id: string,
    @Body() body: UpdateClinicalRequestDto,
    @Actor() actor: string,
  ): Promise<PatientDto> {
    const patient = await this.updateClinical.execute(
      id,
      { prescription: body.prescription, notes: body.notes },
      actor,
    );
    return toPatientDto(patient);
  }
}
