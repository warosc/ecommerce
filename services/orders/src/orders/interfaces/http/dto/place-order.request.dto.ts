import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import type { CustomerDto, PlaceOrderRequest } from '@optimus/contracts';

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
}
