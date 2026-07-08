# Óptica Optimus — Optimus Engineering Kit

Plataforma **open source** para una óptica: e-commerce, punto de venta, inventario,
expediente clínico + agenda y CRM. Monorepo **100% dockerizado**, microservicios con
**Clean Architecture / DDD**, dirigido por eventos y preparado para Kubernetes.

> Proyecto por fases. Cada fase incluye código, tests (cobertura ≥90% en dominio +
> aplicación), Docker y documentación (ADR + doc de fase).

## Arquitectura

**Apps (Next.js 15):**
- `apps/web` — tienda pública: catálogo + búsqueda, **probador virtual AR**, carrito, checkout.
- `apps/admin` — panel (next-auth + Keycloak): productos, **POS**, pacientes, agenda, clientes.

**Microservicios (NestJS, una BD por servicio):**

| Servicio | Puerto | Responsabilidad |
|---|---|---|
| `catalog` | 3001 | Productos, imágenes (MinIO), **búsqueda (OpenSearch)** |
| `inventory` | 3003 | Existencias; consume eventos de catálogo/pedidos |
| `orders` | 3005 | Carrito (Redis), pedidos, checkout web y **POS** |
| `clinic` | 3007 | Pacientes (graduación **cifrada**) + agenda; auditoría |
| `crm` | 3009 | Perfiles de cliente por **eventos** + segmentación |

**Infra:** PostgreSQL · Keycloak (OIDC) · Traefik (gateway) · RabbitMQ (eventos,
exchange `optimus.events`) · Redis · MinIO (S3) · OpenSearch.

**Patrones:** puertos y adaptadores, inyección por token, `@optimus/contracts`
(paquete de tipos compartidos), dinero en centavos enteros, eventos de dominio.

## Cómo levantarlo

```bash
cp .env.example .env        # secretos de desarrollo (el .env real está gitignored)
docker compose up -d --build
```

Accesos (vía Traefik, hosts `*.localhost`):
- Tienda: http://web.localhost · Panel: http://admin.localhost · Auth: http://auth.localhost
- APIs directas: catalog `:3001`, inventory `:3003`, orders `:3005`, clinic `:3007`, crm `:3009`
- MinIO consola `:9001` · OpenSearch `:9200` · RabbitMQ `:15672`

Usuarios Keycloak (dev): `admin` / `admin123` (rol admin), `vendedor` / `vendedor123`.

## Estado del roadmap

| Fase | Estado |
|---|---|
| F1 Catálogo (slice vertical) | ✅ |
| F2 Keycloak + Admin + Traefik | ✅ |
| F3 Inventario + RabbitMQ | ✅ |
| F4 Carrito/Pedidos (Redis) | ✅ |
| F4.5 Imágenes MinIO · F4.6 Probador AR · F4.7 Recorte auto | ✅ |
| F5 Pagos/FEL | ⏸️ planificada (ADR-0010), sin implementar |
| F6 POS · F7 Clínica · F8 CRM · F9 Búsqueda OpenSearch | ✅ |
| F10 CI + hardening (ligera) | ✅ (observabilidad pesada pendiente) |
| F11 Kubernetes | ⏳ pendiente |

## Testing y CI

```bash
# por servicio (cliente Prisma compartido → generar antes de testear)
pnpm --filter @optimus/<svc> exec prisma generate
pnpm --filter @optimus/<svc> test:cov   # unit + cobertura ≥90%
pnpm --filter @optimus/<svc> test:e2e   # e2e herméticos (in-memory, sin BD)
```

CI en **GitHub Actions** (`.github/workflows/ci.yml`): typecheck + tests + build en
cada push/PR (un job por microservicio por el cliente Prisma compartido).

## Documentación

- **Decisiones** — `docs/adr/` (MADR, 0001–0017).
- **Fases** — `docs/phases/phase-*/README.md` (alcance, criterios, verificación).
- **Visión** — `docs/00_MASTER_PROMPT.md`.

## Notas de seguridad (dev)

Sin TLS por ahora (HTTP tras Traefik). El `.env` con secretos de desarrollo está
**gitignored**. En producción: TLS, gestor de secretos, rotación de la clave de
cifrado clínico (`CLINIC_ENCRYPTION_KEY`) y seguridad de OpenSearch/Keycloak.

## Licencia

Open source (pendiente de definir el archivo de licencia).
