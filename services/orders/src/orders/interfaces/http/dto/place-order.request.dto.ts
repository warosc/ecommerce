import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { LENS_TYPES, type CustomerDto, type LensType, type PlaceOrderRequest } from '@optimus/contracts';

class CustomerRequestDto implements CustomerDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @Length(0, 40)
  phone?: string;
}

export class PlaceOrderRequestDto implements PlaceOrderRequest {
  @IsString()
  @Length(1, 100)
  cartId!: string;

  @ValidateNested()
  @Type(() => CustomerRequestDto)
  customer!: CustomerRequestDto;

  @IsOptional()
  @IsIn([...LENS_TYPES])
  lensType?: LensType;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  prescriptionNote?: string;
}
