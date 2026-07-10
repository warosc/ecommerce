import type { Metadata } from 'next';
import type { ProductType } from '@optimus/contracts';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddToCartButton } from '@/components/AddToCartButton';
import { ProductGallery } from '@/components/ProductGallery';
import { getProduct } from '@/lib/api';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

const TYPE_LABELS: Record<ProductType, string> = {
  FRAME: 'Montura',
  LENS: 'Lente',
  ACCESSORY: 'Accesorio',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: 'Producto no encontrado · Óptica Optimus' };
  const description =
    product.description || `${product.brand} — ${TYPE_LABELS[product.type]} en Óptica Optimus.`;
  return {
    title: `${product.name} · Óptica Optimus`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.images.length ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const inStock = product.stock > 0;
  const hasDiscount =
    product.compareAtAmount != null && product.compareAtAmount > product.price.amount;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price.amount / (product.compareAtAmount as number)) * 100)
    : 0;
  // Si no hay fotos de catálogo, muestra la montura del probador (transparente).
  const galleryImages =
    product.images.length > 0
      ? product.images
      : product.tryOnImageUrl
        ? [product.tryOnImageUrl]
        : [];
  const galleryContain = product.images.length === 0 && Boolean(product.tryOnImageUrl);

  return (
    <main className="container">
      <nav className="crumbs">
        <Link href="/">Inicio</Link> · <Link href="/catalogo">Catálogo</Link> · {product.name}
      </nav>

      <div className="pdp">
        <ProductGallery images={galleryImages} alt={product.name} contain={galleryContain} />

        <div className="pdp__info">
          <span className="card__type">{TYPE_LABELS[product.type]}</span>
          <h1 className="pdp__title">{product.name}</h1>
          <p className="pdp__brand">{product.brand}</p>

          <div className="pdp__pricerow">
            <span className="pdp__price">
              {formatPrice(product.price.amount, product.price.currency)}
            </span>
            {hasDiscount ? (
              <>
                <span className="pdp__compare">
                  {formatPrice(product.compareAtAmount as number, product.price.currency)}
                </span>
                <span className="pdp__discount">−{discountPct}%</span>
              </>
            ) : null}
            <span className={`badge ${inStock ? 'badge--in' : 'badge--out'}`}>
              {inStock ? `Stock: ${product.stock}` : 'Agotado'}
            </span>
          </div>

          {product.description ? (
            <p className="pdp__desc">{product.description}</p>
          ) : null}

          <div className="pdp__actions">
            {product.active ? <AddToCartButton sku={product.sku} /> : null}
            {product.tryOnImageUrl ? (
              <Link className="cta cta--ghost" href={`/probador?frame=${product.id}`}>
                🕶 Probar en el probador
              </Link>
            ) : null}
          </div>

          <ul className="trust">
            <li>🚚 Envío a domicilio</li>
            <li>🛡️ Garantía de 1 año</li>
            <li>↩️ 30 días de devolución</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
