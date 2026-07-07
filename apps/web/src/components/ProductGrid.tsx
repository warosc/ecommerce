import type { ProductDto } from '@optimus/contracts';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products }: { products: ProductDto[] }) {
  if (products.length === 0) {
    return <p className="empty">No hay productos disponibles.</p>;
  }

  return (
    <div className="grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
