import { IsInt, IsString, Length, Max, Min } from 'class-validator';
import type { AddCartItemRequest } from '@optimus/contracts';

export class AddCartItemRequestDto implements AddCartItemRequest {
  @IsString()
  @Length(2, 32)
  sku!: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  quantity!: number;
}
