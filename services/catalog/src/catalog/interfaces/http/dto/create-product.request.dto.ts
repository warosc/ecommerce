import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';
import type { CreateProductRequest } from '@optimus/contracts';
import {
  PRODUCT_TYPES,
  ProductType,
} from '../../../domain/value-objects/product-type.vo';

/** Cuerpo validado de `POST /api/products`. */
export class CreateProductRequestDto implements CreateProductRequest {
  @IsString()
  @Length(2, 32)
  sku!: string;

  @IsString()
  @Length(2, 200)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsIn([...PRODUCT_TYPES])
  type!: ProductType;

  @IsString()
  @Length(1, 120)
  brand!: string;

  @IsInt()
  @Min(0)
  priceAmount!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  compareAtAmount?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}-\d{2}-\d{2,3}$/, {
    message: 'measurements debe tener el formato "calibre-puente-varilla" (mm), p. ej. 52-18-140.',
  })
  measurements?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
