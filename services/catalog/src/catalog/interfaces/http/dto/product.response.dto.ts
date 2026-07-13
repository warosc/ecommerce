import type { ProductDto } from '@optimus/contracts';
import { Product } from '../../../domain/entities/product.entity';

/** Serializa un agregado de dominio a la forma pública de la API (ProductDto). */
export function toProductDto(product: Product): ProductDto {
  return {
    id: product.id,
    sku: product.sku.value,
    name: product.name,
    description: product.description,
    type: product.type,
    brand: product.brand,
    price: { amount: product.price.amount, currency: product.price.currency },
    compareAtAmount: product.compareAtAmount,
    measurements: product.measurements,
    stock: product.stock,
    images: product.images,
    tryOnImageUrl: product.tryOnImageUrl,
    active: product.active,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
