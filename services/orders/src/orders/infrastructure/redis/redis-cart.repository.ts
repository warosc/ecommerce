import { Injectable } from '@nestjs/common';
import { Cart, CartLineProps } from '../../domain/entities/cart.entity';
import { CartRepository } from '../../domain/repositories/cart.repository';
import { RedisService } from './redis.service';

/** Persistencia del carrito en Redis (clave `cart:{id}`, TTL 7 días). */
@Injectable()
export class RedisCartRepository implements CartRepository {
  private readonly ttlSeconds = 60 * 60 * 24 * 7;

  constructor(private readonly redis: RedisService) {}

  private key(cartId: string): string {
    return `cart:${cartId}`;
  }

  async get(cartId: string): Promise<Cart | null> {
    const raw = await this.redis.getClient().get(this.key(cartId));
    if (!raw) return null;
    const data = JSON.parse(raw) as { lines: CartLineProps[] };
    return Cart.fromLines(cartId, data.lines ?? []);
  }

  async save(cart: Cart): Promise<void> {
    const payload = JSON.stringify({
      lines: cart.items.map((l) => ({
        sku: l.sku,
        name: l.name,
        unitPriceAmount: l.unitPriceAmount,
        currency: l.currency,
        quantity: l.quantity,
      })),
    });
    await this.redis.getClient().set(this.key(cart.cartId), payload, 'EX', this.ttlSeconds);
  }

  async delete(cartId: string): Promise<void> {
    await this.redis.getClient().del(this.key(cartId));
  }
}
