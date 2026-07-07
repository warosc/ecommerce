import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { ListProductsQuery } from '@optimus/contracts';
import {
  PRODUCT_TYPES,
  ProductType,
} from '../../../domain/value-objects/product-type.vo';

/** Query params validados de `GET /api/products`. */
export class ListProductsQueryDto implements ListProductsQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsIn([...PRODUCT_TYPES])
  type?: ProductType;

  @IsOptional()
  @IsString()
  search?: string;
}
