'use client';

import { useState, useTransition } from 'react';
import { addToCartAction } from '@/app/actions';

export function AddToCartButton({ sku }: { sku: string }) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      className="btn-add"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await addToCartAction(sku);
          setAdded(true);
        })
      }
    >
      {pending ? 'Añadiendo…' : added ? 'Añadido ✓' : 'Añadir al carrito'}
    </button>
  );
}
