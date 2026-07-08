import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import type { OrderPlacedEvent } from '@optimus/contracts';
import { MessagingService } from '../../../messaging/messaging.service';
import { ORDER_PLACED_ROUTING_KEY } from '../../application/events.constants';
import { RecordOrderUseCase } from '../../application/use-cases/record-order.usecase';

/**
 * Consume `orders.order.placed` y actualiza el perfil del cliente en el CRM
 * (historial de compra). Ignora pedidos sin email de cliente.
 */
@Injectable()
export class OrderPlacedConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(OrderPlacedConsumer.name);

  constructor(
    private readonly messaging: MessagingService,
    private readonly recordOrder: RecordOrderUseCase,
  ) {}

  onApplicationBootstrap(): void {
    this.messaging.registerSubscription({
      queue: 'crm.order-placed',
      routingKeys: [ORDER_PLACED_ROUTING_KEY],
      handler: async (payload) => {
        const event = payload as OrderPlacedEvent;
        const email = event?.customer?.email;
        if (!email) {
          this.logger.warn(`Pedido ${event?.orderId} sin email; se ignora en el CRM.`);
          return;
        }
        await this.recordOrder.execute({
          email,
          name: event.customer.name,
          phone: event.customer.phone ?? null,
          amount: event.totalAmount,
          currency: event.currency,
          at: new Date(),
        });
        this.logger.log(`Perfil actualizado: ${email} (pedido ${event.orderId})`);
      },
    });
  }
}
