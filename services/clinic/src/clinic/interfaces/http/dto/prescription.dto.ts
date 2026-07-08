import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min, ValidateNested } from 'class-validator';
import type { EyePrescription, Prescription } from '@optimus/contracts';

export class EyeRxDto implements EyePrescription {
  @IsOptional()
  @IsNumber()
  sphere?: number;

  @IsOptional()
  @IsNumber()
  cylinder?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(180)
  axis?: number;

  @IsOptional()
  @IsNumber()
  add?: number;
}

export class PrescriptionDto implements Prescription {
  @IsOptional()
  @ValidateNested()
  @Type(() => EyeRxDto)
  od?: EyeRxDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EyeRxDto)
  os?: EyeRxDto;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  pd?: number;
}
