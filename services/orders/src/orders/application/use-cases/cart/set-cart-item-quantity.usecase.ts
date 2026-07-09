import { Inject, Injectable } from '@nestjs/common';
import { Cart } from '../../../domain/entities/cart.entity';
import {
  CART_REPOSITORY,
  CartRepository,
} from '../../../domain/repositories/cart.repository';

/** Fija la cantidad de una línea del carrito (0 = eliminar). */
@Injectable()
export class SetCartItemQuantityUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: CartRepository,
  ) {}

  async execute(cartId: string, sku: string, quantity: number): Promise<Cart> {
    const cart = (await this.cartRepository.get(cartId)) ?? Cart.empty(cartId);
    cart.setItemQuantity(sku.trim().toUpperCase(), quantity);
    await this.cartRepository.save(cart);
    return cart;
  }
}
