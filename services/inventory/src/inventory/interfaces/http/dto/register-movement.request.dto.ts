import { IsIn, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import type { RegisterMovementRequest } from '@optimus/contracts';
import { MOVEMENT_TYPES, MovementType } from '../../../domain/value-objects/movement-type.vo';

export class RegisterMovementRequestDto implements RegisterMovementRequest {
  @IsIn([...MOVEMENT_TYPES])
  type!: MovementType;

  @IsInt()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  reason?: string;
}
