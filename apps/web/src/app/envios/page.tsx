import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Envíos · Óptica Optimus' };

export default function EnviosPage() {
  return (
    <main className="container content">
      <h1 className="page-title">Envíos</h1>
      <p className="lede">Enviamos a todo el país. Recíbelas en casa sin filas.</p>
      <ul className="content__list">
        <li>
          <strong>Cobertura:</strong> toda la República.
        </li>
        <li>
          <strong>Tiempo estimado:</strong> 2–5 días hábiles según destino.
        </li>
        <li>
          <strong>Costo:</strong> gratis en compras sobre Q500; tarifa fija en el resto.
        </li>
        <li>
          <strong>Seguimiento:</strong> te compartimos el número de pedido para rastrearlo desde{' '}
          <a href="/rastreo">Rastrea tu pedido</a>.
        </li>
      </ul>
    </main>
  );
}
