import { IsDateString, IsString, Length } from 'class-validator';
import type { CreateAppointmentRequest } from '@optimus/contracts';

export class CreateAppointmentRequestDto implements CreateAppointmentRequest {
  @IsString()
  @Length(1, 64)
  patientId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsString()
  @Length(2, 200)
  reason!: string;
}
