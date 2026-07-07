# Fase 3 — Inventario + Eventos (RabbitMQ)

## Alcance
Nuevo microservicio **Inventario** integrado con **Catálogo** por eventos
asíncronos vía **RabbitMQ** (infra nueva de esta fase).

- `services/inventory` (NestJS, Clean Architecture): existencias por SKU
  (`InventoryItem`) + historial de `StockMovement`. BD propia `optimus_inventory`.
- API: `GET /api/inventory`, `GET /api/inventory/:sku`,
  `GET /api/inventory/:sku/movements`, `POST /api/inventory/:sku/movements`
  (protegido con rol `admin`, reutilizando Keycloak).
- Eventos (exchange topic `optimus.events`):
  - Catálogo publica `catalog.product.created` → Inventario crea el item.
  - Inventario publica `inventory.stock.changed` → Catálogo actualiza su
    `stock` (read-model para la web).

## Reglas de movimiento
- `RECEIPT`: suma al onHand · `ISSUE`: resta (no negativo, si no → 409) ·
  `ADJUSTMENT`: fija el onHand al valor dado.

## Componentes / archivos clave
- `services/inventory/src/inventory/**` — dominio (InventoryItem, StockMovement),
  aplicación (create-item, get, list, register-movement, list-movements), infra
  Prisma, HTTP, auth (copiada de catálogo).
- `services/*/src/messaging/messaging.service.ts` — cliente RabbitMQ (amqplib) con
  reconexión; implementa `EventPublisher`.
- `services/inventory/src/inventory/infrastructure/messaging/product-created.consumer.ts`
- `services/catalog/src/catalog/infrastructure/messaging/stock-changed.consumer.ts`
- `infra/postgres/init/01-init-databases.sql` — crea `optimus_inventory`.
- `docker-compose.yml` — servicios `rabbitmq`, `inventory-api`.

## Cómo verificar (por API, con token admin)
```bash
# token admin (ver Fase 2)
TOKEN=... # password grant a Keycloak (auth.localhost)

# 1) Crear producto (Catálogo) -> publica product.created
curl -X POST http://localhost:3001/api/products -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"sku":"FR-INV-01","name":"Prueba inventario","type":"FRAME","brand":"Optimus","priceAmount":50000,"stock":7}'

# 2) Inventario creó el item por el evento (esperar ~1s)
curl http://localhost:3003/api/inventory/FR-INV-01        # onHand: 7

# 3) Registrar entrada (movimiento) -> publica stock.changed
curl -X POST http://localhost:3003/api/inventory/FR-INV-01/movements \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"type":"RECEIPT","quantity":10}'                    # onHand: 17

# 4) Catálogo actualizó su stock por el evento (esperar ~1s)
curl "http://localhost:3001/api/products?search=FR-INV-01" # stock: 17
```
Panel RabbitMQ: `http://localhost:15672` (optimus / optimus_dev_password).

## Criterios de aceptación — VERIFICADO ✅ (2026-07-07)
- [x] `docker compose up -d --build` levanta 9 servicios sanos (incl. rabbitmq + inventory-api).
- [x] Crear producto → item en inventario con onHand=stock inicial (evento product.created).
- [x] Registrar movimiento: admin → **201**; sin token → **401**; vendedor → **403**.
- [x] ISSUE > stock → **409**; tipo inválido → **400**; SKU inexistente → **404**.
- [x] Tras `RECEIPT` en Inventario, el `stock` del producto en Catálogo se actualiza (evento stock.changed): 7 → 17.
- [x] Tests: catálogo **50 unit + 10 e2e**, inventario **27 unit + 7 e2e**, cobertura núcleo >90%.

> Nota (monorepo): en el **host**, catalog e inventory comparten `@prisma/client`;
> `prisma generate` de uno sobrescribe el cliente del otro. No afecta Docker (cada
> imagen genera el suyo) ni los tests (repos in-memory); el script `build` regenera
> antes de compilar. Al compilar en host, regenerar el cliente del servicio activo.

## Notas / limitaciones
- Sin outbox pattern (publicación no es atómica con el commit) ni DLQ; suficiente
  para MVP. Consumidores idempotentes.
- El módulo de auth está **duplicado** en catálogo e inventario; extraer a
  `packages/nest-auth` en una futura iteración.
- Keycloak sigue en `start-dev` (H2); reservas de stock llegan con Pedidos (Fase 4).
