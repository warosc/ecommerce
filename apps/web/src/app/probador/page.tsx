import Link from 'next/link';
import { VirtualTryOn } from '@/components/VirtualTryOn';
import { getProducts } from '@/lib/api';
import { DEMO_FRAMES, framesFromProducts, type TryOnFrame } from '@/lib/tryon';

// El probador depende de la cámara del cliente; la página se renderiza en cada
// visita para incluir las monturas reales más recientes del catálogo.
export const dynamic = 'force-dynamic';

export default async function ProbadorPage({
  searchParams,
}: {
  searchParams: Promise<{ frame?: string }>;
}) {
  const { frame } = await searchParams;
  let productFrames: TryOnFrame[] = [];
  try {
    const res = await getProducts();
    productFrames = framesFromProducts(res.data);
  } catch {
    // Si el catálogo no responde, el probador sigue funcionando con las demos.
  }
  const frames = [...DEMO_FRAMES, ...productFrames];

  return (
    <main className="container">
      <nav className="crumbs">
        <Link href="/">Inicio</Link> · <Link href="/catalogo">Catálogo</Link>
      </nav>
      <h1>Probador virtual</h1>
      <p className="lede">
        Pruébate las monturas en tiempo real con tu cámara. Todo el procesamiento
        ocurre en tu dispositivo: el vídeo no se envía a ningún servidor.
      </p>
      <VirtualTryOn frames={frames} initialFrameId={frame} />
    </main>
  );
}
