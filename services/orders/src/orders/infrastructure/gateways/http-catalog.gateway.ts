import { Injectable, Logger } from '@nestjs/common';
import type { PaginatedResult, ProductDto } from '@optimus/contracts';
import { CatalogGateway, ProductSummary } from '../../application/ports/catalog.gateway';

/** Adaptador HTTP hacia el servicio de Catálogo (red interna Docker). */
@Injectable()
export class HttpCatalogGateway implements CatalogGateway {
  private readonly logger = new Logger(HttpCatalogGateway.name);
  private readonly base = process.env.CATALOG_API_INTERNAL ?? 'http://catalog-api:3001/api';

  async getProductBySku(sku: string): Promise<ProductSummary | null> {
    try {
      const res = await fetch(
        `${this.base}/products?search=${encodeURIComponent(sku)}&limit=100`,
      );
      if (!res.ok) return null;
      const body = (await res.json()) as PaginatedResult<ProductDto>;
      const match = body.data.find((p) => p.sku === sku);
      if (!match) return null;
      return {
        sku: match.sku,
        name: match.name,
        unitPriceAmount: match.price.amount,
        currency: match.price.currency,
        active: match.active,
      };
    } catch (err) {
      this.logger.error(`Error consultando Catálogo: ${(err as Error).message}`);
      return null;
    }
  }
}
