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

/**
 * Sube la montura del probador virtual a MinIO y fija su URL pública en el
 * producto (`tryOnImageUrl`). Lanza ProductNotFoundError si el producto no
 * existe. A diferencia de las imágenes de catálogo, esta URL se reemplaza
 * (una montura por producto), no se acumula.
 */
@Injectable()
export class SetProductTryOnImageUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repository: ProductRepository,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
  ) {}

  async execute(id: string, input: UploadImageInput): Promise<Product> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new ProductNotFoundError(id);
    }
    const url = await this.storage.upload(`tryon/${id}`, input);
    const updated = await this.repository.setTryOnImage(id, url);
    if (!updated) {
      throw new ProductNotFoundError(id);
    }
    return updated;
  }
}
