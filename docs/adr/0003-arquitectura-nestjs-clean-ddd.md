# ADR-0003: Arquitectura de los microservicios NestJS — Clean Architecture / DDD

- **Estado:** Aceptado
- **Fase:** 1

## Contexto
El master prompt exige DDD + Clean Architecture. Necesitamos un patrón de capas
repetible para todos los microservicios, empezando por Catálogo.

## Decisión
Estructurar cada contexto en cuatro capas con la **regla de dependencia hacia
adentro**:

- `domain/` — entidades, value objects, puertos (interfaces) y errores. Sin
  dependencias de framework ni de infraestructura.
- `application/` — casos de uso que orquestan el dominio a través de los puertos.
- `infrastructure/` — adaptadores de salida (Prisma, colas, etc.).
- `interfaces/http/` — adaptadores de entrada (controllers, DTOs, filtros).

El cableado se hace en el `*.module.ts` con **inyección por token**
(`{ provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository }`), de modo
que sustituir un adaptador no toca dominio ni aplicación. Los errores de dominio
se traducen a HTTP mediante un `DomainExceptionFilter`.

## Alternativas consideradas
- **Módulos NestJS "planos"** (service + controller + entidad ORM): más rápidos
  al inicio pero acoplan la lógica de negocio al framework y al ORM.
- **Clean Architecture por capas (elegida)**: más archivos por caso de uso, a
  cambio de un dominio testeable y aislado y adaptadores intercambiables.

## Consecuencias
- Cobertura de tests alta y barata sobre dominio + aplicación (repos in-memory).
- Los tests e2e ejercen la capa HTTP sin base de datos (override del puerto).
- Coste: más ceremonia/archivos por caso de uso; asumido por la escala prevista.
