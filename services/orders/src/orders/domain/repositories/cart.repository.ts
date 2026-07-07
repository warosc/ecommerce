import { Cart } from '../entities/cart.entity';

export const CART_REPOSITORY = Symbol('CART_REPOSITORY');

/** Puerto de persistencia del carrito (implementado con Redis). */
export interface CartRepository {
  get(cartId: string): Promise<Cart | null>;
  save(cart: Cart): Promise<void>;
  delete(cartId: string): Promise<void>;
}
