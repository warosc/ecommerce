import type { LensType } from '@optimus/contracts';
import Link from 'next/link';
import { fetchOrder } from '@/lib/cart';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

const LENS_LABELS: Record<LensType, string> = {
  SIN_GRADUACION: 'Sin graduación',
  MONOFOCAL: 'Monofocal',
  PROGRESIVO: 'Progresivo',
  OCUPACIONAL: 'Ocupacional',
};

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await fetchOrder(id);

  if (!order) {
    return (
      <main className="container">
        <h1 className="page-title">Pedido</h1>
        <p className="error">No se encontró el pedido.</p>
        <Link className="cta" href="/catalogo">
          Ir al catálogo
        </Link>
      </main>
    );
  }

  return (
    <main className="container">
      <h1 className="page-title">¡Pedido confirmado! 🎉</h1>
      <p className="muted">Número de pedido: {order.id}</p>
      <div className="cart-table">
        {order.lines.map((l) => (
          <div className="cart-row" key={l.sku}>
            <div>
              <strong>{l.name}</strong>
              <span className="muted"> · {l.sku}</span>
            </div>
            <div>
              {l.quantity} × {formatPrice(l.unitPriceAmount, order.currency)}
            </div>
            <div className="cart-row__total">{formatPrice(l.lineTotal, order.currency)}</div>
          </div>
        ))}
      </div>
      <p className="cart-total">
        Total: <strong>{formatPrice(order.totalAmount, order.currency)}</strong>
      </p>

      {order.lensType || order.prescriptionNote ? (
        <div className="order-rx">
          <h2>Tu graduación</h2>
          {order.lensType ? (
            <p>
              Tipo de lente: <strong>{LENS_LABELS[order.lensType]}</strong>
            </p>
          ) : null}
          {order.prescriptionNote ? (
            <p className="order-rx__note">
              Receta: <span>{order.prescriptionNote}</span>
            </p>
          ) : null}
          <small className="muted">
            Un óptico revisará tu fórmula y te contactará si necesita confirmarla.
          </small>
        </div>
      ) : null}

      <p className="muted">
        Gracias, {order.customer.name}. Te contactaremos en {order.customer.email}.
      </p>
      <Link className="cta" href="/catalogo">
        Seguir comprando
      </Link>
    </main>
  );
}
