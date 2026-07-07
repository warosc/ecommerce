export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');

/** Puerto de salida para publicar eventos de dominio (implementado por messaging). */
export interface EventPublisher {
  publish(routingKey: string, payload: unknown): Promise<void>;
}
