import { Inject, Injectable } from '@nestjs/common';
import { Cart } from '../../../domain/entities/cart.entity';
import {
  CART_REPOSITORY,
  CartRepository,
} from '../../../domain/repositories/cart.repository';

@Injectable()
export class RemoveFromCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: CartRepository,
  ) {}

  async execute(cartId: string, sku: string): Promise<Cart> {
    const cart = (await this.cartRepository.get(cartId)) ?? Cart.empty(cartId);
    cart.removeItem(sku.trim().toUpperCase());
    await this.cartRepository.save(cart);
    return cart;
  }
}
