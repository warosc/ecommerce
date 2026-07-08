import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import type { CreatePatientRequest } from '@optimus/contracts';
import { PrescriptionDto } from './prescription.dto';

export class CreatePatientRequestDto implements CreatePatientRequest {
  @IsString()
  @Length(1, 80)
  firstName!: string;

  @IsString()
  @Length(1, 80)
  lastName!: string;

  @IsOptional()
  @IsString()
  @Length(0, 40)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PrescriptionDto)
  prescription?: PrescriptionDto;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  notes?: string;
}
