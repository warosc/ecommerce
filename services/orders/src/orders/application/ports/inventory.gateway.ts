export const INVENTORY_GATEWAY = Symbol('INVENTORY_GATEWAY');

/** Puerto hacia el servicio de Inventario (consulta de existencias por SKU). */
export interface InventoryGateway {
  /** onHand del SKU, o `null` si no hay item de inventario (no rastreado). */
  getOnHand(sku: string): Promise<number | null>;
}
