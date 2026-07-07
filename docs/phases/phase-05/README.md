# Fase 5 — Pagos y Facturación (FEL) · PLANIFICADA (no implementada)

> **Estado: PLANIFICADA — sin código.** Por decisión, se deja **lista para
> arrancar** (diseño y contratos definidos) pero **no se implementa ni despliega
> todavía**. Ver [ADR-0010](../../adr/0010-pagos-facturacion.md).

## Objetivo (cuando se active)
Cobrar el pedido y emitir factura electrónica (FEL Guatemala), llevando el
pedido de `PLACED` a `PAID`.

## Diseño previsto
- Nuevo `services/payments` (NestJS, BD `optimus_payments`).
- Estados: `PLACED → PAID → FULFILLED` / `CANCELLED` (extender `OrderStatus`).
- Saga por eventos:
  - `orders.order.placed` → Payments crea intento de pago.
  - Confirmación de pasarela (webhook) → `payments.payment.confirmed`.
  - Orders consume → pedido `PAID`.
- Puertos: `PaymentGateway` (Recurrente/NeoNet/Visanet/Stripe) y `FelCertifier`
  (certificador SAT). Auth M2M con Keycloak client-credentials.

## Qué ya está listo para encajarlo
- Arquitectura de eventos (exchange `optimus.events`) y patrón de microservicio
  reutilizables.
- Keycloak para M2M (falta el client de servicio).
- Orders con estado y modelo de líneas.

## Pasos para arrancar la fase (checklist futuro)
- [ ] Extender `OrderStatus` en `@optimus/contracts`, `orders` e `inventory`.
- [ ] Crear `services/payments` (dominio pago/intento, saga, webhooks).
- [ ] Integrar pasarela (sandbox) tras `PaymentGateway`.
- [ ] Integrar certificador FEL (sandbox SAT) tras `FelCertifier`.
- [ ] Cuenta de servicio Keycloak + (idealmente) extraer `packages/nest-auth`.
- [ ] Tests, Docker, doc y verificación end-to-end.
