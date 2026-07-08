# ADR-0012: Recorte automático de monturas (borrado de fondo en el navegador)

- **Estado:** Aceptado
- **Fase:** 4.7

## Contexto
El probador (Fase 4.6) necesita la montura en **PNG transparente**. Prepararla a
mano (recortar el fondo en Photopea/remove.bg) es fricción para el operador de la
óptica, que normalmente solo tiene **fotos normales** de las monturas. Además, el
Admin solo permitía adjuntar la montura **al crear** un producto, no a los que ya
están en stock.

## Decisión
**Borrado de fondo automático en el navegador del Admin** + **gestión de productos
existentes**.

- Nueva página Admin **`/productos`**: lista el stock (GET público del Catálogo) y,
  por producto, un **`TryOnUploader`**.
- El operador sube una **foto normal**; el navegador le quita el fondo con
  **`@imgly/background-removal`** (ONNX Runtime Web + WASM) y obtiene un **PNG
  transparente**, que sube al endpoint ya existente
  `POST /api/products/:id/try-on-image` mediante una **server action** (el Bearer
  de Keycloak se añade en el servidor, no se expone al navegador).
- **Modelo**: por defecto se descarga del CDN de imgly (~44 MB, cacheado por el
  navegador tras la 1ª vez). El `publicPath` es **configurable por env**
  (`NEXT_PUBLIC_IMGLY_PUBLIC_PATH`) para self-hostear/espejar los assets más
  adelante sin tocar código.

## Alternativas consideradas
- **Borrado en el servidor (catálogo)**: cualquier cliente se beneficia y el asset
  siempre queda bien recortado, pero añade un modelo pesado (~44 MB) y RAM al
  servicio; se descartó para no engordar el catálogo en esta fase.
- **Microservicio dedicado (Python `rembg`/U2Net)**: lo más limpio y escalable,
  pero es infra nueva (stack Python); se deja como evolución futura.
- **Recorte manual**: la fricción que precisamente se quiere evitar.
- **Self-hostear todo el paquete de datos de imgly**: son **~221 MB** (varios
  modelos + 7 variantes de WASM); desproporcionado para una herramienta interna.

## Consecuencias
- El navegador del Admin necesita **WebGL/WASM** y descarga el modelo una vez.
- Dependencia de runtime del CDN de imgly **solo en el Admin** (interno), no en la
  web pública (cuyo probador sí está 100% self-hosted, ver [ADR-0011](0011-probador-virtual-ar.md)).
  Mitigable poniendo `NEXT_PUBLIC_IMGLY_PUBLIC_PATH` a un espejo propio.
- El recorte automático puede fallar en fotos con fondos complejos; el operador ve
  la vista previa (con patrón de transparencia) antes de guardar.
