/**
 * Detección del "damero de transparencia" horneado en una imagen.
 *
 * Los editores dibujan las zonas transparentes como un tablero de cuadros
 * claros. Cuando alguien exporta mal un PNG (o sube una captura de pantalla),
 * ese damero viaja como píxeles OPACOS. En el probador se ve como cuadros
 * grises dentro de las lentes en vez de verse la cara detrás.
 *
 * No se puede distinguir a ojo en el preview del admin, porque el preview pinta
 * un damero de fondo para visualizar la transparencia real.
 *
 * La detección tiene que aguantar dos cosas del mundo real:
 *  - El reescalado difumina el patrón (255 se convierte en 255/254/253…), así
 *    que los tonos se cuantizan antes de contarlos.
 *  - El recorte desplaza el tablero, así que la prueba no puede asumir una fase
 *    concreta: se comprueba que la clase se invierte a distancia `s` y se
 *    conserva a `2s`, que es cierto sea cual sea el desplazamiento.
 */

export interface PixelData {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
}

/** Píxel casi opaco: por debajo de esto ya deja ver el vídeo detrás. */
const OPAQUE_ALPHA = 200;
/** Un damero es claro y neutro (grises/blancos), no de color. */
const MIN_LIGHT = 195;
const MAX_CHANNEL_SPREAD = 8;
/** Agrupa tonos vecinos que el reescalado separó. */
const TONE_STEP = 6;
/** Fracción mínima de la imagen ocupada por el patrón para molestarse en avisar. */
const MIN_COVERAGE = 0.06;
/** Cuánto deben diferenciarse los dos tonos del tablero. */
const MIN_TONE_GAP = 6;
const MAX_TONE_GAP = 60;
/** Los dos tonos dominantes deben explicar casi todos los píxeles claros. */
const MIN_TWO_TONE_SHARE = 0.7;
/** Un tablero alterna a partes iguales; esto descarta manchas de un solo tono. */
const MIN_CLASS_BALANCE = 0.25;
/** Coincidencia mínima de la prueba de alternancia. */
const MIN_PATTERN_SCORE = 0.85;
/** Lados de cuadro plausibles, en píxeles. */
const MIN_SQUARE = 3;
const MAX_SQUARE = 40;

const NONE = 255;

/**
 * Indica si la imagen trae un damero de transparencia horneado como píxeles
 * opacos. Un frente de montura blanco (un solo tono, sin alternancia) no
 * dispara la detección.
 */
export function hasBakedCheckerboard(img: PixelData): boolean {
  const { data, width, height } = img;
  const total = width * height;
  if (total === 0) return false;

  // 1) Píxeles claros, neutros y casi opacos: los candidatos a damero.
  const toneOf = new Int16Array(total).fill(-1);
  const bucket = new Map<number, number>();
  let light = 0;
  for (let p = 0; p < total; p++) {
    const i = p * 4;
    if (data[i + 3] < OPAQUE_ALPHA) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < MIN_LIGHT) continue;
    if (Math.max(r, g, b) - Math.min(r, g, b) > MAX_CHANNEL_SPREAD) continue;
    const q = Math.round((r + g + b) / 3 / TONE_STEP) * TONE_STEP;
    toneOf[p] = q;
    bucket.set(q, (bucket.get(q) ?? 0) + 1);
    light++;
  }
  if (light / total < MIN_COVERAGE || bucket.size < 2) return false;

  // 2) Los dos tonos dominantes deben ser distintos, cercanos y mayoritarios.
  const tones = [...bucket.entries()].sort((a, b) => b[1] - a[1]);
  const toneA = tones[0][0];
  const toneB = tones[1][0];
  const gap = Math.abs(toneA - toneB);
  if (gap < MIN_TONE_GAP || gap > MAX_TONE_GAP) return false;
  if ((tones[0][1] + tones[1][1]) / light < MIN_TWO_TONE_SHARE) return false;

  // 3) Clasifica cada píxel claro como tono A o B. Los que caen en mitad del
  //    salto son borde difuminado: se descartan para no meter ruido.
  const margin = gap * 0.25;
  const mid = (toneA + toneB) / 2;
  const cls = new Uint8Array(total).fill(NONE);
  let nA = 0;
  let nB = 0;
  for (let p = 0; p < total; p++) {
    const t = toneOf[p];
    if (t < 0) continue;
    if (Math.abs(t - mid) < margin) continue;
    if (Math.abs(t - toneA) < Math.abs(t - toneB)) {
      cls[p] = 0;
      nA++;
    } else {
      cls[p] = 1;
      nB++;
    }
  }
  const classified = nA + nB;
  if (classified === 0) return false;
  if (Math.min(nA, nB) / classified < MIN_CLASS_BALANCE) return false;

  // 4) Prueba de alternancia, independiente de la fase: en un tablero de lado s
  //    la clase se INVIERTE a distancia s y se CONSERVA a 2s, en ambos ejes.
  for (let s = MIN_SQUARE; s <= MAX_SQUARE; s++) {
    const flip = agreement(cls, width, height, s, false);
    if (flip === null || flip < MIN_PATTERN_SCORE) continue;
    const keep = agreement(cls, width, height, 2 * s, true);
    if (keep !== null && keep >= MIN_PATTERN_SCORE) return true;
  }
  return false;
}

/**
 * Fracción de pares separados `lag` (en x y en y) cuya clase difiere —o
 * coincide, si `same`—. Devuelve null si no hay pares suficientes.
 */
function agreement(
  cls: Uint8Array,
  width: number,
  height: number,
  lag: number,
  same: boolean,
): number | null {
  let hits = 0;
  let pairs = 0;
  // Paso 2: submuestreo que mantiene la prueba instantánea sin perder señal.
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const a = cls[y * width + x];
      if (a === NONE) continue;
      if (x + lag < width) {
        const b = cls[y * width + x + lag];
        if (b !== NONE) {
          pairs++;
          if (same ? a === b : a !== b) hits++;
        }
      }
      if (y + lag < height) {
        const b = cls[(y + lag) * width + x];
        if (b !== NONE) {
          pairs++;
          if (same ? a === b : a !== b) hits++;
        }
      }
    }
  }
  if (pairs < 50) return null;
  return hits / pairs;
}
