import { IsInt, Min } from 'class-validator';

export class SetCartItemQuantityRequestDto {
  @IsInt()
  @Min(0)
  quantity!: number;
}
