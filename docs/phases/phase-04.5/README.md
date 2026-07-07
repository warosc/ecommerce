# Fase 4.5 — Imágenes reales con MinIO

## Alcance
Sustituir las imágenes placeholder por imágenes reales almacenadas en **MinIO**
(S3), subidas desde el panel Admin y mostradas en el catálogo.

- **MinIO** (contenedor) + bucket `product-images` (lectura pública, autocreado).
- **Catálogo**: `POST /api/products/:id/images` (multipart, rol `admin`) → sube a
  MinIO → añade la URL pública a `product.images`. Puerto `ImageStorage` +
  adaptador `MinioStorageService`.
- **Admin**: el formulario de crear producto acepta una imagen; se sube tras crear.
- **Web**: muestra las imágenes de MinIO (sin cambios; usa `product.images[0]`).

## Componentes / archivos clave
- `services/catalog/src/catalog/infrastructure/storage/minio-storage.service.ts`
- `services/catalog/src/catalog/application/use-cases/add-product-image/`
- `services/catalog/src/catalog/interfaces/http/product.controller.ts` (endpoint imágenes)
- `apps/admin/src/app/actions.ts` (sube la imagen tras crear)
- `docker-compose.yml` (servicio `minio`)

## Cómo verificar (por API, con token admin)
```bash
TOKEN=... # password grant admin (Fase 2)
# crear producto
PID=$(curl -s -X POST http://localhost:3001/api/products -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"sku":"FR-IMG-01","name":"Con imagen","type":"FRAME","brand":"Optimus","priceAmount":50000,"stock":5}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>process.stdout.write(JSON.parse(d).id))")
# subir imagen
curl -s -X POST http://localhost:3001/api/products/$PID/images -H "Authorization: Bearer $TOKEN" -F "file=@/ruta/a/imagen.png"
# la URL de MinIO queda en images[] y es accesible:
curl -sI "http://localhost:9000/product-images/products/$PID/..."   # 200
```
En navegador: **http://admin.localhost** → crear producto con imagen → aparece en
**http://web.localhost/catalogo**. Consola MinIO: **http://localhost:9001**
(minioadmin / minioadmin123).

## Criterios de aceptación (VERIFICADO 2026-07-07)
- [x] `docker compose up -d --build` levanta también `minio` (11/11 servicios `Up`).
- [x] `POST /api/products/:id/images` (admin) → 201 y URL en `images[]`
  (`http://localhost:9000/product-images/products/<id>/<uuid>-<file>`).
- [x] La URL de MinIO responde **200** (`image/png`, bucket público) y la web
  (`/catalogo`) renderiza la imagen.
- [x] Sin archivo → **400**; producto inexistente → **404**; sin auth → **401**.
- [x] Tests catálogo (incl. subida) en verde: 52 unit + 13 e2e, cobertura
  96.95 / 90.16 / 100 / 96.68.

> **Nota de operación:** un build en paralelo de todas las imágenes puede tumbar
> el engine de Docker Desktop (WSL2, presión de memoria: `rpc error: EOF`). Si
> pasa, reiniciar el engine y reconstruir **por servicio** (`docker compose build
> <svc>`) antes de `up -d`.

## Notas
- URL pública vía `MINIO_PUBLIC_URL` (localhost:9000). En prod: presigned URLs o
  CDN detrás de Traefik.
- Sin redimensionado/validación de imagen ni limpieza de huérfanas (futuro).
