# ADR-0013: POS (punto de venta en tienda) sobre el servicio de Pedidos

- **Estado:** Aceptado
- **Fase:** 6

## Contexto
La óptica también vende **presencialmente**. Se quiere un punto de venta (POS) que
reutilice Catálogo e Inventario y registre la venta con su método de pago,
descontando stock, sin duplicar el modelo de pedidos.

## Decisión
El POS es una **venta registrada en el servicio de Pedidos** (no un servicio
nuevo), distinguida por un **canal**.

- **Modelo**: `Order` gana `channel` (`WEB` | `POS`) y `paymentMethod`
  (`CASH` | `CARD`, nulo en web). Migración Prisma con enums.
- **Endpoint**: `POST /api/orders/pos` (protegido, roles **admin** o **vendedor**).
  Recibe líneas `{sku, quantity}` + método de pago; el backend resuelve nombre y
  precio en Catálogo (el cliente no fija precios) y valida disponibilidad en
  Inventario.
- **Descuento de stock**: publica el mismo evento `orders.order.placed`; Inventario
  lo consume y descuenta (consistencia eventual), **igual que el checkout web**
  (coherente con [ADR-0007] de decremento asíncrono).
- **Cliente**: opcional. En venta de mostrador se usa un cliente genérico
  ("Cliente de mostrador").
- **UI**: pantalla **`/pos`** en el Admin (Next.js): búsqueda de productos, carrito
  de mostrador, elección de pago y ticket de la venta. Reenvía el Bearer del
  vendedor por una server action.

## Alternativas consideradas
- **Servicio `pos` independiente**: más infra y duplicación; la venta ES un pedido,
  así que encaja en Pedidos con un discriminador de canal.
- **Decremento de stock síncrono en el POS**: se mantuvo el patrón asíncrono por
  eventos ya adoptado (menor acoplamiento; ventana de carrera aceptable en MVP).
- **Cobro real de tarjeta ahora**: es la Fase 5 (pasarela/FEL). El POS solo
  **registra** el método de pago; el cobro con pasarela llega después.

## Consecuencias
- Pedidos WEB y POS comparten modelo y listado (`channel` los distingue).
- El pago POS se registra pero **no** se procesa por pasarela ni emite FEL todavía
  (Fase 5). El ticket es interno, no una factura fiscal.
- Reutilización total del flujo de eventos y de los gateways Catálogo/Inventario.
