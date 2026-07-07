import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Óptica Optimus',
  description: 'Catálogo de monturas, lentes y accesorios de la Óptica Optimus.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">
            Óptica Optimus
          </Link>
          <nav className="nav">
            <Link href="/catalogo">Catálogo</Link>
            <Link href="/carrito">Carrito</Link>
          </nav>
        </header>
        {children}
        <footer className="footer">
          © Óptica Optimus — Optimus Engineering Kit
        </footer>
      </body>
    </html>
  );
}
