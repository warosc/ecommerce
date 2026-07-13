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

      <h2>Graduación (opcional)</h2>
      <p className="checkout__hint">
        Si compras monturas con lente graduado, dinos qué tipo y tu fórmula. Si no,
        déjalo en blanco.
      </p>
      <label>
        Tipo de lente
        <select name="lensType" defaultValue="">
          <option value="">— No aplica —</option>
          <option value="SIN_GRADUACION">Sin graduación</option>
          <option value="MONOFOCAL">Monofocal</option>
          <option value="PROGRESIVO">Progresivo</option>
          <option value="OCUPACIONAL">Ocupacional</option>
        </select>
      </label>
      <label>
        Tu receta
        <textarea
          name="prescriptionNote"
          rows={3}
          maxLength={500}
          placeholder="Ej. OD -1.25 (-0.50 x 180) · OI -1.00 · ADD +1.00"
        />
      </label>

      <button className="cta" type="submit" disabled={pending}>
        {pending ? 'Procesando…' : 'Confirmar pedido'}
      </button>
      {state.error ? <p className="error">{state.error}</p> : null}
    </form>
  );
}
