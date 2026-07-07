/**
 * Prepara los assets del probador virtual (self-hosted, sin CDN de terceros):
 *   1. Copia los binarios WASM de @mediapipe/tasks-vision a public/mediapipe/wasm
 *   2. Descarga el modelo face_landmarker.task a public/models (si no existe)
 *
 * Se ejecuta en el build de la web (ver Dockerfile) y localmente con
 * `pnpm --filter @optimus/web tryon:assets`. Idempotente.
 */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', 'public');

const MODEL_URL =
  process.env.MEDIAPIPE_FACE_MODEL_URL ??
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

function packageRoot(specifier) {
  // El paquete restringe package.json vía "exports"; resolvemos el entry
  // principal y subimos hasta el directorio que contiene su package.json.
  let dir = dirname(require.resolve(specifier));
  while (!existsSync(join(dir, 'package.json')) && dir !== dirname(dir)) {
    dir = dirname(dir);
  }
  return dir;
}

function copyWasm() {
  const wasmSrc = join(packageRoot('@mediapipe/tasks-vision'), 'wasm');
  if (!existsSync(wasmSrc)) {
    throw new Error(`No se encontró la carpeta wasm de @mediapipe/tasks-vision en ${wasmSrc}`);
  }
  const wasmDest = join(publicDir, 'mediapipe', 'wasm');
  mkdirSync(wasmDest, { recursive: true });
  cpSync(wasmSrc, wasmDest, { recursive: true });
  const files = readdirSync(wasmDest);
  console.log(`[tryon-assets] WASM copiado (${files.length} archivos) → public/mediapipe/wasm`);
}

async function downloadModel() {
  const modelsDir = join(publicDir, 'models');
  const dest = join(modelsDir, 'face_landmarker.task');
  if (existsSync(dest) && statSync(dest).size > 100_000) {
    console.log('[tryon-assets] Modelo ya presente, se omite la descarga.');
    return;
  }
  mkdirSync(modelsDir, { recursive: true });
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[tryon-assets] Descargando modelo (intento ${attempt}) desde ${MODEL_URL}`);
      const res = await fetch(MODEL_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(dest, buf);
      console.log(`[tryon-assets] Modelo descargado (${(buf.length / 1e6).toFixed(1)} MB) → public/models/face_landmarker.task`);
      return;
    } catch (err) {
      console.warn(`[tryon-assets] Falló la descarga: ${err.message}`);
      if (attempt === maxAttempts) {
        console.warn(
          '[tryon-assets] AVISO: no se pudo descargar el modelo. El probador mostrará un aviso ' +
            'hasta que face_landmarker.task esté en public/models (define MEDIAPIPE_FACE_MODEL_URL o cópialo a mano).',
        );
      }
    }
  }
}

copyWasm();
await downloadModel();
