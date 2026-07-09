'use client';

import { useTransition } from 'react';
import { setCartQuantityAction } from '@/app/actions';

/** Control +/- para la cantidad de una línea del carrito. */
export function QuantityStepper({ sku, quantity }: { sku: string; quantity: number }) {
  const [pending, start] = useTransition();

  const set = (q: number) => start(() => setCartQuantityAction(sku, q));

  return (
    <div className="qty">
      <button
        type="button"
        className="qty__btn"
        aria-label="Quitar uno"
        disabled={pending}
        onClick={() => set(quantity - 1)}
      >
        −
      </button>
      <span className="qty__value">{quantity}</span>
      <button
        type="button"
        className="qty__btn"
        aria-label="Añadir uno"
        disabled={pending}
        onClick={() => set(quantity + 1)}
      >
        +
      </button>
    </div>
  );
}
