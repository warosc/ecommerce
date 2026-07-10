import { Inject, Injectable } from '@nestjs/common';
import type { ProductCreatedEvent } from '@optimus/contracts';
import { Product } from '../../../domain/entities/product.entity';
import { DuplicateSkuError } from '../../../domain/errors/duplicate-sku.error';
import {
  PRODUCT_REPOSITORY,
  ProductRepository,
} from '../../../domain/repositories/product.repository';
import { Money } from '../../../domain/value-objects/money.vo';
import { Sku } from '../../../domain/value-objects/sku.vo';
import { PRODUCT_CREATED_ROUTING_KEY } from '../../events.constants';
import { EVENT_PUBLISHER, EventPublisher } from '../../ports/event-publisher';
import { PRODUCT_SEARCH, ProductSearchIndex } from '../../ports/product-search';
import { CreateProductCommand } from './create-product.command';

/**
 * Crea un producto: valida el SKU, garantiza su unicidad, persiste el agregado y
 * publica `catalog.product.created` para que Inventario cree su item de stock.
 * Lanza InvalidProductError (formato/invariantes) o DuplicateSkuError (SKU repetido).
 */
@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repository: ProductRepository,
    @Inject(EVENT_PUBLISHER) private readonly events: EventPublisher,
    @Inject(PRODUCT_SEARCH) private readonly search: ProductSearchIndex,
  ) {}

  async execute(command: CreateProductCommand): Promise<Product> {
    const sku = Sku.create(command.sku);

    const existing = await this.repository.findBySku(sku.value);
    if (existing) {
      throw new DuplicateSkuError(sku.value);
    }

    const price = Money.create(command.priceAmount, command.currency ?? 'GTQ');

    const product = Product.create({
      sku,
      name: command.name,
      description: command.description,
      type: command.type,
      brand: command.brand,
      price,
      compareAtAmount: command.compareAtAmount,
      stock: command.stock,
      images: command.images,
    });

    const created = await this.repository.create(product);

    const event: ProductCreatedEvent = {
      id: created.id,
      sku: created.sku.value,
      name: created.name,
      stock: created.stock,
    };
    await this.events.publish(PRODUCT_CREATED_ROUTING_KEY, event);

    // Indexado en el buscador best-effort: no debe romper el alta si OpenSearch falla.
    await this.search.index(created).catch(() => undefined);

    return created;
  }
}
