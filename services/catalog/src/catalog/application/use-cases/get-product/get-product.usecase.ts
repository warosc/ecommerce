import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../../../domain/entities/product.entity';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../../domain/repositories/product.repository';

/** Obtiene un producto por id; lanza ProductNotFoundError si no existe. */
@Injectable()
export class GetProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repository: ProductRepository,
  ) {}

  async execute(id: string): Promise<Product> {
    const product = await this.repository.findById(id);
    if (!product) {
      throw new ProductNotFoundError(id);
    }
    return product;
  }
}
