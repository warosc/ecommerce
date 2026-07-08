# ADR-0016: CRM de clientes dirigido por eventos

- **Estado:** Aceptado
- **Fase:** 8

## Contexto
Se quiere conocer a los clientes: su historial de compra y segmentarlos (nuevos,
recurrentes, VIP, inactivos) para marketing/atención. La información de compra vive
en Pedidos, pero el CRM es un contexto propio.

## Decisión
Nuevo microservicio **`services/crm`** (NestJS, BD `optimus_crm`) que **construye
perfiles de cliente a partir de eventos**, sin acoplarse a Pedidos.

- **Fuente de datos por eventos**: consume `orders.order.placed`. Para ello el
  evento se **enriquece** con `customer`, `totalAmount`, `currency` y `channel`
  (Inventario, que solo lee `lines`, no se ve afectado).
- **Agregado `Customer`** (clave natural: **email**): acumula `totalOrders`,
  `totalSpentAmount`, `firstOrderAt`, `lastOrderAt`. `RecordOrderUseCase` crea el
  perfil con el primer pedido y lo acumula en los siguientes (idempotente por email).
- **Segmentos derivados** (no almacenados): `NUEVO` (1 pedido), `RECURRENTE` (≥3),
  `VIP` (gasto ≥ Q2,000), `INACTIVO` (>90 días sin comprar). Se calculan al leer.
- **API de solo lectura** (`GET /api/customers`, `/customers/:email`) protegida por
  rol; **UI Admin `/clientes`** con stats + segmentos.

## Alternativas consideradas
- **Consultar Pedidos bajo demanda**: acopla el CRM a Pedidos y no permite
  agregación histórica eficiente ni segmentación.
- **Meter clientes en Pedidos**: rompe el contexto acotado; el CRM tiene su propio
  ciclo (segmentación, campañas futuras).
- **CDC/replicación de BD**: excesivo para el MVP; los eventos ya existen.

## Consecuencias
- **Consistencia eventual**: el perfil se actualiza al procesar el evento.
- **Identidad por email**: las ventas POS de mostrador (email genérico) se agrupan
  en un cliente "mostrador"; capturar el email real en el POS mejoraría esto.
- **Enriquecer un evento compartido**: aditivo y retrocompatible (los consumidores
  existentes ignoran los campos nuevos).
- **Sin backfill histórico**: solo los pedidos nuevos construyen perfiles (los
  previos a esta fase no se reprocesan). Pendiente: campañas/segmentación activa.
