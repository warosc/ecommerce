'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AddToCartButton } from '@/components/AddToCartButton';
import { formatPrice } from '@/lib/format';
import { DEFAULT_PD_RATIO, type TryOnFrame } from '@/lib/tryon';

/**
 * Probador virtual (AR). Detecta la cara con MediaPipe FaceLandmarker (WASM y
 * modelo self-hosted en /mediapipe y /models) y superpone la montura elegida
 * sobre los ojos, escalando y rotando según la distancia interocular. Todo el
 * cómputo ocurre en el navegador; el vídeo nunca sale del dispositivo.
 */

// Índices de landmarks de la malla facial (esquinas de cada ojo).
const RIGHT_EYE = [33, 133]; // ojo a la izquierda de la imagen
const LEFT_EYE = [362, 263]; // ojo a la derecha de la imagen

type Status = 'idle' | 'loading' | 'running' | 'error';

interface Landmark {
  x: number;
  y: number;
}

export function VirtualTryOn({
  frames,
  initialFrameId,
}: {
  frames: TryOnFrame[];
  initialFrameId?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<unknown>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const frameImgRef = useRef<HTMLImageElement | null>(null);

  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<TryOnFrame | null>(
    frames.find((f) => f.id === initialFrameId) ?? frames[0] ?? null,
  );
  const [size, setSize] = useState(1); // multiplicador de tamaño de la montura
  const [offsetY, setOffsetY] = useState(0); // ajuste vertical fino (fracción)
  const [faceDetected, setFaceDetected] = useState(true);

  // Espejo de los ajustes en refs: el bucle de render (rAF) es de larga vida y
  // debe leer siempre el valor actual, no el capturado al crearse.
  const sizeRef = useRef(size);
  const offsetYRef = useRef(offsetY);
  const pdRatioRef = useRef(selected?.pdRatio ?? DEFAULT_PD_RATIO);
  const faceRef = useRef(true);
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);
  useEffect(() => {
    offsetYRef.current = offsetY;
  }, [offsetY]);
  useEffect(() => {
    pdRatioRef.current = selected?.pdRatio ?? DEFAULT_PD_RATIO;
  }, [selected]);

  // Carga la imagen de la montura seleccionada.
  useEffect(() => {
    if (!selected) {
      frameImgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      frameImgRef.current = img;
    };
    img.onerror = () => {
      frameImgRef.current = null;
    };
    img.src = selected.src;
  }, [selected]);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStatus('idle');
  }, []);

  // Limpieza al desmontar.
  useEffect(() => stop, [stop]);

  const renderLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current as {
      detectForVideo: (v: HTMLVideoElement, t: number) => { faceLandmarks: Landmark[][] };
    } | null;
    if (!video || !canvas || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(renderLoop);
      return;
    }
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    let result: { faceLandmarks: Landmark[][] } | null = null;
    try {
      result = landmarker.detectForVideo(video, performance.now());
    } catch {
      result = null;
    }

    ctx.save();
    // Espejo horizontal (vista tipo selfie): vídeo y montura en el mismo espacio.
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);

    const landmarks = result?.faceLandmarks?.[0];
    const frameImg = frameImgRef.current;
    if (landmarks && frameImg && frameImg.complete && frameImg.naturalWidth > 0) {
      const center = (idx: number[]) => {
        const a = landmarks[idx[0]];
        const b = landmarks[idx[1]];
        return { x: ((a.x + b.x) / 2) * w, y: ((a.y + b.y) / 2) * h };
      };
      const right = center(RIGHT_EYE);
      const left = center(LEFT_EYE);
      const dx = left.x - right.x;
      const dy = left.y - right.y;
      const eyeDist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const midX = (right.x + left.x) / 2;
      const midY = (right.y + left.y) / 2;

      // Ancho de dibujo tal que los centros de lente (a pdRatio·ancho, propio de
      // cada montura) coincidan con los ojos, ajustado por el multiplicador.
      const drawW = (eyeDist / pdRatioRef.current) * sizeRef.current;
      const drawH = drawW * (frameImg.naturalHeight / frameImg.naturalWidth);

      ctx.translate(midX, midY);
      ctx.rotate(angle);
      ctx.drawImage(
        frameImg,
        -drawW / 2,
        -drawH * 0.5 + offsetYRef.current * drawH,
        drawW,
        drawH,
      );
    }
    ctx.restore();

    // Avisa si se pierde la cara, pero solo cuando cambia (no en cada frame).
    const hasFace = Boolean(landmarks);
    if (hasFace !== faceRef.current) {
      faceRef.current = hasFace;
      setFaceDetected(hasFace);
    }

    rafRef.current = requestAnimationFrame(renderLoop);
  }, []);

  const start = useCallback(async () => {
    // La cámara (getUserMedia) solo está disponible en contextos seguros: HTTPS
    // o localhost. En móviles, sobre HTTP público, navigator.mediaDevices es
    // undefined y el probador nunca podría pedir permiso. Avisamos con claridad.
    if (
      typeof window !== 'undefined' &&
      (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
    ) {
      setStatus('error');
      setMessage(
        'El probador necesita una conexión segura (HTTPS) para acceder a la cámara. ' +
          'Ábrelo desde el enlace https:// del sitio (en el celular, http no permite la cámara).',
      );
      return;
    }

    setStatus('loading');
    setMessage('Cargando el modelo de detección facial…');
    try {
      // Carga diferida: solo en el navegador, evita evaluar MediaPipe en SSR.
      const vision = await import('@mediapipe/tasks-vision');
      const fileset = await vision.FilesetResolver.forVisionTasks('/mediapipe/wasm');
      const landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: '/models/face_landmarker.task',
          // GPU acelera notablemente el seguimiento en móvil.
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });
      landmarkerRef.current = landmarker;
    } catch (err) {
      setStatus('error');
      setMessage(
        'No se pudo cargar el modelo de detección facial. Reintenta o revisa que ' +
          `los assets del probador se hayan generado en el build. (${(err as Error).message})`,
      );
      return;
    }

    setMessage('Solicitando acceso a la cámara…');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
    } catch (err) {
      setStatus('error');
      setMessage(
        'No se pudo acceder a la cámara. Concede el permiso en el navegador e ' +
          `inténtalo de nuevo. (${(err as Error).name})`,
      );
      return;
    }

    setStatus('running');
    setMessage('');
    rafRef.current = requestAnimationFrame(renderLoop);
  }, [renderLoop]);

  const reset = useCallback(() => {
    setSize(1);
    setOffsetY(0);
  }, []);

  /** Congela el lienzo (vídeo + montura) y lo comparte o descarga. */
  const capture = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!blob) return;

    const filename = `optimus-${selected?.label ?? 'montura'}.png`
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-');
    const file = new File([blob], filename, { type: 'image/png' });

    // En móvil, compartir nativo; si no está disponible o se cancela, descargar.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Mi montura en Óptica Optimus' });
        return;
      } catch {
        // Cancelado por el usuario o no permitido: caemos a la descarga.
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [selected]);

  if (frames.length === 0) {
    return <p className="alert alert--err">No hay monturas disponibles para probar.</p>;
  }

  return (
    <div className="tryon">
      <div className="tryon__stage">
        <video ref={videoRef} className="tryon__video" playsInline muted />
        <canvas ref={canvasRef} className="tryon__canvas" />
        {status === 'running' && !faceDetected ? (
          <p className="tryon__facehint" role="status">
            No detectamos tu cara. Céntrate en el encuadre y busca buena luz.
          </p>
        ) : null}
        {status !== 'running' ? (
          <div className="tryon__overlay">
            {status === 'loading' ? (
              <p>{message || 'Cargando…'}</p>
            ) : status === 'error' ? (
              <p className="alert alert--err">{message}</p>
            ) : (
              <button className="btn btn--primary" type="button" onClick={start}>
                Encender cámara
              </button>
            )}
          </div>
        ) : null}
      </div>

      <div className="tryon__controls">
        <div className="tryon__frames" role="listbox" aria-label="Monturas">
          {frames.map((f) => (
            <button
              key={f.id}
              type="button"
              role="option"
              className={`tryon__frame ${selected?.id === f.id ? 'is-selected' : ''}`}
              aria-selected={selected?.id === f.id}
              onClick={() => setSelected(f)}
              title={f.label}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.src} alt={f.label} />
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {selected?.product ? (
          <div className="tryon__buy">
            <div className="tryon__buyhead">
              <strong>{selected.label}</strong>
              <span className="tryon__price">
                {formatPrice(selected.product.priceAmount, selected.product.currency)}
              </span>
            </div>
            <div className="tryon__buyactions">
              {selected.product.active ? <AddToCartButton sku={selected.product.sku} /> : null}
              <Link className="cta cta--ghost" href={`/producto/${selected.id}`}>
                Ver ficha
              </Link>
            </div>
          </div>
        ) : (
          <p className="tryon__demo muted">
            Montura de demostración. Elige una del{' '}
            <Link href="/catalogo?type=FRAME">catálogo</Link> para comprarla.
          </p>
        )}

        <label className="tryon__slider">
          Tamaño
          <input
            type="range"
            min={0.7}
            max={1.6}
            step={0.02}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </label>
        <label className="tryon__slider">
          Altura
          <input
            type="range"
            min={-0.25}
            max={0.25}
            step={0.01}
            value={offsetY}
            onChange={(e) => setOffsetY(Number(e.target.value))}
          />
        </label>

        {status === 'running' ? (
          <div className="tryon__actions">
            <button className="btn btn--primary" type="button" onClick={capture}>
              📸 Tomar foto
            </button>
            <button className="btn" type="button" onClick={reset}>
              Reajustar
            </button>
            <button className="btn" type="button" onClick={stop}>
              Apagar cámara
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
