import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import type { OrderPlacedEvent } from '@optimus/contracts';
import { MessagingService } from '../../../messaging/messaging.service';
import { ORDER_PLACED_ROUTING_KEY } from '../../application/events.constants';
import { RegisterMovementUseCase } from '../../application/use-cases/register-movement.usecase';

/**
 * Consume `orders.order.placed` y descuenta el stock de cada línea con un
 * movimiento ISSUE (best-effort: registra un aviso si falta stock o el item no
 * existe). Cada ISSUE publica a su vez `inventory.stock.changed`.
 */
@Injectable()
export class OrderPlacedConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(OrderPlacedConsumer.name);

  constructor(
    private readonly messaging: MessagingService,
    private readonly registerMovement: RegisterMovementUseCase,
  ) {}

  onApplicationBootstrap(): void {
    this.messaging.registerSubscription({
      queue: 'inventory.order-placed',
      routingKeys: [ORDER_PLACED_ROUTING_KEY],
      handler: async (payload) => {
        const event = payload as OrderPlacedEvent;
        if (!event?.lines?.length) return;
        for (const line of event.lines) {
          try {
            await this.registerMovement.execute(line.sku, {
              type: 'ISSUE',
              quantity: line.quantity,
              reason: `Pedido ${event.orderId}`,
            });
          } catch (err) {
            this.logger.warn(
              `No se pudo descontar ${line.sku} x${line.quantity} (pedido ${event.orderId}): ${(err as Error).message}`,
            );
          }
        }
      },
    });
  }
}
