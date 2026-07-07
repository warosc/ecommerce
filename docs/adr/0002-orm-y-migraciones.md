# ADR-0002: ORM y migraciones — Prisma tras el puerto de repositorio

- **Estado:** Aceptado
- **Fase:** 1

## Contexto
El servicio Catálogo persiste en PostgreSQL. Queremos buen tooling de
migraciones y tipado, sin acoplar el dominio (Clean Architecture) al ORM.

## Decisión
Usar **Prisma** confinado a la capa `infrastructure`, detrás del puerto
`ProductRepository`. Un `ProductMapper` traduce entre el registro Prisma y la
entidad de dominio. Las migraciones se generan con `prisma migrate dev` (dev) y
se aplican con `prisma migrate deploy` (contenedor). El seed
(`prisma/seed.ts`) es **idempotente** (comprueba `count()` antes de insertar).

## Alternativas consideradas
- **MikroORM**: mejor encaje conceptual DDD (data-mapper, Unit of Work), pero
  comunidad menor y más configuración.
- **TypeORM**: integración Nest nativa pero mezcla active-record/data-mapper y
  mantenimiento irregular.
- **Prisma (elegida)**: mejor DX y motor de migraciones declarativo; su falta de
  patrón data-mapper se neutraliza con el puerto + mapper.

## Consecuencias
- El dominio y la aplicación no conocen Prisma; se pueden testear con un
  repositorio in-memory.
- El cliente Prisma se genera en el build (`prisma generate`) y requiere
  `openssl`/`libc6-compat` en Alpine.
- Migración inicial versionada en `services/catalog/prisma/migrations/`.
- Futuro (ver roadmap): mover el seed/migración a un servicio one-shot cuando
  varios servicios compartan base de datos.
