# ADR-0011: Probador virtual (AR) con MediaPipe FaceLandmarker

- **Estado:** Aceptado
- **Fase:** 4.6

## Contexto
Una óptica se beneficia enormemente de que el cliente pueda **probarse las
monturas** antes de comprarlas. Se quiere un probador en la web pública que
funcione con la cámara del usuario, sin instalar nada y respetando su privacidad.

## Decisión
Probador **AR del lado del cliente** (en el navegador), con **MediaPipe
FaceLandmarker** (WASM) para detectar la malla facial y superponer la imagen de
la montura sobre los ojos.

- **Todo el cómputo ocurre en el dispositivo**: el vídeo de la cámara nunca sale
  del navegador (privacidad + sin coste de servidor ni ancho de banda).
- **Assets self-hosted** (regla del kit: sin CDN de terceros en runtime): los
  binarios WASM de `@mediapipe/tasks-vision` se copian a `public/mediapipe/wasm`
  y el modelo `face_landmarker.task` (~3.8 MB) se descarga a `public/models`
  **en el build** (`scripts/copy-tryon-assets.mjs`, ver Dockerfile). Ambos van en
  `.gitignore` (no se versiona el binario del modelo).
- **Superposición**: se calculan los centros de cada ojo (esquinas de los
  landmarks 33/133 y 362/263), y la montura se **escala, rota y posiciona** según
  la distancia interocular y el ángulo de la cabeza. Vista en espejo (selfie).
- **Formato de montura**: PNG/WebP con **fondo transparente**, vista frontal.
  Nuevo campo `tryOnImageUrl` en el producto + endpoint
  `POST /api/products/:id/try-on-image` (rol `admin`), que sube a MinIO
  (reutiliza el puerto `ImageStorage` de la Fase 4.5). Se rechaza JPG (opaco).
- **Monturas de demostración**: 3 SVG transparentes integrados en la web, para que
  el probador funcione sin depender del catálogo. El probador combina esas demos
  con los productos que tengan `tryOnImageUrl`.
- **Ajuste fino**: como la geometría de una montura subida es desconocida, se usa
  una relación por defecto (centros de lente a 0.4·ancho) más sliders de **tamaño**
  y **altura** para que el usuario cuadre la montura.

## Alternativas consideradas
- **Procesamiento en el servidor** (subir foto/vídeo, detectar en backend): peor
  privacidad, más coste e infraestructura, latencia.
- **SaaS de try-on de terceros**: dependencia externa, coste y datos fuera del
  sistema; contradice el carácter self-hosted del kit.
- **Colocación manual** (arrastrar la montura sobre una foto): más simple pero
  mucho menos "wow" y sin seguimiento en vivo.

## Consecuencias
- El navegador necesita **WebGL/WASM y permiso de cámara**; en dispositivos sin
  cámara el probador muestra un aviso.
- El primer uso descarga el modelo (~3.8 MB) desde el propio servidor.
- Las monturas subidas se **reflejan** en la vista espejo; para monturas casi
  simétricas es imperceptible (limitación aceptada del MVP).
- **Pendiente**: anclajes de lente por-montura (en vez de la relación global),
  oclusión (montura detrás del pelo), captura de foto del resultado, y probado en
  más navegadores/móviles.
