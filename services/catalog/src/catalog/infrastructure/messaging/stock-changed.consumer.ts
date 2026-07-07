import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import type { StockChangedEvent } from '@optimus/contracts';
import { MessagingService } from '../../../messaging/messaging.service';
import { STOCK_CHANGED_ROUTING_KEY } from '../../application/events.constants';
import { UpdateProductStockUseCase } from '../../application/use-cases/update-product-stock/update-product-stock.usecase';

/**
 * Consume `inventory.stock.changed` y actualiza el stock del producto (read-model)
 * para que la web muestre existencias al día.
 */
@Injectable()
export class StockChangedConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(StockChangedConsumer.name);

  constructor(
    private readonly messaging: MessagingService,
    private readonly updateStock: UpdateProductStockUseCase,
  ) {}

  onApplicationBootstrap(): void {
    this.messaging.registerSubscription({
      queue: 'catalog.stock-changed',
      routingKeys: [STOCK_CHANGED_ROUTING_KEY],
      handler: async (payload) => {
        const event = payload as StockChangedEvent;
        if (!event?.sku) return;
        await this.updateStock.execute(event.sku, event.onHand);
        this.logger.log(`Stock actualizado para SKU '${event.sku}' -> ${event.onHand}`);
      },
    });
  }
}
