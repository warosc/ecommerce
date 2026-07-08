'use client';

import type { OrderDto, PaymentMethod, ProductDto } from '@optimus/contracts';
import { useMemo, useState, useTransition } from 'react';
import { placePosSaleAction, type PosSaleResult } from '@/app/actions';

const money = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });
const fmt = (cents: number) => money.format(cents / 100);

interface Line {
  product: ProductDto;
  qty: number;
}

/** Terminal de punto de venta: busca productos, arma el carrito y cobra. */
export function PosTerminal({ products }: { products: ProductDto[] }) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Map<string, Line>>(new Map());
  const [payment, setPayment] = useState<PaymentMethod>('CASH');
  const [result, setResult] = useState<PosSaleResult | null>(null);
  const [receipt, setReceipt] = useState<OrderDto | null>(null);
  const [submitting, startSubmit] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => p.active)
      .filter(
        (p) =>
          q === '' ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      )
      .slice(0, 24);
  }, [products, search]);

  const lines = [...cart.values()];
  const total = lines.reduce((s, l) => s + l.product.price.amount * l.qty, 0);

  function setQty(sku: string, qty: number) {
    setResult(null);
    setCart((prev) => {
      const next = new Map(prev);
      const line = next.get(sku);
      if (!line) return next;
      if (qty <= 0) next.delete(sku);
      else next.set(sku, { ...line, qty });
      return next;
    });
  }

  function add(product: ProductDto) {
    setResult(null);
    setCart((prev) => {
      const next = new Map(prev);
      const line = next.get(product.sku);
      next.set(product.sku, { product, qty: (line?.qty ?? 0) + 1 });
      return next;
    });
  }

  function cobrar() {
    if (lines.length === 0) return;
    startSubmit(async () => {
      const res = await placePosSaleAction({
        lines: lines.map((l) => ({ sku: l.product.sku, quantity: l.qty })),
        paymentMethod: payment,
      });
      setResult(res);
      if (res.ok && res.order) {
        setReceipt(res.order);
        setCart(new Map());
      }
    });
  }

  if (receipt) {
    return (
      <div className="ticket">
        <h3>Venta registrada ✅</h3>
        <p className="muted">
          #{receipt.id.slice(0, 8)} · {new Date(receipt.createdAt).toLocaleString('es-GT')} ·{' '}
          {receipt.paymentMethod === 'CASH' ? 'Efectivo' : 'Tarjeta'}
        </p>
        <ul className="ticket__lines">
          {receipt.lines.map((l) => (
            <li key={l.sku}>
              <span>
                {l.quantity}× {l.name}
              </span>
              <span>{fmt(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <p className="ticket__total">
          <strong>Total</strong>
          <strong>{fmt(receipt.totalAmount)}</strong>
        </p>
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => {
            setReceipt(null);
            setResult(null);
          }}
        >
          Nueva venta
        </button>
      </div>
    );
  }

  return (
    <div className="pos">
      <div className="pos__catalog">
        <input
          className="pos__search"
          type="search"
          placeholder="Buscar por nombre o SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="pos__grid">
          {filtered.map((p) => (
            <button key={p.id} type="button" className="pos__product" onClick={() => add(p)}>
              <span className="pos__pname">{p.name}</span>
              <span className="pos__pmeta">
                {p.sku} · Stock {p.stock}
              </span>
              <span className="pos__pprice">{fmt(p.price.amount)}</span>
            </button>
          ))}
          {filtered.length === 0 ? <p className="muted">Sin resultados.</p> : null}
        </div>
      </div>

      <aside className="pos__cart">
        <h3>Venta</h3>
        {lines.length === 0 ? (
          <p className="muted">Añade productos desde la izquierda.</p>
        ) : (
          <ul className="pos__lines">
            {lines.map((l) => (
              <li key={l.product.sku} className="pos__line">
                <span className="pos__lname">{l.product.name}</span>
                <span className="pos__qty">
                  <button type="button" onClick={() => setQty(l.product.sku, l.qty - 1)}>
                    −
                  </button>
                  <span>{l.qty}</span>
                  <button type="button" onClick={() => setQty(l.product.sku, l.qty + 1)}>
                    +
                  </button>
                </span>
                <span className="pos__lt">{fmt(l.product.price.amount * l.qty)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="pos__total">
          <span>Total</span>
          <strong>{fmt(total)}</strong>
        </div>

        <div className="pos__pay">
          <button
            type="button"
            className={`btn ${payment === 'CASH' ? 'btn--primary' : ''}`}
            onClick={() => setPayment('CASH')}
          >
            Efectivo
          </button>
          <button
            type="button"
            className={`btn ${payment === 'CARD' ? 'btn--primary' : ''}`}
            onClick={() => setPayment('CARD')}
          >
            Tarjeta
          </button>
        </div>

        <button
          className="btn btn--primary pos__cobrar"
          type="button"
          onClick={cobrar}
          disabled={submitting || lines.length === 0}
        >
          {submitting ? 'Cobrando…' : `Cobrar ${fmt(total)}`}
        </button>

        {result && !result.ok ? <p className="alert alert--err">{result.message}</p> : null}
      </aside>
    </div>
  );
}
