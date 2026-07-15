import { hasBakedCheckerboard, type PixelData } from './checkerboard';

/**
 * Revisión de la foto de una montura tras quitarle el fondo.
 *
 * No se puede guiar el encuadre en vivo (la foto la toma la app de cámara del
 * sistema, fuera de la web), así que se revisa el resultado y se avisa de lo
 * que suele estropear el probador: recorte fallido, montura demasiado pequeña,
 * poca luz o el damero de transparencia horneado.
 */

export interface FrameIssue {
  code: 'checkerboard' | 'too-small' | 'too-big' | 'dark' | 'tilted';
  message: string;
}

/** Alfa a partir del cual consideramos que el píxel es montura. */
const OPAQUE = 24;
/** Debajo de esto el recorte salió casi vacío o la montura sale lejísimos. */
const MIN_COVERAGE = 0.02;
/** Encima de esto el quitafondos no recortó nada (se tragó el fondo entero). */
const MAX_COVERAGE = 0.85;
/** Luminancia media por debajo de la cual la foto está oscura. */
const MIN_LUMA = 55;
/** Inclinación (grados) a partir de la cual conviene avisar. */
const MAX_TILT_DEG = 12;

/**
 * Revisa la imagen recortada y devuelve los problemas encontrados.
 * `tiltRad` es la inclinación ya detectada por el uploader (se endereza sola,
 * pero un exceso delata una foto muy torcida).
 */
export function analyzeFrameShot(img: PixelData, tiltRad: number): FrameIssue[] {
  const issues: FrameIssue[] = [];
  const { data, width, height } = img;
  const total = width * height;
  if (total === 0) return issues;

  let opaque = 0;
  let lumaSum = 0;
  for (let p = 0; p < total; p++) {
    const i = p * 4;
    if (data[i + 3] <= OPAQUE) continue;
    opaque++;
    // Luma perceptual (Rec. 601).
    lumaSum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  const coverage = opaque / total;
  if (coverage < MIN_COVERAGE) {
    issues.push({
      code: 'too-small',
      message:
        'Apenas se recortó montura. Acércate más, que ocupe buena parte del encuadre, ' +
        'y usa un fondo liso que contraste.',
    });
    // Sin apenas píxeles, el resto de medidas no son fiables.
    return issues;
  }

  if (coverage > MAX_COVERAGE) {
    issues.push({
      code: 'too-big',
      message:
        'El recorte abarca casi toda la imagen: probablemente no se separó del fondo. ' +
        'Prueba con un fondo liso y contrastado (hoja blanca o mesa oscura).',
    });
  }

  if (lumaSum / opaque < MIN_LUMA) {
    issues.push({
      code: 'dark',
      message: 'La foto está oscura. Busca luz natural o una lámpara, sin sombras duras.',
    });
  }

  const tiltDeg = Math.abs((tiltRad * 180) / Math.PI);
  if (tiltDeg > MAX_TILT_DEG) {
    issues.push({
      code: 'tilted',
      message: `La montura sale inclinada (~${Math.round(tiltDeg)}°). Se endereza sola, pero saldrá mejor si la fotografías recta.`,
    });
  }

  if (hasBakedCheckerboard(img)) {
    issues.push({
      code: 'checkerboard',
      message:
        'Esta imagen trae el damero de transparencia pintado: los cuadros grises son ' +
        'píxeles opacos, así que en el probador taparán la cara en vez de dejarla ver. ' +
        'Suele pasar al guardar una captura del editor; usa la foto original o un PNG ' +
        'con transparencia real.',
    });
  }

  return issues;
}
