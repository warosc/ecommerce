import {
  Prisma,
  Product as PrismaProduct,
  ProductType as PrismaProductType,
} from '@prisma/client';
import { Product } from '../../../domain/entities/product.entity';
import { Money } from '../../../domain/value-objects/money.vo';
import { ProductType } from '../../../domain/value-objects/product-type.vo';
import { Sku } from '../../../domain/value-objects/sku.vo';

/** Traduce entre el registro de persistencia (Prisma) y el agregado de dominio. */
export class ProductMapper {
  /** Registro de la BD → entidad de dominio. */
  static toDomain(record: PrismaProduct): Product {
    return Product.fromPersistence({
      id: record.id,
      sku: Sku.create(record.sku),
      name: record.name,
      description: record.description,
      type: record.type as ProductType,
      brand: record.brand,
      price: Money.create(record.priceAmount, record.currency),
      compareAtAmount: record.compareAtAmount,
      measurements: record.measurements,
      stock: record.stock,
      images: record.images,
      tryOnImageUrl: record.tryOnImageUrl,
      active: record.active,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  /** Entidad de dominio → objeto de creación para Prisma. */
  static toPersistence(product: Product): Prisma.ProductUncheckedCreateInput {
    return {
      id: product.id,
      sku: product.sku.value,
      name: product.name,
      description: product.description,
      type: product.type as PrismaProductType,
      brand: product.brand,
      priceAmount: product.price.amount,
      compareAtAmount: product.compareAtAmount,
      measurements: product.measurements,
      currency: product.price.currency,
      stock: product.stock,
      images: product.images,
      tryOnImageUrl: product.tryOnImageUrl,
      active: product.active,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
