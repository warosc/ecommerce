# ADR-0010: Pagos y facturación (FEL Guatemala)

- **Estado:** PROPUESTO — **NO IMPLEMENTADO** (planificación de Fase 5)
- **Fase:** 5 (planificada)

> Este ADR documenta la **decisión de diseño** para dejar la fase lista de
> arrancar. **No hay código de pagos todavía** (por decisión: dejar listo pero
> no ponerlo aún).

## Contexto
Tras el checkout (Fase 4) el pedido queda en estado `PLACED`. Falta cobrar y
emitir factura electrónica (FEL, obligatoria en Guatemala).

## Decisión propuesta
Nuevo microservicio **`services/payments`** (NestJS, Clean Architecture, BD
propia `optimus_payments`), con:

- **Estados de pedido ampliados**: `PLACED → PAID → FULFILLED` (y `CANCELLED`).
  El enum `OrderStatus` de `orders` y de `@optimus/contracts` se extenderá.
- **Flujo de pago (saga por eventos)**:
  1. `orders.order.placed` → Payments crea un intento de pago.
  2. El cliente paga (redirección a pasarela / webhook de confirmación).
  3. Payments publica **`payments.payment.confirmed`** → Orders marca el pedido
     `PAID` y (si aplica) Inventario confirma la salida.
- **Pasarela**: adaptador tras un puerto `PaymentGateway`. Candidatos en
  Guatemala: Recurrente, NeoNet, Visanet/Credomatic; o Stripe para tarjeta.
- **Facturación FEL**: al confirmarse el pago, generar el DTE (Documento
  Tributario Electrónico) vía un **certificador FEL** autorizado por la SAT,
  tras un puerto `FelCertifier`. Guardar el UUID/serie del DTE en el pedido.
- **Auth servicio-a-servicio**: cuenta de servicio de Keycloak
  (client-credentials) para las llamadas Payments↔Orders/Inventory
  (finalmente extraer el auth común a `packages/nest-auth`).

## Alternativas consideradas
- **Pago síncrono en el checkout**: peor UX y acopla checkout a la pasarela;
  se prefiere saga asíncrona con webhooks.
- **Factura fuera del sistema (manual)**: no cumple bien el flujo FEL.

## Consecuencias (al implementar)
- Nueva infra: microservicio Payments + BD; posible cola de webhooks.
- Requisitos legales FEL: certificado, NIT emisor, ambiente de pruebas SAT.
- Seguridad reforzada: PCI si se tocan datos de tarjeta (preferir pasarela
  hosted/tokenización para no almacenarlos).

## Estado de preparación
- Contratos de eventos y estados: a extender cuando se implemente.
- Este documento + `docs/phases/phase-05/README.md` describen el plan; el resto
  del sistema (eventos, auth, patrón de microservicio) ya está listo para
  encajar Payments sin refactor mayor.
