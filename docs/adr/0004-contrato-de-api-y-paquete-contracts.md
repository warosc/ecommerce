# ADR-0004: Contrato de API compartido — paquete @optimus/contracts (solo tipos)

- **Estado:** Aceptado
- **Fase:** 1

## Contexto
El frontend (Next.js) y el backend (NestJS) deben coincidir en la forma de los
datos de la API (ProductDto, respuestas paginadas, DTOs de entrada). Duplicar
tipos en ambos lados provoca desincronización.

## Decisión
Crear el paquete **`@optimus/contracts`** como fuente única de verdad de los
tipos de la API. Es **solo de tipos**: no exporta ningún valor en runtime, y los
consumidores lo importan con `import type { … }`. Así el import se borra al
compilar y no se crea una dependencia de ejecución entre paquetes (evita
problemas de orden de build en el monorepo). Los valores que sí se necesitan en
runtime (p. ej. la lista de tipos de producto para validar) se definen en cada
capa que valida (dominio del backend, formularios del frontend).

## Alternativas consideradas
- **Duplicar tipos** en front y back: simple pero propenso a divergencia.
- **Paquete compilado a JS** consumido como dependencia normal: obliga a ordenar
  el build (contracts antes que sus consumidores) y complica dev/test.
- **Paquete solo-tipos con `import type` (elegida)**: sincroniza el contrato sin
  acoplamiento en runtime ni orden de build.

## Consecuencias
- Next.js lo consume vía `transpilePackages`; Jest/Vitest vía alias al fuente.
- Disciplina requerida: los consumidores deben usar `import type`.
- Al añadir endpoints (auth, pedidos, …) se extiende este paquete.
