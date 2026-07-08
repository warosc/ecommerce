import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Manrope } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

// Tipografía self-hosted por Next (sin CDN en runtime).
const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'Óptica Optimus',
  description: 'Monturas, lentes y accesorios. Pruébate las gafas online con el probador virtual.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={manrope.variable}>
      <body>
        <header className="topbar">
          <div className="topbar__inner">
            <Link href="/" className="brand">
              <span className="brand__mark" aria-hidden="true">
                ◎
              </span>
              Óptica Optimus
            </Link>
            <nav className="nav">
              <Link href="/catalogo">Catálogo</Link>
              <Link href="/probador">Probador</Link>
              <Link href="/carrito" className="nav__cart">
                Carrito
              </Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="footer">
          <div className="footer__inner">
            <span className="brand brand--sm">
              <span className="brand__mark" aria-hidden="true">
                ◎
              </span>
              Óptica Optimus
            </span>
            <span className="footer__note">Optimus Engineering Kit · demo open source</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
