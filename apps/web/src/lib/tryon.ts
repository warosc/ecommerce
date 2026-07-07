import type { ProductDto } from '@optimus/contracts';

/** Una montura seleccionable en el probador (demo integrada o producto real). */
export interface TryOnFrame {
  id: string;
  label: string;
  /** URL de la imagen transparente (SVG demo o PNG/WebP de MinIO). */
  src: string;
}

/**
 * Monturas de demostración integradas (SVG transparente en public/tryon-frames).
 * Geometría conocida: centros de lente a 0.4·ancho, verticalmente centrados.
 */
export const DEMO_FRAMES: TryOnFrame[] = [
  { id: 'demo-redonda', label: 'Redonda', src: '/tryon-frames/redonda.svg' },
  { id: 'demo-rectangular', label: 'Rectangular', src: '/tryon-frames/rectangular.svg' },
  { id: 'demo-cat-eye', label: 'Cat-eye', src: '/tryon-frames/cat-eye.svg' },
];

/** Deriva monturas del probador a partir de los productos que tengan `tryOnImageUrl`. */
export function framesFromProducts(products: ProductDto[]): TryOnFrame[] {
  return products
    .filter((p) => Boolean(p.tryOnImageUrl))
    .map((p) => ({ id: p.id, label: p.name, src: p.tryOnImageUrl as string }));
}
