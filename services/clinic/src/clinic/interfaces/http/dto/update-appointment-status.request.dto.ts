import { IsIn } from 'class-validator';
import type { AppointmentStatus, UpdateAppointmentStatusRequest } from '@optimus/contracts';

export class UpdateAppointmentStatusRequestDto implements UpdateAppointmentStatusRequest {
  @IsIn(['SCHEDULED', 'COMPLETED', 'CANCELLED'])
  status!: AppointmentStatus;
}
