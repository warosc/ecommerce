'use client';

import { useActionState } from 'react';
import { createProduct, type CreateProductState } from '@/app/actions';

const INITIAL: CreateProductState = { ok: false, message: '' };

export function CreateProductForm() {
  const [state, formAction, pending] = useActionState(createProduct, INITIAL);

  return (
    <form action={formAction} className="form">
      <div className="grid2">
        <label>
          SKU
          <input name="sku" required placeholder="FR-NUEVA-01" />
        </label>
        <label>
          Marca
          <input name="brand" required placeholder="Optimus" />
        </label>
      </div>
      <label>
        Nombre
        <input name="name" required placeholder="Montura Classic" />
      </label>
      <label>
        Descripción
        <input name="description" placeholder="Opcional" />
      </label>
      <div className="grid2">
        <label>
          Tipo
          <select name="type" defaultValue="FRAME">
            <option value="FRAME">Montura</option>
            <option value="LENS">Lente</option>
            <option value="ACCESSORY">Accesorio</option>
          </select>
        </label>
        <label>
          Precio (centavos GTQ)
          <input name="priceAmount" type="number" min="0" required defaultValue={45000} />
        </label>
      </div>
      <label>
        Precio anterior (centavos, opcional)
        <input name="compareAtAmount" type="number" min="0" placeholder="Para mostrar descuento" />
      </label>
      <div className="grid2">
        <label>
          Medidas (opcional)
          <input name="measurements" placeholder="52-18-140" pattern="\d{2}-\d{2}-\d{2,3}" />
          <small className="hint">Calibre-puente-varilla en mm. Solo monturas.</small>
        </label>
        <label>
          Stock
          <input name="stock" type="number" min="0" defaultValue={0} />
        </label>
      </div>
      <label>
        Imagen (opcional)
        <input name="image" type="file" accept="image/*" />
      </label>
      <label>
        Montura para el probador (opcional)
        <input name="tryOnImage" type="file" accept="image/png,image/webp" />
        <small className="hint">
          PNG o WebP con fondo transparente, vista frontal. Se superpone sobre la
          cara en el probador virtual.
        </small>
      </label>

      <button className="btn btn--primary" type="submit" disabled={pending}>
        {pending ? 'Creando…' : 'Crear producto'}
      </button>

      {state.message ? (
        <p className={state.ok ? 'alert alert--ok' : 'alert alert--err'}>{state.message}</p>
      ) : null}
    </form>
  );
}
