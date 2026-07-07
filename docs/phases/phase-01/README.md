# Fase 1 — Infra + Slice Vertical de Catálogo

## Alcance
Primer incremento funcional de la plataforma Optimus: un flujo de punta a punta
del módulo **Catálogo** más la infraestructura mínima, todo levantable con
`docker compose up`.

Stack de esta fase (MVP pragmático): **Next.js + NestJS + PostgreSQL + Docker**.
Keycloak, Redis, RabbitMQ, MinIO, OpenSearch y Kubernetes se incorporan en fases
posteriores (ver `docs/24_ROADMAP` / plan).

## Componentes entregados
- **Monorepo** pnpm + Turborepo (`apps/`, `services/`, `packages/`).
- **`packages/contracts`** — tipos de API compartidos (solo tipos).
- **`services/catalog`** — microservicio NestJS con Clean Architecture / DDD:
  - Dominio: entidad `Product`, VOs `Sku`/`Money`/`ProductType`, puerto
    `ProductRepository`, errores de dominio.
  - Aplicación: casos de uso `ListProducts`, `GetProduct`, `CreateProduct`.
  - Infraestructura: Prisma (schema, repositorio, mapper), migración y seed.
  - HTTP: `GET /api/products`, `GET /api/products/:id`, `POST /api/products`,
    `GET /api/health`.
- **`apps/web`** — Next.js (App Router): landing `/` y catálogo `/catalogo`
  (Server Component que consume la API).
- **Docker**: Dockerfiles multi-stage + `docker-compose.yml` (postgres +
  catalog-api + web).
- **ADRs** 0001–0004 y este documento de fase.

## Criterios de aceptación
- [ ] `docker compose up --build` deja los tres servicios sanos.
- [ ] `GET http://localhost:3001/api/health` → 200.
- [ ] `GET http://localhost:3001/api/products` → lista sembrada (10 productos).
- [ ] `http://localhost:3000/catalogo` muestra las tarjetas de producto.
- [ ] `POST /api/products` válido → 201; inválido → 400; SKU duplicado → 409.
- [ ] Tests unit + e2e del catálogo en verde; cobertura del núcleo
      (dominio + aplicación) ≥ 90%.
- [ ] Tests de la web en verde; cobertura de `components` + `lib` ≥ 90%.

## Cómo verificar (local)

```bash
# 1. Dependencias
corepack prepare pnpm@9.15.0 --activate
pnpm install

# 2. Tests del núcleo (no requieren BD)
pnpm --filter @optimus/catalog test           # unit + cobertura
pnpm --filter @optimus/web test               # vitest

# 3. Migración inicial (requiere Postgres). Levantar solo la BD:
cp .env.example .env
docker compose up -d postgres
# Con DATABASE_URL apuntando a localhost:
DATABASE_URL="postgresql://optimus:optimus_dev_password@localhost:5432/optimus_catalog?schema=public" \
  pnpm --filter @optimus/catalog prisma migrate dev --name init

# 4. e2e del catálogo (sin BD: usa repo in-memory)
pnpm --filter @optimus/catalog test:e2e

# 5. Todo junto
docker compose up --build
# Abrir http://localhost:3000/catalogo
```

## Checklist de fase (Definition of Done)
- [ ] Código
- [ ] Tests (>90% en el núcleo)
- [ ] Docker (`docker compose up` funcional)
- [ ] Documentación (ADRs + este README)
- [ ] Seguridad (validación de entrada + usuario no-root en imágenes; auth real
      llega en Fase 2 con Keycloak)

## Estado: VERIFICADO ✅ (2026-07-06)
Fase 1 construida, probada y ejecutándose en Docker de punta a punta.

Resultados de verificación:
- **Tests catálogo:** 44 unit + 10 e2e en verde. Cobertura del núcleo
  (dominio + aplicación): **96% stmts / 92.4% branch / 97.3% funcs / 95.8% lines**.
- **Tests web:** 13 en verde. Cobertura `components`+`lib`: **92.5% / 93.75% / 100% / 92.5%**.
- **`docker compose up -d --build`:** postgres + catalog-api + web *healthy*.
- `GET /api/health` → 200; `GET /api/products` → 10 productos sembrados.
- `http://localhost:3000/catalogo` renderiza las tarjetas (server-side desde la API).
- `POST /api/products` → 201 (persistido en Postgres); duplicado → 409; inválido → 400.

Comandos usados (con `pnpm` vía corepack):

```bash
pnpm install                                # genera pnpm-lock.yaml (commiteado)
pnpm --filter @optimus/catalog test:cov     # unit + cobertura
pnpm --filter @optimus/catalog test:e2e     # e2e (repo in-memory)
pnpm --filter @optimus/web test:cov         # vitest + cobertura
# Migración inicial (BD arriba en localhost:5432):
DATABASE_URL="postgresql://optimus:optimus_dev_password@localhost:5432/optimus_catalog?schema=public" \
  pnpm --filter @optimus/catalog exec prisma migrate dev --name init
docker compose up -d --build                # http://localhost:3000/catalogo
```

> Nota de red: el registry npm estuvo bloqueado por una inspección SSL / política
> corporativa (403). Se resolvió cambiando a una red no corporativa para la
> descarga de dependencias. Los Dockerfiles usan `--frozen-lockfile` (el
> `pnpm-lock.yaml` ya está generado).

## Notas sobre cobertura
La cobertura ≥90% se **exige** sobre el núcleo puro (dominio + aplicación del
catálogo) y sobre `components`/`lib` de la web. La capa HTTP (controller,
filtro) y el adaptador Prisma se validan por **comportamiento** en los tests
e2e; su cobertura por línea no se incluye en el umbral porque su valor se prueba
end-to-end, no unitariamente.
