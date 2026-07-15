import type { ProductDto } from '@optimus/contracts';

/** Una montura seleccionable en el probador (demo integrada o producto real). */
export interface TryOnFrame {
  id: string;
  label: string;
  /** URL de la imagen transparente (SVG demo o PNG/WebP de MinIO). */
  src: string;
  /**
   * Separación de los centros de lente respecto al ancho de la imagen. El
   * probador la usa para escalar la montura sobre los ojos. Si se omite, se
   * asume {@link DEFAULT_PD_RATIO}.
   */
  pdRatio?: number;
  /** Datos del producto real (ausentes en las monturas de demostración). */
  product?: {
    sku: string;
    priceAmount: number;
    currency: string;
    active: boolean;
  };
}

/**
 * Ratio por defecto: las demos SVG incluyen las varillas en el ancho de la
 * imagen y sitúan los centros de lente a 0.4·ancho.
 */
export const DEFAULT_PD_RATIO = 0.4;

/**
 * Monturas de demostración integradas (SVG transparente en public/tryon-frames).
 * Geometría conocida: centros de lente a 0.4·ancho, verticalmente centrados.
 */
export const DEMO_FRAMES: TryOnFrame[] = [
  { id: 'demo-redonda', label: 'Redonda', src: '/tryon-frames/redonda.svg' },
  { id: 'demo-rectangular', label: 'Rectangular', src: '/tryon-frames/rectangular.svg' },
  { id: 'demo-cat-eye', label: 'Cat-eye', src: '/tryon-frames/cat-eye.svg' },
];

/**
 * Deriva el ratio de separación de lentes a partir de las medidas ópticas
 * `calibre-puente-varilla` (mm). En una vista frontal, el ancho de la montura
 * es `2·calibre + puente` y los centros de lente distan `calibre + puente`.
 *
 * Asume que la imagen encuadra solo el frente de la montura (es lo que pide el
 * admin al subirla). Si el encuadre incluye varillas, el usuario puede corregir
 * con el control de tamaño. Devuelve `undefined` si las medidas no son válidas.
 */
export function pdRatioFromMeasurements(measurements: string | null): number | undefined {
  if (!measurements) return undefined;
  const match = /^(\d{2})-(\d{2})-(\d{2,3})$/.exec(measurements.trim());
  if (!match) return undefined;
  const lens = Number(match[1]);
  const bridge = Number(match[2]);
  const frontWidth = 2 * lens + bridge;
  if (frontWidth <= 0) return undefined;
  return (lens + bridge) / frontWidth;
}

/** Deriva monturas del probador a partir de los productos que tengan `tryOnImageUrl`. */
export function framesFromProducts(products: ProductDto[]): TryOnFrame[] {
  return products
    .filter((p) => Boolean(p.tryOnImageUrl))
    .map((p) => ({
      id: p.id,
      label: p.name,
      src: p.tryOnImageUrl as string,
      pdRatio: pdRatioFromMeasurements(p.measurements),
      product: {
        sku: p.sku,
        priceAmount: p.price.amount,
        currency: p.price.currency,
        active: p.active,
      },
    }));
}
