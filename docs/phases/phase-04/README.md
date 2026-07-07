# Fase 4 — Ecommerce / Pedidos (carrito en Redis)

## Alcance
Carrito de compra y pedidos, con **Redis** (carrito) como infra nueva. Las
imágenes reales (MinIO) se posponen a la Fase 4.5.

- `services/orders` (NestJS): carrito en Redis + pedidos en Postgres
  (`optimus_orders`). API:
  - `GET /api/cart/:cartId`, `POST /api/cart/:cartId/items`, `DELETE /api/cart/:cartId/items/:sku`
  - `POST /api/orders` (checkout), `GET /api/orders/:id`, `GET /api/orders` (admin)
- **Web**: botón "Añadir al carrito" en cada producto, página `/carrito` con
  checkout, y `/pedido/[id]` de confirmación. Todo vía **server actions** (sin CORS);
  el `cartId` va en una cookie httpOnly.
- **Checkout por eventos**: valida disponibilidad (lee Inventario), crea el pedido,
  publica `orders.order.placed` → Inventario descuenta (ISSUE) → `stock.changed`
  → Catálogo actualiza su stock.

## Flujo end-to-end
1. Usuario añade productos → carrito en Redis (precio tomado de Catálogo).
2. Checkout → Orders crea el pedido, vacía el carrito, publica `order.placed`.
3. Inventario consume → ISSUE por línea → publica `stock.changed`.
4. Catálogo consume → actualiza `stock` (visible en la web).

## Cómo verificar (por API)
```bash
CID=carrito-demo-1
# 1) Añadir al carrito (precio lo pone Catálogo)
curl -X POST http://localhost:3005/api/cart/$CID/items -H 'Content-Type: application/json' -d '{"sku":"FR-EVT-01","quantity":2}'
# 2) Ver carrito
curl http://localhost:3005/api/cart/$CID
# 3) Checkout -> 201 (crea pedido, publica order.placed)
curl -X POST http://localhost:3005/api/orders -H 'Content-Type: application/json' \
  -d "{\"cartId\":\"$CID\",\"customer\":{\"name\":\"Ana\",\"email\":\"ana@mail.com\"}}"
# 4) Tras ~1-2s el stock en Inventario y Catálogo baja según lo pedido
curl http://localhost:3003/api/inventory/FR-EVT-01
curl "http://localhost:3001/api/products?search=FR-EVT-01"
```
En navegador: `http://web.localhost/catalogo` → "Añadir al carrito" → `http://web.localhost/carrito` → confirmar.

## Criterios de aceptación — VERIFICADO ✅ (2026-07-07)
- [x] `docker compose up -d --build` levanta 11 servicios sanos (incl. redis + orders-api).
- [x] Añadir/ver/quitar del carrito (Redis) funciona; precio viene de Catálogo.
- [x] Checkout crea pedido (**201**); carrito vacío → **400**; email inválido → **400**;
      stock insuficiente → **409**; SKU inexistente al añadir → **404**.
- [x] Tras el checkout, Inventario descuenta y Catálogo refleja el nuevo stock (**20 → 17**).
- [x] `GET /api/orders` (lista): sin token **401**, vendedor **403**, admin **200**.
- [x] Tests orders: **22 unit + 7 e2e** en verde (cobertura núcleo 97/92/94/98).
- [x] Páginas web `/carrito` y `/pedido/[id]` responden 200 vía Traefik.

## Notas / limitaciones
- Validación de stock en checkout best-effort (no reserva atómica) → posible
  sobreventa en concurrencia alta; el descuento es asíncrono. Reserva síncrona
  con M2M queda para una iteración futura.
- Productos sembrados en Catálogo (vía seed) no tienen item de inventario, así
  que su checkout no se bloquea por stock (onHand no rastreado). Para ver el
  descuento, usar un producto creado por API (que sí genera inventario).
- Auth duplicada 3× → extraer a `packages/nest-auth`. MinIO/imágenes → Fase 4.5.
