import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import type {
  CustomerDto,
  PaymentMethod,
  PlacePosOrderRequest,
  PosOrderLineInput,
} from '@optimus/contracts';

class PosLineDto implements PosOrderLineInput {
  @IsString()
  @Length(1, 64)
  sku!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

class PosCustomerDto implements CustomerDto {
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

export class PlacePosOrderRequestDto implements PlacePosOrderRequest {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PosLineDto)
  lines!: PosLineDto[];

  @IsIn(['CASH', 'CARD'])
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @ValidateNested()
  @Type(() => PosCustomerDto)
  customer?: PosCustomerDto;
}
