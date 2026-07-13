import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Devoluciones · Óptica Optimus' };

export default function DevolucionesPage() {
  return (
    <main className="container content">
      <h1 className="page-title">Devoluciones</h1>
      <p className="lede">¿No te convencieron? Tienes 30 días para devolverlas.</p>
      <ul className="content__list">
        <li>
          <strong>Plazo:</strong> 30 días desde que recibes tu pedido.
        </li>
        <li>
          <strong>Condición:</strong> montura sin uso, con su estuche y accesorios.
        </li>
        <li>
          <strong>Reembolso:</strong> al mismo medio de pago, en 5–10 días hábiles.
        </li>
        <li>
          <strong>Excepción:</strong> lentes con graduación personalizada no admiten devolución
          (salvo defecto de fábrica).
        </li>
      </ul>
      <p className="muted">
        Escríbenos a <a href="mailto:hola@optimus.gt">hola@optimus.gt</a> con tu número de pedido
        para iniciar una devolución.
      </p>
    </main>
  );
}
