import { Injectable, Logger } from '@nestjs/common';
import type { InventoryItemDto } from '@optimus/contracts';
import { InventoryGateway } from '../../application/ports/inventory.gateway';

/** Adaptador HTTP hacia el servicio de Inventario (red interna Docker). */
@Injectable()
export class HttpInventoryGateway implements InventoryGateway {
  private readonly logger = new Logger(HttpInventoryGateway.name);
  private readonly base = process.env.INVENTORY_API_INTERNAL ?? 'http://inventory-api:3003/api';

  async getOnHand(sku: string): Promise<number | null> {
    try {
      const res = await fetch(`${this.base}/inventory/${encodeURIComponent(sku)}`);
      if (res.status === 404) return null;
      if (!res.ok) return null;
      const body = (await res.json()) as InventoryItemDto;
      return body.onHand;
    } catch (err) {
      this.logger.error(`Error consultando Inventario: ${(err as Error).message}`);
      return null;
    }
  }
}
