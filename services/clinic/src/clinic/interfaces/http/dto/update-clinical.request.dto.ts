import { Type } from 'class-transformer';
import { IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import type { UpdateClinicalRequest } from '@optimus/contracts';
import { PrescriptionDto } from './prescription.dto';

export class UpdateClinicalRequestDto implements UpdateClinicalRequest {
  @IsOptional()
  @ValidateNested()
  @Type(() => PrescriptionDto)
  prescription?: PrescriptionDto;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  notes?: string;
}
