import { Inject, Injectable } from '@nestjs/common';
import { Cart } from '../../../domain/entities/cart.entity';
import { ProductNotAvailableError } from '../../../domain/errors';
import {
  CART_REPOSITORY,
  CartRepository,
} from '../../../domain/repositories/cart.repository';
import { CATALOG_GATEWAY, CatalogGateway } from '../../ports/catalog.gateway';

/**
 * Añade un producto al carrito. Consulta Catálogo para obtener nombre y precio
 * autoritativos (el cliente no fija el precio).
 */
@Injectable()
export class AddToCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: CartRepository,
    @Inject(CATALOG_GATEWAY) private readonly catalog: CatalogGateway,
  ) {}

  async execute(cartId: string, sku: string, quantity: number): Promise<Cart> {
    const normalizedSku = sku.trim().toUpperCase();
    const product = await this.catalog.getProductBySku(normalizedSku);
    if (!product || !product.active) {
      throw new ProductNotAvailableError(normalizedSku);
    }

    const cart = (await this.cartRepository.get(cartId)) ?? Cart.empty(cartId);
    cart.addItem({
      sku: product.sku,
      name: product.name,
      unitPriceAmount: product.unitPriceAmount,
      currency: product.currency,
      quantity,
    });
    await this.cartRepository.save(cart);
    return cart;
  }
}
