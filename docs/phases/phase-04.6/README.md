# Fase 4.6 — Probador virtual (AR)

## Alcance
Probador de monturas en la web pública con **cámara en vivo** y realidad
aumentada: detecta la cara (MediaPipe FaceLandmarker, en el navegador) y
superpone la montura elegida sobre los ojos. Ver [ADR-0011](../../adr/0011-probador-virtual-ar.md).

- **Web**: página `/probador` + componente cliente `VirtualTryOn` (webcam, canvas,
  MediaPipe). Assets self-hosted (WASM + modelo) generados en el build.
- **Monturas de prueba**: 3 SVG transparentes integrados (`public/tryon-frames`).
- **Catálogo**: nuevo campo `tryOnImageUrl` + endpoint
  `POST /api/products/:id/try-on-image` (admin, PNG/WebP → MinIO).
- **Admin**: el formulario de crear producto acepta una montura para el probador.
- **Privacidad**: el vídeo nunca sale del dispositivo.

## Componentes / archivos clave
- `apps/web/src/app/probador/page.tsx` — combina demos + productos con `tryOnImageUrl`.
- `apps/web/src/components/VirtualTryOn.tsx` — webcam + overlay AR (excluido de
  cobertura: depende de cámara/canvas/WASM, se verifica a mano).
- `apps/web/src/lib/tryon.ts` — monturas demo + `framesFromProducts`.
- `apps/web/scripts/copy-tryon-assets.mjs` — copia WASM + descarga el modelo.
- `apps/web/public/tryon-frames/*.svg` — monturas de demostración.
- `services/catalog/.../set-try-on-image/…` + endpoint en `product.controller.ts`.
- `services/catalog/prisma/migrations/…_add_tryonimageurl` — columna `tryOnImageUrl`.

## Cómo verificar
1. `docker compose up -d --build` (levanta web y catálogo actualizados).
2. Navegador: **http://web.localhost/probador** (o `localhost:3000/probador`).
   - Elige una montura de prueba → **Encender cámara** → concede permiso →
     la montura sigue tu cara. Ajusta **tamaño** y **altura**.
3. Subir una montura real (aparece como opción en el probador):
   - En **http://admin.localhost** crear producto con "Montura para el probador"
     (PNG/WebP transparente), o por API:
   ```bash
   curl -X POST http://localhost:3001/api/products/$PID/try-on-image \
     -H "Authorization: Bearer $TOKEN" -F "file=@montura.png"   # 201, fija tryOnImageUrl
   ```
   - La tarjeta del producto (montura) muestra un enlace **🕶 Probar**.

## Criterios de aceptación (verificado 2026-07-07 salvo overlay de cámara)
- [x] La web sirve `/probador` (200) y los assets self-hosted: `face_landmarker.task`
      (3.8 MB) y el WASM (200), más las 3 monturas SVG.
- [x] Las 3 monturas de prueba se listan sin catálogo.
- [x] `POST /api/products/:id/try-on-image` (admin) → **201** y `tryOnImageUrl`
      (MinIO, 200); JPG → **400**; sin archivo → **400**; producto inexistente →
      **404** (e2e). Migración `tryOnImageUrl` aplicada.
- [x] Los productos con `tryOnImageUrl` aparecen como monturas en `/probador`.
- [x] Tests catálogo en verde: 57 unit + 17 e2e, cobertura 97.8 / 92.06 / 100 / 97.6.
- [ ] **Pendiente de comprobación visual (requiere webcam):** el overlay sigue la
      cara al encender la cámara. Todo lo previo (carga de modelo/cámara y datos)
      está verificado; falta la validación a ojo en el navegador.

## Notas
- El modelo `face_landmarker.task` (~3.8 MB) y el WASM se **descargan/copian en el
  build** a `public/` (gitignored). Offline: define `MEDIAPIPE_FACE_MODEL_URL` o
  copia el `.task` a mano.
- Vista en espejo: monturas subidas se reflejan (imperceptible si son simétricas).
- **Deuda previa (Fase 4):** la cobertura de `apps/web` está por debajo de 90% por
  componentes sin tests (`CheckoutForm`, `RemoveButton`, `cart.ts`, `AddToCartButton`).
  No es de esta fase; pendiente de saldar aparte.
