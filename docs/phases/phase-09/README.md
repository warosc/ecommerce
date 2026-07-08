# Fase 9 — Búsqueda de catálogo con OpenSearch

## Alcance
Búsqueda de texto completo del catálogo por relevancia y con tolerancia a erratas,
con respaldo en la BD. Ver [ADR-0015](../../adr/0015-busqueda-opensearch.md).

- **OpenSearch** (contenedor) indexado por el Catálogo (puerto `ProductSearchIndex`).
- Indexación al crear + **backfill** al arrancar.
- `GET /api/products/search?q=&type=` (multi_match + fuzziness), con **fallback a
  Postgres** si OpenSearch no responde.
- **Web**: barra de búsqueda en `/catalogo`.

## Componentes / archivos clave
- `services/catalog/src/catalog/application/ports/product-search.ts`
- `services/catalog/src/catalog/infrastructure/search/opensearch-product.index.ts`
- `services/catalog/src/catalog/infrastructure/search/search-index.initializer.ts`
- `services/catalog/src/catalog/application/use-cases/search-products/…`
- `services/catalog/.../product.controller.ts` (`GET /products/search`)
- `apps/web/src/app/catalogo/page.tsx` + `lib/api.ts` (`searchProducts`)
- `docker-compose.yml` (`opensearch`), `.env` (`OPENSEARCH_NODE`)

## Cómo verificar
1. `docker compose up -d --build` (levanta `opensearch`; el Catálogo indexa al arrancar).
2. Buscar por API:
   ```bash
   curl "http://localhost:3001/api/products/search?q=montura"       # por relevancia
   curl "http://localhost:3001/api/products/search?q=montrua"       # errata → fuzziness
   curl "http://localhost:3001/api/products/search?q=lente&type=LENS"
   ```
3. **Web**: http://web.localhost/catalogo → usar la barra de búsqueda.
4. **Fallback**: parar `opensearch` (`docker compose stop opensearch`) y repetir la
   búsqueda: sigue respondiendo (vía Postgres).

## Criterios de aceptación
- [ ] `opensearch` levanta y el Catálogo indexa los productos sembrados (backfill).
- [ ] `GET /api/products/search?q=` devuelve resultados por relevancia; una errata
      leve encuentra el producto (fuzziness).
- [ ] Con OpenSearch caído, la búsqueda sigue respondiendo (fallback a BD).
- [ ] La web `/catalogo` busca con la barra.
- [ ] Tests de catálogo en verde (unit+e2e, cobertura ≥90%).

## Notas
- Memoria: heap de OpenSearch limitado a 512m (dev). Si el host va justo de RAM,
  es el primer servicio a vigilar.
- Índice eventual: pendiente reindexar cambios de precio/stock/imagen y borrados
  (idealmente por eventos). Hoy: indexa al crear + backfill al arrancar.
