'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ORDERS_API, getCartId, getOrCreateCartId } from '@/lib/cart';

/** Añade un producto (cantidad 1) al carrito. */
export async function addToCartAction(sku: string): Promise<void> {
  const cartId = await getOrCreateCartId();
  await fetch(`${ORDERS_API}/cart/${cartId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku, quantity: 1 }),
    cache: 'no-store',
  });
  revalidatePath('/carrito');
}

/** Quita una línea del carrito. */
export async function removeFromCartAction(sku: string): Promise<void> {
  const cartId = await getCartId();
  if (!cartId) return;
  await fetch(`${ORDERS_API}/cart/${cartId}/items/${encodeURIComponent(sku)}`, {
    method: 'DELETE',
    cache: 'no-store',
  });
  revalidatePath('/carrito');
}

export interface CheckoutState {
  error?: string;
}

/** Checkout: crea el pedido y redirige a la confirmación. */
export async function checkoutAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const cartId = await getCartId();
  if (!cartId) return { error: 'Tu carrito está vacío.' };

  const res = await fetch(`${ORDERS_API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cartId,
      customer: {
        name: String(formData.get('name') ?? ''),
        email: String(formData.get('email') ?? ''),
        phone: String(formData.get('phone') ?? '') || undefined,
      },
    }),
    cache: 'no-store',
  });

  if (res.status === 201) {
    const order = (await res.json()) as { id: string };
    redirect(`/pedido/${order.id}`);
  }

  const body = (await res.json().catch(() => ({}))) as { message?: string };
  return { error: body.message ?? `No se pudo crear el pedido (HTTP ${res.status}).` };
}
