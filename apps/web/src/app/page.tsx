import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="hero">
      <h1 className="hero__title">Óptica Optimus</h1>
      <p className="hero__subtitle">
        Monturas, lentes y accesorios para cuidar tu visión.
      </p>
      <div className="hero__actions">
        <Link className="cta" href="/catalogo">
          Ver catálogo
        </Link>
        <Link className="cta cta--ghost" href="/probador">
          Probador virtual
        </Link>
      </div>
    </main>
  );
}
