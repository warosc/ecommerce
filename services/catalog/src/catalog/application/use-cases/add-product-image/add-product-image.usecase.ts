import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../../../domain/entities/product.entity';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../../domain/repositories/product.repository';
import {
  IMAGE_STORAGE,
  ImageStorage,
  UploadImageInput,
} from '../../ports/image-storage';
import { PRODUCT_SEARCH, ProductSearchIndex } from '../../ports/product-search';

/**
 * Sube una imagen a MinIO y añade su URL pública al producto. Lanza
 * ProductNotFoundError si el producto no existe. Reindexa en el buscador.
 */
@Injectable()
export class AddProductImageUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repository: ProductRepository,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
    @Inject(PRODUCT_SEARCH) private readonly search: ProductSearchIndex,
  ) {}

  async execute(id: string, input: UploadImageInput): Promise<Product> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new ProductNotFoundError(id);
    }
    const url = await this.storage.upload(`products/${id}`, input);
    const updated = await this.repository.appendImage(id, url);
    if (!updated) {
      throw new ProductNotFoundError(id);
    }
    await this.search.index(updated).catch(() => undefined);
    return updated;
  }
}
