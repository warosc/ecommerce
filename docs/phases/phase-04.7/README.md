# Fase 4.7 — Recorte automático de monturas + gestión de productos (Admin)

## Alcance
Que el operador pueda hacer **probable** cualquier montura de su stock **subiendo
una foto normal**: el fondo se quita automáticamente en el navegador y se guarda
como imagen del probador. Ver [ADR-0012](../../adr/0012-recorte-fondo-monturas.md).

- **Admin `/productos`**: lista el stock y, por producto, un uploader.
- **Borrado de fondo en el navegador** (`@imgly/background-removal`): foto normal →
  PNG transparente → `POST /api/products/:id/try-on-image` (server action con Bearer).
- **Auto-enderezado + auto-recorte**: tras quitar el fondo, se detecta el eje de la
  montura (PCA sobre los píxeles opacos) y se **nivela**; se recorta a la caja de la
  montura para centrarla. Slider de **rotación** (±45°) para afinar a mano. Así una
  foto tomada en diagonal se guarda recta (si no, la montura sale inclinada en el
  probador).
- Reutiliza el endpoint y el campo `tryOnImageUrl` de la Fase 4.6.

## Componentes / archivos clave
- `apps/admin/src/app/productos/page.tsx` — lista de productos (auth-gated).
- `apps/admin/src/components/TryOnUploader.tsx` — foto → recorte → subir (cliente).
- `apps/admin/src/app/actions.ts` — `setTryOnImageAction` (server action).
- Dependencia `@imgly/background-removal`; `publicPath` vía `NEXT_PUBLIC_IMGLY_PUBLIC_PATH`.

## Cómo verificar
1. `docker compose up -d --build` (admin actualizado).
2. **http://admin.localhost** → iniciar sesión → **Productos**.
3. En una montura del stock (p. ej. `FR-CLASSIC-01`): **Elegir foto…** (una foto
   normal de una montura, fondo liso) → espera el recorte (la 1ª vez descarga el
   modelo ~44 MB) → aparece la vista previa transparente → **Guardar montura**.
4. La etiqueta pasa a **"Con montura"**. En **http://web.localhost/probador** esa
   montura aparece como opción; su tarjeta del catálogo muestra **🕶 Probar**.

## Criterios de aceptación
- [ ] `/productos` lista el stock y marca qué productos tienen montura.
- [ ] Subir una foto normal produce un PNG transparente (vista previa con patrón
      de transparencia) y al guardar el producto queda "Con montura".
- [ ] El producto aparece luego en el probador y en su tarjeta ("🕶 Probar").
- [ ] Sin permiso admin → la API responde 401/403 (mensaje en el uploader).
- [ ] `next build` del admin en verde (bundle de imgly en chunk on-demand).

## Notas
- El borrado de fondo corre **en el navegador**; el vídeo/imagen no se procesa en
  el servidor. El token de Keycloak se añade en la server action (no en el cliente).
- **Self-host del modelo**: por defecto se baja del CDN de imgly (cacheado). Para
  self-hostear, sirve el paquete `@imgly/background-removal-data` desde un origen
  propio y define `NEXT_PUBLIC_IMGLY_PUBLIC_PATH`.
- Fotos con fondos complejos pueden recortar peor; usar fondo liso/uniforme.
