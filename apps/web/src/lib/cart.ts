import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import type { CartDto, OrderDto } from '@optimus/contracts';

export const ORDERS_API =
  process.env.ORDERS_API_INTERNAL ?? 'http://orders-api:3005/api';

const CART_COOKIE = 'optimus_cart';

/** Lee el id de carrito de la cookie (solo lectura; usable en Server Components). */
export async function getCartId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value;
}

/** Lee o crea el id de carrito. Solo desde Server Actions / Route Handlers. */
export async function getOrCreateCartId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CART_COOKIE)?.value;
  if (existing) return existing;
  const id = randomUUID();
  store.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return id;
}

export async function fetchCart(): Promise<CartDto | null> {
  const id = await getCartId();
  if (!id) return null;
  const res = await fetch(`${ORDERS_API}/cart/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as CartDto;
}

export async function fetchOrder(id: string): Promise<OrderDto | null> {
  const res = await fetch(`${ORDERS_API}/orders/${encodeURIComponent(id)}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()) as OrderDto;
}
