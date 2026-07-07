# ADR-0009: Almacenamiento de imágenes con MinIO (S3)

- **Estado:** Aceptado
- **Fase:** 4.5

## Contexto
Los productos usaban URLs de imágenes de placeholder (picsum). Se necesita
almacenar imágenes reales subidas desde el panel Admin y servirlas al catálogo.

## Decisión
Usar **MinIO** (almacenamiento de objetos compatible con S3), tal como define el
master prompt.

- El **Catálogo** expone `POST /api/products/:id/images` (multipart, protegido con
  rol `admin`): sube la imagen a MinIO y añade su **URL pública** a
  `product.images` (Prisma `push`).
- La lógica se abstrae tras un puerto **`ImageStorage`**; el adaptador
  `MinioStorageService` (SDK `minio`) asegura al arrancar que el **bucket
  exista con política de lectura pública** (reintentos si MinIO tarda).
- La **URL pública** se compone de `MINIO_PUBLIC_URL` (p. ej.
  `http://localhost:9000`) para que el navegador cargue las imágenes; el backend
  sube por la red interna (`minio:9000`).
- El **Admin** añade un input de archivo al formulario; la server action crea el
  producto y luego sube la imagen (reenviando el Bearer).
- La **web** ya renderiza `product.images[0]`, así que muestra las imágenes de
  MinIO sin cambios.

## Alternativas consideradas
- **Guardar imágenes en la BD (bytea)**: infla la BD, mal rendimiento.
- **Volumen de disco servido por Nginx**: no escala a múltiples réplicas ni a K8s.
- **MinIO (elegido)**: S3-compatible (portable a AWS S3/GCS), separa binarios del
  dato relacional, listo para presigned URLs y CDN.

## Consecuencias
- Nueva infra: MinIO (API :9000, consola :9001) + bucket `product-images`.
- Límite de subida 5 MB, solo `image/*`.
- **Pendiente**: presigned URLs (privadas), validación/redimensionado de imagen,
  borrado de imágenes huérfanas, y servir vía CDN/Traefik en producción.
