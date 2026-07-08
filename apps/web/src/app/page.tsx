import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container">
      <section className="hero">
        <span className="hero__eyebrow">Pruébate las gafas online 👓</span>
        <h1 className="hero__title">Encuentra tu montura perfecta</h1>
        <p className="hero__subtitle">
          Monturas, lentes y accesorios para cuidar tu visión. Explora el catálogo y
          pruébate cualquier montura en tiempo real con nuestro probador virtual.
        </p>
        <div className="hero__actions">
          <Link className="cta" href="/catalogo">
            Ver catálogo
          </Link>
          <Link className="cta cta--ghost" href="/probador">
            Probador virtual →
          </Link>
        </div>
      </section>
    </main>
  );
}
