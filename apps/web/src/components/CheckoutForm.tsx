'use client';

import { useActionState } from 'react';
import { checkoutAction, type CheckoutState } from '@/app/actions';

const INITIAL: CheckoutState = {};

export function CheckoutForm() {
  const [state, action, pending] = useActionState(checkoutAction, INITIAL);

  return (
    <form action={action} className="checkout">
      <h2>Datos de contacto</h2>
      <label>
        Nombre
        <input name="name" required placeholder="Tu nombre" />
      </label>
      <label>
        Email
        <input name="email" type="email" required placeholder="tu@email.com" />
      </label>
      <label>
        Teléfono (opcional)
        <input name="phone" placeholder="5555-1234" />
      </label>
      <button className="cta" type="submit" disabled={pending}>
        {pending ? 'Procesando…' : 'Confirmar pedido'}
      </button>
      {state.error ? <p className="error">{state.error}</p> : null}
    </form>
  );
}
