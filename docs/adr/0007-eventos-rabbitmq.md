# ADR-0007: Integración por eventos con RabbitMQ

- **Estado:** Aceptado
- **Fase:** 3

## Contexto
Al añadir el microservicio de Inventario, Catálogo e Inventario deben mantenerse
consistentes sin acoplarse por llamadas síncronas. El stock es responsabilidad
del contexto Inventario (fuente de verdad), pero la web pública lee el catálogo.

## Decisión
Comunicación **asíncrona por eventos** con **RabbitMQ** (primer módulo que lo
requiere). Un **exchange `topic` durable `optimus.events`**; cada servicio
declara colas durables ligadas a sus routing keys. Cliente con `amqplib` y un
`MessagingService` (reconexión + reintentos) que implementa el puerto
`EventPublisher` del dominio y registra consumidores.

Flujo (ambos sentidos):

- Catálogo publica **`catalog.product.created`** al crear un producto →
  Inventario lo consume y crea (idempotente) su `InventoryItem` con el stock
  inicial.
- Inventario publica **`inventory.stock.changed`** al registrar un movimiento →
  Catálogo lo consume y actualiza el `stock` del producto (read-model
  denormalizado para que la web muestre existencias al día).

Cada servicio tiene su **propia base de datos** (`optimus_catalog`,
`optimus_inventory`) en la misma instancia Postgres.

## Alternativas consideradas
- **Llamadas HTTP síncronas** entre servicios: acoplan disponibilidad y latencia;
  descartadas para la sincronización de estado.
- **NestJS microservices (RMQ transport)**: orientado a RPC; se prefirió pub/sub
  con exchange topic para eventos de dominio desacoplados.
- **Stock solo en Inventario, la web lo consulta**: acoplaría web→inventario; se
  optó por read-model en Catálogo vía evento.

## Consecuencias
- Desacoplamiento: si Inventario está caído, Catálogo sigue sirviendo lecturas;
  los eventos se procesan al reconectar (colas durables, mensajes persistentes).
- Consistencia **eventual** del stock mostrado en la web.
- Idempotencia necesaria en los consumidores (create item, update stock).
- Pendiente: outbox pattern para atomicidad publicación↔commit, DLQ y reintentos
  con backoff, validación de `audience` en los tokens.
