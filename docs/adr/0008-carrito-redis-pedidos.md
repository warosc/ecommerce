# ADR-0008: Carrito en Redis y pedidos con checkout por eventos

- **Estado:** Aceptado
- **Fase:** 4

## Contexto
La Fase 4 añade ecommerce: carrito de compra y pedidos. El carrito es estado
efímero de sesión (alta frecuencia de lectura/escritura, no relacional); el
pedido es un registro transaccional que debe persistir.

## Decisión
Nuevo microservicio **`services/orders`** (Clean Architecture):

- **Carrito en Redis** (`ioredis`), clave `cart:{cartId}` con TTL de 7 días.
  El carrito es un agregado de dominio serializado; la web gestiona el `cartId`
  en una cookie httpOnly.
- **Pedidos en PostgreSQL** (BD propia `optimus_orders`, Prisma).
- **Precio autoritativo**: al añadir al carrito, Orders consulta Catálogo (HTTP
  interno) para obtener nombre y precio — el cliente no fija el precio.
- **Checkout por eventos** (decisión del usuario): el checkout valida
  disponibilidad leyendo Inventario (GET), crea el pedido y publica
  **`orders.order.placed`**. Inventario lo consume y aplica un movimiento
  **ISSUE** por línea (descuenta stock), que a su vez publica `stock.changed` y
  Catálogo actualiza su read-model. Consistencia **eventual**.
- **Integración web sin CORS**: la web opera el carrito/checkout mediante
  **server actions** que llaman a Orders por la red interna; el navegador solo
  habla con `web.localhost`.

## Alternativas consideradas
- **Carrito en Postgres**: innecesariamente relacional/pesado para estado efímero.
- **Reserva síncrona (M2M con Keycloak client-credentials)**: evita sobreventa
  pero añade auth servicio-a-servicio y un campo `reserved`. Pospuesta.

## Consecuencias
- Redis como nueva infra (carrito/caché; reutilizable para sesiones/caché).
- **Limitación conocida**: la validación de stock en checkout es best-effort
  (lectura), no una reserva atómica → posible sobreventa en concurrencia alta.
  El descuento real es asíncrono. Aceptable para MVP; documentado.
- Módulo de auth **duplicado** por tercera vez (catalog/inventory/orders) →
  deuda: extraer a `packages/nest-auth`.
- Sin pasarela de pago aún (Fase 5) ni imágenes reales (MinIO, Fase 4.5).
