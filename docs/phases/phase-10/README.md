# Fase 10 — CI/CD + hardening (versión ligera)

> **Nota:** la Fase 10 completa del roadmap incluye observabilidad (OpenTelemetry +
> Prometheus + Grafana + Loki). Por decisión se **excluye la pila pesada de
> monitorización** por ahora (memoria del entorno). Esta entrega cubre la parte de
> **CI/DevSecOps + hardening**. Ver [ADR-0017](../../adr/0017-ci-hardening.md).

## Alcance
- **CI (GitHub Actions)**: typecheck + tests (unit/e2e) + build de todo el monorepo
  en cada push/PR, con un job aislado por microservicio (por el cliente Prisma
  compartido) + jobs de web y admin.
- **Hardening**: cierre ordenado (`enableShutdownHooks`) en los 5 servicios.

## Componentes / archivos clave
- `.github/workflows/ci.yml`
- `services/*/src/main.ts` (`app.enableShutdownHooks()`)

## Cómo verificar
- Cada push a `main` (o PR) dispara el workflow **CI** en GitHub Actions; todos los
  jobs (services x5, web, admin) deben quedar en verde.
- Localmente equivale a: por servicio `prisma generate && pnpm --filter <svc> lint
  test:cov test:e2e`; web/admin `tsc --noEmit` + `build`.

## Criterios de aceptación
- [ ] El workflow CI pasa en verde en GitHub Actions.
- [ ] Los servicios cierran limpiamente ante SIGTERM (sin conexiones colgadas).

## Pendiente (Fase 10 completa, futuro)
- Observabilidad: trazas OpenTelemetry, métricas (Prometheus) y logs centralizados
  (Loki) con dashboards (Grafana).
- Correlation IDs propagados entre servicios (observabilidad ligera, sin backend).
- Escaneo de seguridad/dependencias en CI (DevSecOps).
