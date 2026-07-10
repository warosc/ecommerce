import type { ProductDto, ProductType } from '@optimus/contracts';
import Link from 'next/link';
import { AddToCartButton } from '@/components/AddToCartButton';
import { formatPrice } from '@/lib/format';

const TYPE_LABELS: Record<ProductType, string> = {
  FRAME: 'Montura',
  LENS: 'Lente',
  ACCESSORY: 'Accesorio',
};

export function ProductCard({ product }: { product: ProductDto }) {
  const inStock = product.stock > 0;
  const hasDiscount =
    product.compareAtAmount != null && product.compareAtAmount > product.price.amount;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price.amount / (product.compareAtAmount as number)) * 100)
    : 0;

  return (
    <article className="card">
      <Link className="card__media" href={`/producto/${product.id}`} aria-label={product.name}>
        {hasDiscount ? <span className="card__discount">−{discountPct}%</span> : null}
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="card__img" src={product.images[0]} alt={product.name} />
        ) : (
          <div className="card__img card__img--placeholder" aria-hidden="true" />
        )}
      </Link>
      <div className="card__body">
        <span className="card__type">{TYPE_LABELS[product.type]}</span>
        <h3 className="card__name">
          <Link href={`/producto/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="card__brand">{product.brand}</p>
        <div className="card__footer">
          <span className="card__pricegroup">
            <span className="card__price">
              {formatPrice(product.price.amount, product.price.currency)}
            </span>
            {hasDiscount ? (
              <span className="card__compare">
                {formatPrice(product.compareAtAmount as number, product.price.currency)}
              </span>
            ) : null}
          </span>
          <span className={`badge ${inStock ? 'badge--in' : 'badge--out'}`}>
            {inStock ? `Stock: ${product.stock}` : 'Agotado'}
          </span>
        </div>
        {product.active ? <AddToCartButton sku={product.sku} /> : null}
        {product.tryOnImageUrl ? (
          <Link className="card__tryon" href={`/probador?frame=${product.id}`}>
            🕶 Probar
          </Link>
        ) : null}
      </div>
    </article>
  );
}
