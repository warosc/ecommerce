import type { ProductDto } from '@optimus/contracts';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { getProducts } from '@/lib/api';

export const dynamic = 'force-dynamic';

const CATEGORIES = [
  { type: 'FRAME', label: 'Monturas', emoji: '👓', desc: 'De acetato, metal y más' },
  { type: 'LENS', label: 'Lentes', emoji: '🔍', desc: 'Antirreflejo, progresivos, sol' },
  { type: 'ACCESSORY', label: 'Accesorios', emoji: '🧼', desc: 'Estuches, limpieza, cadenas' },
];

const VALUE_PROPS = [
  { icon: '🕶️', title: 'Pruébatelas online', desc: 'Probador virtual con tu cámara' },
  { icon: '🚚', title: 'Envío a domicilio', desc: 'A todo el país' },
  { icon: '🛡️', title: 'Garantía de 1 año', desc: 'En todas las monturas' },
  { icon: '↩️', title: '30 días de devolución', desc: 'Sin complicaciones' },
];

const TESTIMONIALS = [
  { text: 'Me las probé desde el sofá y acerté a la primera. Llegaron en 3 días.', name: 'Ana G.' },
  { text: 'La montura que elegí me quedó justo como en el probador. Brutal.', name: 'Luis P.' },
  { text: 'Atención por WhatsApp rapidísima y devolución sin líos.', name: 'Marta R.' },
];

export default async function HomePage() {
  let featured: ProductDto[] = [];
  try {
    const { data } = await getProducts({ limit: 4 });
    featured = data.slice(0, 4);
  } catch {
    // Si el catálogo no responde, la landing se muestra sin destacados.
  }

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

        <div className="hero__frames">
          {[
            { src: '/tryon-frames/redonda.svg', label: 'Redonda' },
            { src: '/tryon-frames/rectangular.svg', label: 'Rectangular' },
            { src: '/tryon-frames/cat-eye.svg', label: 'Cat-eye' },
          ].map((f) => (
            <Link className="hero__frame" href="/catalogo?type=FRAME" key={f.label}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.src} alt={`Montura ${f.label}`} />
              <span>{f.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="valueprops">
        {VALUE_PROPS.map((v) => (
          <div className="valueprop" key={v.title}>
            <span className="valueprop__icon" aria-hidden="true">
              {v.icon}
            </span>
            <div>
              <strong>{v.title}</strong>
              <p>{v.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="section">
        <h2 className="section__title">Explora por categoría</h2>
        <div className="categories">
          {CATEGORIES.map((c) => (
            <Link className="category" key={c.type} href={`/catalogo?type=${c.type}`}>
              <span className="category__emoji" aria-hidden="true">
                {c.emoji}
              </span>
              <span className="category__label">{c.label}</span>
              <span className="category__desc">{c.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">Destacados</h2>
            <Link className="section__link" href="/catalogo">
              Ver todo →
            </Link>
          </div>
          <div className="grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="section">
        <h2 className="section__title">Lo que dicen quienes ya ven(se) mejor</h2>
        <div className="testimonials">
          {TESTIMONIALS.map((t) => (
            <figure className="testimonial" key={t.name}>
              <blockquote>“{t.text}”</blockquote>
              <figcaption>
                <span className="testimonial__stars" aria-label="5 estrellas">
                  ★★★★★
                </span>
                {t.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="promo">
        <div className="promo__text">
          <h2>¿No sabes cuál te queda?</h2>
          <p>Enciende tu cámara y pruébate las monturas en tiempo real. Sin apps, sin filas.</p>
          <Link className="cta" href="/probador">
            Abrir el probador
          </Link>
        </div>
        <div className="promo__art" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="promo__frame" src="/tryon-frames/cat-eye.svg" alt="" />
        </div>
      </section>
    </main>
  );
}
