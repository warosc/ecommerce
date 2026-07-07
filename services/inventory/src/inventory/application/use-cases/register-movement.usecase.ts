import { Inject, Injectable } from '@nestjs/common';
import type { StockChangedEvent } from '@optimus/contracts';
import { InventoryItem } from '../../domain/entities/inventory-item.entity';
import { InventoryItemNotFoundError } from '../../domain/errors';
import {
  INVENTORY_REPOSITORY,
  InventoryRepository,
} from '../../domain/repositories/inventory.repository';
import { MovementType } from '../../domain/value-objects/movement-type.vo';
import { STOCK_CHANGED_ROUTING_KEY } from '../events.constants';
import { EVENT_PUBLISHER, EventPublisher } from '../ports/event-publisher';

export interface RegisterMovementCommand {
  type: MovementType;
  quantity: number;
  reason?: string;
}

/**
 * Registra un movimiento de stock: aplica la regla de dominio, persiste item +
 * movimiento de forma atómica y publica `inventory.stock.changed` para que
 * Catálogo actualice su read-model de stock.
 */
@Injectable()
export class RegisterMovementUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepository,
    @Inject(EVENT_PUBLISHER) private readonly events: EventPublisher,
  ) {}

  async execute(sku: string, command: RegisterMovementCommand): Promise<InventoryItem> {
    const normalized = sku.trim().toUpperCase();
    const item = await this.repository.findBySku(normalized);
    if (!item) {
      throw new InventoryItemNotFoundError(normalized);
    }

    const movement = item.applyMovement(command.type, command.quantity, command.reason);
    await this.repository.saveMovement(item, movement);

    const event: StockChangedEvent = { sku: item.sku, onHand: item.onHand };
    await this.events.publish(STOCK_CHANGED_ROUTING_KEY, event);

    return item;
  }
}
