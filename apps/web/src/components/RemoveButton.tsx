'use client';

import { useTransition } from 'react';
import { removeFromCartAction } from '@/app/actions';

export function RemoveButton({ sku }: { sku: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="link-danger"
      disabled={pending}
      onClick={() => startTransition(() => removeFromCartAction(sku))}
    >
      Quitar
    </button>
  );
}
