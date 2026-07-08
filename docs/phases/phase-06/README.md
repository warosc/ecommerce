# Fase 6 — POS (punto de venta en tienda)

## Alcance
Vender presencialmente reutilizando Catálogo + Inventario, con descuento de stock
por eventos (igual que el checkout web). Ver [ADR-0013](../../adr/0013-pos-venta-tienda.md).

- **Pedidos**: `Order` con `channel` (WEB/POS) y `paymentMethod` (CASH/CARD).
  Endpoint `POST /api/orders/pos` (roles admin/vendedor): resuelve precios en
  Catálogo, valida Inventario, crea la venta y publica `orders.order.placed`.
- **Admin `/pos`**: buscador de productos, carrito de mostrador, cobro
  (efectivo/tarjeta) y ticket de venta.

## Componentes / archivos clave
- `services/orders/.../place-pos-order.usecase.ts` — venta POS.
- `services/orders/.../orders.controller.ts` — `POST /orders/pos`.
- `services/orders/prisma/migrations/…_add_pos_channel_payment` — enums + columnas.
- `apps/admin/src/app/pos/page.tsx` + `components/PosTerminal.tsx` — terminal.
- `apps/admin/src/app/actions.ts` — `placePosSaleAction`.
- `docker-compose.yml` — `ORDERS_API_INTERNAL` en el servicio admin.

## Cómo verificar
1. `docker compose up -d --build` (orders y admin actualizados; migración aplicada).
2. **http://admin.localhost → Punto de venta** (login como `admin` o `vendedor`).
3. Busca productos, añádelos, elige Efectivo/Tarjeta y **Cobrar** → sale el ticket.
4. Comprueba el descuento de stock: el `onHand` del SKU baja en Inventario
   (`GET http://localhost:3003/api/inventory/:sku`) tras la venta.
5. Por API (token de `admin`/`vendedor`):
   ```bash
   curl -X POST http://localhost:3005/api/orders/pos -H "Authorization: Bearer $TOKEN" \
     -H 'Content-Type: application/json' \
     -d '{"lines":[{"sku":"FR-CLASSIC-01","quantity":1}],"paymentMethod":"CASH"}'  # 201, channel POS
   ```

## Criterios de aceptación
- [ ] `POST /api/orders/pos` (admin/vendedor) → 201 con `channel:"POS"`, método de
      pago y total calculado desde Catálogo; publica `order.placed`.
- [ ] Sin rol → 401/403; método inválido / sin líneas → 400; SKU inexistente → 404;
      stock insuficiente → 409.
- [ ] La venta descuenta stock en Inventario (vía evento).
- [ ] `/pos` en el Admin permite buscar, armar carrito, cobrar y ver el ticket.
- [ ] Tests de pedidos en verde (unit+e2e, cobertura ≥90%).

## Notas
- El pago se **registra** (efectivo/tarjeta); el cobro real con pasarela y la
  factura FEL son la Fase 5 (aún no implementada). El ticket es interno.
- Cliente de mostrador por defecto; registrar cliente concreto queda para más
  adelante (requiere relajar el email obligatorio o capturarlo en el POS).
