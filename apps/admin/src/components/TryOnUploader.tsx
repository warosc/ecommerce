'use client';

import type { Config } from '@imgly/background-removal';
import { useCallback, useRef, useState, useTransition } from 'react';
import { setTryOnImageAction, type CreateProductState } from '@/app/actions';

type Status = 'idle' | 'processing' | 'ready' | 'error';

const MAX_SIZE = 900; // lado máximo del recorte guardado (px)
const ALPHA = 24; // umbral de opacidad para considerar "montura"

/** Dibuja la imagen recortada a un canvas, reescalada a MAX_SIZE como máximo. */
function toBaseCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const scale = Math.min(1, MAX_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * scale));
  c.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/** Ángulo (rad) del eje principal de la montura, vía PCA sobre los píxeles opacos. */
function detectTilt(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d')!;
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let n = 0;
  let sx = 0;
  let sy = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > ALPHA) {
        n++;
        sx += x;
        sy += y;
      }
    }
  }
  if (n < 50) return 0;
  const mx = sx / n;
  const my = sy / n;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > ALPHA) {
        const dx = x - mx;
        const dy = y - my;
        sxx += dx * dx;
        syy += dy * dy;
        sxy += dx * dy;
      }
    }
  }
  // Orientación del eje mayor. Se nivela rotando por -angle.
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  // Descarta valores absurdos (montura casi cuadrada / recorte ruidoso).
  if (Math.abs(angle) > (50 * Math.PI) / 180) return 0;
  return angle;
}

/** Rota el canvas por angleRad, recorta a la caja de la montura y devuelve un PNG. */
function renderCorrected(base: HTMLCanvasElement, angleRad: number): Promise<Blob> {
  const w = base.width;
  const h = base.height;
  const diag = Math.ceil(Math.hypot(w, h));
  const rot = document.createElement('canvas');
  rot.width = diag;
  rot.height = diag;
  const ctx = rot.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(diag / 2, diag / 2);
  ctx.rotate(angleRad);
  ctx.drawImage(base, -w / 2, -h / 2);

  const { data } = ctx.getImageData(0, 0, diag, diag);
  let minX = diag;
  let minY = diag;
  let maxX = 0;
  let maxY = 0;
  let found = false;
  for (let y = 0; y < diag; y++) {
    for (let x = 0; x < diag; x++) {
      if (data[(y * diag + x) * 4 + 3] > 10) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) {
    minX = 0;
    minY = 0;
    maxX = diag - 1;
    maxY = diag - 1;
  }
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const out = document.createElement('canvas');
  out.width = bw;
  out.height = bh;
  out.getContext('2d')!.drawImage(rot, minX, minY, bw, bh, 0, 0, bw, bh);
  return new Promise((resolve) => out.toBlob((b) => resolve(b as Blob), 'image/png'));
}

export function TryOnUploader({
  productId,
  sku,
  currentTryOn,
}: {
  productId: string;
  sku: string;
  currentTryOn: string | null;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [correctedUrl, setCorrectedUrl] = useState<string | null>(null);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [result, setResult] = useState<CreateProductState | null>(null);
  const [saving, startSaving] = useTransition();

  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const tiltRef = useRef(0);
  const blobRef = useRef<Blob | null>(null);

  const reRender = useCallback(async (extraDeg: number) => {
    const base = baseRef.current;
    if (!base) return;
    // Se nivela rotando por -tilt (contrarrestando el eje detectado); el usuario
    // afina con extraDeg.
    const angle = -tiltRef.current + (extraDeg * Math.PI) / 180;
    const blob = await renderCorrected(base, angle);
    blobRef.current = blob;
    setCorrectedUrl(URL.createObjectURL(blob));
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setError('');
    setCorrectedUrl(null);
    setRotationDeg(0);
    setOriginalUrl(URL.createObjectURL(file));
    setStatus('processing');
    setProgress(0);
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const config: Config = {
        output: { format: 'image/png' },
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) setProgress(Math.round((current / total) * 100));
        },
      };
      const publicPath = process.env.NEXT_PUBLIC_IMGLY_PUBLIC_PATH;
      if (publicPath) config.publicPath = publicPath;
      const cut = await removeBackground(file, config);

      const img = new Image();
      img.onload = async () => {
        const base = toBaseCanvas(img);
        baseRef.current = base;
        tiltRef.current = detectTilt(base);
        await reRender(0);
        setStatus('ready');
      };
      img.onerror = () => {
        setStatus('error');
        setError('No se pudo procesar el recorte.');
      };
      img.src = URL.createObjectURL(cut);
    } catch (err) {
      setStatus('error');
      setError((err as Error).message);
    }
  }

  function onRotate(e: React.ChangeEvent<HTMLInputElement>) {
    const deg = Number(e.target.value);
    setRotationDeg(deg);
    void reRender(deg);
  }

  function save() {
    const blob = blobRef.current;
    if (!blob) return;
    const fd = new FormData();
    fd.append('file', blob, `${sku}-tryon.png`);
    startSaving(async () => {
      const res = await setTryOnImageAction(productId, { ok: false, message: '' }, fd);
      setResult(res);
      if (res.ok) {
        setStatus('idle');
        setOriginalUrl(null);
        setCorrectedUrl(null);
        baseRef.current = null;
        blobRef.current = null;
      }
    });
  }

  return (
    <div className="uploader">
      <div className="uploader__previews">
        <figure>
          <span className="uploader__label">Montura actual</span>
          {currentTryOn ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="uploader__img is-checker" src={currentTryOn} alt="Montura actual" />
          ) : (
            <div className="uploader__img uploader__img--empty">Sin montura</div>
          )}
        </figure>
        {originalUrl ? (
          <figure>
            <span className="uploader__label">Foto</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="uploader__img" src={originalUrl} alt="Foto original" />
          </figure>
        ) : null}
        {correctedUrl ? (
          <figure>
            <span className="uploader__label">Recorte enderezado</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="uploader__img is-checker" src={correctedUrl} alt="Recorte" />
          </figure>
        ) : null}
      </div>

      {status === 'ready' ? (
        <label className="uploader__rotate">
          Rotación (afinar si sale inclinada): {rotationDeg}°
          <input type="range" min={-45} max={45} step={1} value={rotationDeg} onChange={onRotate} />
        </label>
      ) : null}

      <div className="uploader__actions">
        <label className="btn btn--file">
          Elegir foto…
          <input type="file" accept="image/*" onChange={onFile} hidden />
        </label>
        {status === 'processing' ? (
          <span className="muted">
            Quitando el fondo… {progress > 0 ? `${progress}%` : ''} (la 1ª vez descarga el modelo)
          </span>
        ) : null}
        {status === 'ready' ? (
          <button className="btn btn--primary" type="button" onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar montura'}
          </button>
        ) : null}
      </div>

      {status === 'error' ? (
        <p className="alert alert--err">No se pudo quitar el fondo: {error}</p>
      ) : null}
      {result?.message ? (
        <p className={result.ok ? 'alert alert--ok' : 'alert alert--err'}>{result.message}</p>
      ) : null}
    </div>
  );
}
