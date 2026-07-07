import { Product } from '../../src/catalog/domain/entities/product.entity';
import {
  FindManyResult,
  ListProductsFilter,
  ProductRepository,
} from '../../src/catalog/domain/repositories/product.repository';

/**
 * Implementación en memoria del puerto ProductRepository, usada en tests
 * unitarios y e2e (sustituye a Prisma vía overrideProvider). Determinista.
 */
export class InMemoryProductRepository implements ProductRepository {
  private readonly products: Product[] = [];

  constructor(seed: Product[] = []) {
    this.products.push(...seed);
  }

  async findMany(filter: ListProductsFilter): Promise<FindManyResult> {
    let items = this.products;

    if (filter.type) {
      items = items.filter((p) => p.type === filter.type);
    }
    if (filter.search) {
      const needle = filter.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.sku.value.toLowerCase().includes(needle),
      );
    }

    const total = items.length;
    const start = (filter.page - 1) * filter.limit;
    const paged = items.slice(start, start + filter.limit);

    return { items: paged, total };
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find((p) => p.id === id) ?? null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const needle = sku.toUpperCase();
    return this.products.find((p) => p.sku.value === needle) ?? null;
  }

  async create(product: Product): Promise<Product> {
    this.products.push(product);
    return product;
  }

  async updateStockBySku(sku: string, stock: number): Promise<void> {
    const needle = sku.toUpperCase();
    const index = this.products.findIndex((p) => p.sku.value === needle);
    if (index < 0) return;
    const p = this.products[index];
    this.products[index] = Product.fromPersistence({
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      type: p.type,
      brand: p.brand,
      price: p.price,
      stock,
      images: p.images,
      active: p.active,
      createdAt: p.createdAt,
      updatedAt: new Date(),
    });
  }

  async appendImage(id: string, url: string): Promise<Product | null> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index < 0) return null;
    const p = this.products[index];
    this.products[index] = Product.fromPersistence({
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      type: p.type,
      brand: p.brand,
      price: p.price,
      stock: p.stock,
      images: [...p.images, url],
      active: p.active,
      createdAt: p.createdAt,
      updatedAt: new Date(),
    });
    return this.products[index];
  }
}
