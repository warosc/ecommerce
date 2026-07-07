import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import type { ProductCreatedEvent } from '@optimus/contracts';
import { MessagingService } from '../../../messaging/messaging.service';
import { PRODUCT_CREATED_ROUTING_KEY } from '../../application/events.constants';
import { CreateInventoryItemUseCase } from '../../application/use-cases/create-inventory-item.usecase';

/**
 * Consume `catalog.product.created` y crea (idempotente) el item de inventario
 * con el stock inicial del producto.
 */
@Injectable()
export class ProductCreatedConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProductCreatedConsumer.name);

  constructor(
    private readonly messaging: MessagingService,
    private readonly createItem: CreateInventoryItemUseCase,
  ) {}

  onApplicationBootstrap(): void {
    this.messaging.registerSubscription({
      queue: 'inventory.product-created',
      routingKeys: [PRODUCT_CREATED_ROUTING_KEY],
      handler: async (payload) => {
        const event = payload as ProductCreatedEvent;
        if (!event?.sku) return;
        await this.createItem.execute(event.sku, event.stock ?? 0);
        this.logger.log(`Item de inventario creado para SKU '${event.sku}' (onHand=${event.stock ?? 0})`);
      },
    });
  }
}
