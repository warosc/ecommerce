# ADR-0015: Búsqueda de catálogo con OpenSearch

- **Estado:** Aceptado
- **Fase:** 9

## Contexto
La búsqueda del catálogo se hacía con un `contains` (ILIKE) en Postgres: sin
relevancia, sin tolerancia a erratas y limitada. Se quiere una búsqueda de texto
completo por relevancia, con *fuzziness*, escalable.

## Decisión
Usar **OpenSearch** como motor de búsqueda del catálogo, integrado **en el propio
servicio de Catálogo** (dueño de los productos), tras un puerto.

- **Puerto `ProductSearchIndex`** + adaptador `OpenSearchProductIndex`
  (`@opensearch-project/opensearch`). Al arrancar crea el índice `products` con su
  *mapping* (reintentos si OpenSearch tarda).
- **Indexación**: al crear un producto se indexa (best-effort, no rompe el alta si
  el buscador falla) y al arrancar se hace **backfill** de todo el catálogo
  (idempotente).
- **Búsqueda**: `GET /api/products/search?q=&type=&page=&limit=` con `multi_match`
  sobre `name^3, brand^2, sku, description` y `fuzziness: AUTO`.
- **Resiliencia — fallback a la BD**: si OpenSearch no responde, `SearchProductsUseCase`
  cae al `contains` de Postgres, de modo que la web **nunca se rompe** por el buscador.
- **Web**: barra de búsqueda en `/catalogo` (form GET) que consume el endpoint.

## Alternativas consideradas
- **Full-text de Postgres (`tsvector`)**: más simple y sin infra nueva, pero menos
  potente (peor relevancia/tolerancia, sin *analyzers* ricos) y acopla más.
- **Meilisearch/Typesense**: más ligeros, pero el master prompt fija **OpenSearch**
  (también habilita analítica/*dashboards* futuros).
- **Servicio de búsqueda aparte**: innecesario ahora; el catálogo ya es el dueño de
  los productos y del índice.

## Consecuencias
- **Memoria**: OpenSearch es JVM; en dev se limita a `-Xms512m -Xmx512m`,
  single-node y seguridad desactivada. En prod: clúster y seguridad activada.
- **Consistencia**: el índice es eventual. En el MVP se reindexa al arrancar y al
  crear; **pendiente** indexar también cambios de precio/stock/imágenes y borrados
  (idealmente por eventos, no en el camino de escritura).
- El *fallback* a BD garantiza disponibilidad de la búsqueda aunque el índice esté
  caído o vacío.
