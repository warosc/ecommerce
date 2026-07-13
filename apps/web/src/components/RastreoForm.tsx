'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Busca un pedido por su número y navega a su página de estado. */
export function RastreoForm() {
  const router = useRouter();
  const [value, setValue] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = value.trim();
    if (id) router.push(`/pedido/${encodeURIComponent(id)}`);
  }

  return (
    <form className="rastreo" onSubmit={submit}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Número de pedido (p. ej. 3f2a…)"
        aria-label="Número de pedido"
      />
      <button className="cta" type="submit">
        Rastrear
      </button>
    </form>
  );
}
