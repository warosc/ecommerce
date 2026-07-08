import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';
import {
  ProductSearchIndex,
  SearchProductsParams,
  SearchProductsResult,
} from '../../application/ports/product-search';
import { Product } from '../../domain/entities/product.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { ProductType } from '../../domain/value-objects/product-type.vo';
import { Sku } from '../../domain/value-objects/sku.vo';

interface ProductDoc {
  id: string;
  sku: string;
  name: string;
  description: string;
  type: string;
  brand: string;
  priceAmount: number;
  currency: string;
  stock: number;
  images: string[];
  tryOnImageUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SearchBody {
  hits: {
    total: number | { value: number };
    hits: Array<{ _source: ProductDoc }>;
  };
}

/** Índice de búsqueda de productos sobre OpenSearch. */
@Injectable()
export class OpenSearchProductIndex implements ProductSearchIndex, OnModuleInit {
  private readonly logger = new Logger(OpenSearchProductIndex.name);
  private readonly indexName = process.env.OPENSEARCH_INDEX ?? 'products';
  private readonly client = new Client({
    node: process.env.OPENSEARCH_NODE ?? 'http://opensearch:9200',
  });

  async onModuleInit(): Promise<void> {
    await this.ensureIndex();
  }

  private async ensureIndex(attempt = 1): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: this.indexName });
      if (!exists.body) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                sku: { type: 'keyword' },
                name: { type: 'text' },
                brand: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                description: { type: 'text' },
                type: { type: 'keyword' },
                priceAmount: { type: 'integer' },
                currency: { type: 'keyword' },
                stock: { type: 'integer' },
                active: { type: 'boolean' },
                images: { type: 'keyword' },
                tryOnImageUrl: { type: 'keyword' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
              },
            },
          },
        });
        this.logger.log(`Índice '${this.indexName}' creado`);
      }
    } catch (err) {
      if (attempt >= 10) {
        this.logger.error(
          `OpenSearch no disponible tras ${attempt} intentos: ${(err as Error).message}`,
        );
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await this.ensureIndex(attempt + 1);
    }
  }

  private toDoc(p: Product): ProductDoc {
    return {
      id: p.id,
      sku: p.sku.value,
      name: p.name,
      description: p.description,
      type: p.type,
      brand: p.brand,
      priceAmount: p.price.amount,
      currency: p.price.currency,
      stock: p.stock,
      images: p.images,
      tryOnImageUrl: p.tryOnImageUrl,
      active: p.active,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  private fromDoc(d: ProductDoc): Product {
    return Product.fromPersistence({
      id: d.id,
      sku: Sku.create(d.sku),
      name: d.name,
      description: d.description,
      type: d.type as ProductType,
      brand: d.brand,
      price: Money.create(d.priceAmount, d.currency),
      stock: d.stock,
      images: d.images,
      tryOnImageUrl: d.tryOnImageUrl ?? null,
      active: d.active,
      createdAt: new Date(d.createdAt),
      updatedAt: new Date(d.updatedAt),
    });
  }

  async index(product: Product): Promise<void> {
    await this.client.index({
      index: this.indexName,
      id: product.id,
      body: this.toDoc(product),
      refresh: true,
    });
  }

  async indexMany(products: Product[]): Promise<void> {
    if (products.length === 0) return;
    const body = products.flatMap((p) => [
      { index: { _index: this.indexName, _id: p.id } },
      this.toDoc(p),
    ]);
    await this.client.bulk({ body, refresh: true });
  }

  async search(params: SearchProductsParams): Promise<SearchProductsResult> {
    const filter: unknown[] = [];
    if (params.type) filter.push({ term: { type: params.type } });
    const must = params.q
      ? [
          {
            multi_match: {
              query: params.q,
              fields: ['name^3', 'brand^2', 'sku', 'description'],
              fuzziness: 'AUTO',
            },
          },
        ]
      : [{ match_all: {} }];

    const res = await this.client.search({
      index: this.indexName,
      body: {
        from: (params.page - 1) * params.limit,
        size: params.limit,
        query: { bool: { must, filter } },
      },
    });

    const hits = (res.body as SearchBody).hits;
    const total = typeof hits.total === 'number' ? hits.total : hits.total.value;
    return { items: hits.hits.map((h) => this.fromDoc(h._source)), total };
  }
}
