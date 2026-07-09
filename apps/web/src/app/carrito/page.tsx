import Link from 'next/link';
import { CheckoutForm } from '@/components/CheckoutForm';
import { QuantityStepper } from '@/components/QuantityStepper';
import { RemoveButton } from '@/components/RemoveButton';
import { fetchCart } from '@/lib/cart';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function CarritoPage() {
  const cart = await fetchCart();
  const lines = cart?.lines ?? [];

  if (lines.length === 0) {
    return (
      <main className="container">
        <h1 className="page-title">Carrito</h1>
        <p className="muted">Tu carrito está vacío.</p>
        <Link className="cta" href="/catalogo">
          Ver catálogo
        </Link>
      </main>
    );
  }

  return (
    <main className="container">
      <h1 className="page-title">Carrito</h1>
      <div className="cart-table">
        {lines.map((l) => (
          <div className="cart-row" key={l.sku}>
            <div>
              <strong>{l.name}</strong>
              <span className="muted"> · {formatPrice(l.unitPriceAmount, l.currency)} c/u</span>
            </div>
            <QuantityStepper sku={l.sku} quantity={l.quantity} />
            <div className="cart-row__total">{formatPrice(l.lineTotal, l.currency)}</div>
            <RemoveButton sku={l.sku} />
          </div>
        ))}
      </div>
      <p className="cart-total">
        Total: <strong>{formatPrice(cart!.totalAmount, cart!.currency)}</strong>
      </p>
      <CheckoutForm />
    </main>
  );
}
