import Link from 'next/link';

/** Pie de página de la tienda: ayuda, tienda, legal, contacto y medios de pago. */
export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__cols">
          <div className="footer__col footer__brandcol">
            <span className="brand">
              <span className="brand__mark" aria-hidden="true">
                ◎
              </span>
              Óptica Optimus
            </span>
            <p className="footer__tagline">Lentes para ver(te) mejor.</p>
            <div className="footer__social" aria-label="Redes sociales">
              <span>📘</span>
              <span>📸</span>
              <span>🐦</span>
            </div>
          </div>

          <div className="footer__col">
            <h4>Ayuda</h4>
            <Link href="/envios">Envíos</Link>
            <Link href="/devoluciones">Devoluciones</Link>
            <Link href="/garantia">Garantía</Link>
            <Link href="/rastreo">Rastrea tu pedido</Link>
            <Link href="/contacto">Contacto</Link>
          </div>

          <div className="footer__col">
            <h4>Tienda</h4>
            <Link href="/catalogo">Catálogo</Link>
            <Link href="/catalogo?type=FRAME">Monturas</Link>
            <Link href="/catalogo?type=LENS">Lentes</Link>
            <Link href="/probador">Probador virtual</Link>
          </div>

          <div className="footer__col">
            <h4>Contacto</h4>
            <a href="mailto:hola@optimus.gt">hola@optimus.gt</a>
            <a href="https://wa.me/50200000000">WhatsApp</a>
            <span className="footer__muted">Lun–Sáb · 9:00–18:00</span>
          </div>
        </div>

        <div className="footer__bottom">
          <span className="footer__note">© Óptica Optimus · Optimus Engineering Kit</span>
          <span className="footer__pay" aria-label="Medios de pago">
            💳 Visa · Mastercard · Amex · PayPal
          </span>
        </div>
      </div>
    </footer>
  );
}
