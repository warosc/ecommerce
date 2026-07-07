'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TryOnFrame } from '@/lib/tryon';

/**
 * Probador virtual (AR). Detecta la cara con MediaPipe FaceLandmarker (WASM y
 * modelo self-hosted en /mediapipe y /models) y superpone la montura elegida
 * sobre los ojos, escalando y rotando según la distancia interocular. Todo el
 * cómputo ocurre en el navegador; el vídeo nunca sale del dispositivo.
 */

// Índices de landmarks de la malla facial (esquinas de cada ojo).
const RIGHT_EYE = [33, 133]; // ojo a la izquierda de la imagen
const LEFT_EYE = [362, 263]; // ojo a la derecha de la imagen
// Separación de los centros de lente respecto al ancho de la imagen de montura
// (las demos SVG usan 0.4; buen valor por defecto para monturas subidas).
const FRAME_PD_RATIO = 0.4;

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

  // Espejo de los ajustes en refs: el bucle de render (rAF) es de larga vida y
  // debe leer siempre el valor actual, no el capturado al crearse.
  const sizeRef = useRef(size);
  const offsetYRef = useRef(offsetY);
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);
  useEffect(() => {
    offsetYRef.current = offsetY;
  }, [offsetY]);

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

      // Ancho de dibujo tal que los centros de lente (a FRAME_PD_RATIO·ancho)
      // coincidan con los ojos, ajustado por el multiplicador de tamaño.
      const drawW = (eyeDist / FRAME_PD_RATIO) * sizeRef.current;
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

    rafRef.current = requestAnimationFrame(renderLoop);
  }, []);

  const start = useCallback(async () => {
    setStatus('loading');
    setMessage('Cargando el modelo de detección facial…');
    try {
      // Carga diferida: solo en el navegador, evita evaluar MediaPipe en SSR.
      const vision = await import('@mediapipe/tasks-vision');
      const fileset = await vision.FilesetResolver.forVisionTasks('/mediapipe/wasm');
      const landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: '/models/face_landmarker.task',
          delegate: 'CPU',
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

  if (frames.length === 0) {
    return <p className="alert alert--err">No hay monturas disponibles para probar.</p>;
  }

  return (
    <div className="tryon">
      <div className="tryon__stage">
        <video ref={videoRef} className="tryon__video" playsInline muted />
        <canvas ref={canvasRef} className="tryon__canvas" />
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
          <button className="btn" type="button" onClick={stop}>
            Apagar cámara
          </button>
        ) : null}
      </div>
    </div>
  );
}
