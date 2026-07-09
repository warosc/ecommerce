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

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const inStock = product.stock > 0;

  return (
    <main className="container">
      <nav className="crumbs">
        <Link href="/">Inicio</Link> · <Link href="/catalogo">Catálogo</Link> · {product.name}
      </nav>

      <div className="pdp">
        <ProductGallery images={product.images} alt={product.name} />

        <div className="pdp__info">
          <span className="card__type">{TYPE_LABELS[product.type]}</span>
          <h1 className="pdp__title">{product.name}</h1>
          <p className="pdp__brand">{product.brand}</p>

          <div className="pdp__pricerow">
            <span className="pdp__price">
              {formatPrice(product.price.amount, product.price.currency)}
            </span>
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
        </div>
      </div>
    </main>
  );
}
