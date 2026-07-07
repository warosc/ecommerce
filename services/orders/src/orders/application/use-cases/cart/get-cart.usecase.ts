import { Inject, Injectable } from '@nestjs/common';
import { Cart } from '../../../domain/entities/cart.entity';
import {
  CART_REPOSITORY,
  CartRepository,
} from '../../../domain/repositories/cart.repository';

@Injectable()
export class GetCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: CartRepository,
  ) {}

  async execute(cartId: string): Promise<Cart> {
    return (await this.cartRepository.get(cartId)) ?? Cart.empty(cartId);
  }
}
