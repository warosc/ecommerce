# ADR-0001: Gestor de monorepo — pnpm workspaces + Turborepo

- **Estado:** Aceptado
- **Fase:** 1

## Contexto
La plataforma Optimus crecerá a múltiples microservicios NestJS y apps Next.js
(Landing, Ecommerce, Admin, …) que comparten tipos y configuración. Necesitamos
un layout de monorepo con instalaciones rápidas, aislamiento de dependencias y
orquestación de tareas (build/test/lint) que escale sin ceremonia excesiva para
un equipo pequeño en fase MVP.

## Decisión
Usar un único workspace gestionado con **pnpm** (`pnpm-workspace.yaml` con
`apps/*`, `services/*`, `packages/*`) y **Turborepo** (`turbo.json`) como
orquestador de tareas con caché.

## Alternativas consideradas
- **npm/yarn workspaces**: cero configuración pero sin caché de tareas y con
  hoisting laxo que permite *phantom dependencies*.
- **Nx**: potente (generadores, graph, plugins) pero con curva y ceremonia
  desproporcionadas para el tamaño actual; mayor acoplamiento a su tooling.
- **pnpm + Turborepo (elegida)**: pnpm da instalaciones rápidas por enlaces
  duros y `node_modules` estricto (sin phantom deps); Turborepo añade grafo de
  tareas y caché con un solo archivo de configuración.

## Consecuencias
- Instalaciones reproducibles con `pnpm-lock.yaml` y `--frozen-lockfile` en Docker.
- `turbo run build|test` respeta dependencias entre paquetes (`^build`).
- Los Dockerfiles instalan subárboles con `pnpm install --filter <pkg>...`.
- Requiere Corepack/pnpm en los entornos de CI y build.
