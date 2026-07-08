# Fase 8 — CRM (perfiles de cliente por eventos)

## Alcance
Perfiles de cliente construidos automáticamente a partir de los pedidos, con
segmentación. Ver [ADR-0016](../../adr/0016-crm-eventos.md).

- **`services/crm`** consume `orders.order.placed` (enriquecido con cliente +
  total) y agrega el historial de compra por cliente (clave: email).
- Segmentos derivados: NUEVO, RECURRENTE, VIP, INACTIVO.
- API de solo lectura `GET /api/customers` + UI Admin `/clientes`.

## Componentes / archivos clave
- `services/crm/src/crm/domain/entities/customer.entity.ts` (agregación + segmentos)
- `services/crm/src/crm/application/use-cases/record-order.usecase.ts`
- `services/crm/src/crm/infrastructure/messaging/order-placed.consumer.ts`
- `packages/contracts` — `OrderPlacedEvent` enriquecido + `CrmCustomerDto`
- `services/orders/.../place-order.usecase.ts` y `place-pos-order.usecase.ts`
  (publican el evento enriquecido)
- `apps/admin/src/app/clientes/page.tsx` + `lib/crm.ts`
- `docker-compose.yml` (`crm-api`), `.env` (`CRM_*`), init SQL (`optimus_crm`)

## Cómo verificar
1. Crear la BD si el volumen ya existía: `optimus_crm`. Luego `docker compose up -d --build`.
2. Generar un pedido (web checkout o POS) para un cliente con email.
3. Consultar el CRM (token admin/vendedor):
   ```bash
   curl http://localhost:3009/api/customers -H "Authorization: Bearer $TOKEN"
   # el cliente aparece con totalOrders, totalSpentAmount y segmentos
   ```
4. Repetir pedidos del mismo email: `totalOrders`/`totalSpentAmount` suben; con 3+
   aparece `RECURRENTE`; con gasto ≥ Q2,000, `VIP`.
5. **Admin**: http://admin.localhost → **Clientes**.

## Criterios de aceptación
- [ ] Un pedido confirmado crea/actualiza el perfil del cliente en el CRM (evento).
- [ ] `GET /api/customers` devuelve stats + segmentos; sin token → 401.
- [ ] Los segmentos se calculan correctamente (NUEVO/RECURRENTE/VIP/INACTIVO).
- [ ] La UI Admin `/clientes` lista los perfiles.
- [ ] Tests CRM en verde (unit+e2e, cobertura ≥90%).

## Notas
- Identidad por email; las ventas POS de mostrador se agrupan bajo el email
  genérico (capturar email real en POS lo mejoraría).
- Sin backfill de pedidos previos a esta fase; solo los nuevos construyen perfiles.
- Futuro: campañas y segmentación activa (envíos), scoring RFM.
