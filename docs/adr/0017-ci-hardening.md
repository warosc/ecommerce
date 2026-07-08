# ADR-0017: Integración continua (CI) y hardening ligero

- **Estado:** Aceptado
- **Fase:** 10 (versión ligera)

## Contexto
Con 5 microservicios + 2 apps conviene proteger el trabajo con CI. La Fase 10 del
roadmap incluía observabilidad completa (OpenTelemetry + Prometheus + Grafana +
Loki), pero **por decisión se excluye la pila pesada de monitorización** (coste de
memoria en el entorno de desarrollo). Se hace la parte **DevSecOps/CI + hardening**.

## Decisión
- **CI con GitHub Actions** (`.github/workflows/ci.yml`):
  - **Un job por microservicio** (matriz: catalog, inventory, orders, clinic, crm).
    Motivo: todos comparten `@prisma/client`, así que **no** pueden generar su
    cliente a la vez en el mismo runner; aislarlos en jobs separados evita que el
    `prisma generate` de uno pise al de otro. Cada job: `prisma generate` →
    typecheck → `test:cov` (≥90%) → `test:e2e` (herméticos, in-memory, sin BD).
  - Jobs **web** y **admin**: typecheck + tests + `next build`.
- **Hardening ligero** en los servicios: `app.enableShutdownHooks()` para cierre
  ordenado (Prisma `$disconnect`, RabbitMQ `close` en `OnModuleDestroy`) al recibir
  SIGTERM.

## Alternativas consideradas
- **`turbo run test` global en un job**: falla por el cliente Prisma compartido
  (un `generate` sobrescribe a otro). La matriz por servicio lo evita.
- **Observabilidad completa (Prometheus/Grafana/Loki + OTel)**: excluida ahora por
  memoria; el diseño queda pendiente para producción (Fase 10 completa).
- **Levantar Postgres/RabbitMQ en CI**: innecesario; los e2e son herméticos.

## Consecuencias
- Cada push/PR valida typecheck + tests + build de todo el monorepo.
- Cierre ordenado de los servicios (menos conexiones colgadas al reiniciar).
- **Pendiente (Fase 10 completa)**: trazas distribuidas (OTel), métricas y logs
  centralizados, y escaneo de seguridad en CI. Los correlation IDs entre servicios
  quedan como siguiente paso de observabilidad ligera.
