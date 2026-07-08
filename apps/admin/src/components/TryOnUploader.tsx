'use client';

import type { Config } from '@imgly/background-removal';
import { useState, useTransition } from 'react';
import { setTryOnImageAction, type CreateProductState } from '@/app/actions';

type Status = 'idle' | 'processing' | 'ready' | 'error';

/**
 * Sube la montura del probador a un producto existente. El recorte del fondo se
 * hace **en el navegador** (@imgly/background-removal): el admin elige una foto
 * normal de la montura y el componente genera el PNG transparente que sube al
 * Catálogo mediante la server action (que añade el Bearer en el servidor).
 */
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
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);
  const [cutout, setCutout] = useState<Blob | null>(null);
  const [result, setResult] = useState<CreateProductState | null>(null);
  const [saving, startSaving] = useTransition();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setError('');
    setCutout(null);
    setCutoutUrl(null);
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
      const blob = await removeBackground(file, config);
      setCutout(blob);
      setCutoutUrl(URL.createObjectURL(blob));
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError((err as Error).message);
    }
  }

  function save() {
    if (!cutout) return;
    const fd = new FormData();
    fd.append('file', cutout, `${sku}-tryon.png`);
    startSaving(async () => {
      const res = await setTryOnImageAction(productId, { ok: false, message: '' }, fd);
      setResult(res);
      if (res.ok) {
        setStatus('idle');
        setOriginalUrl(null);
        setCutoutUrl(null);
        setCutout(null);
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
        {cutoutUrl ? (
          <figure>
            <span className="uploader__label">Recorte (transparente)</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="uploader__img is-checker" src={cutoutUrl} alt="Recorte" />
          </figure>
        ) : null}
      </div>

      <div className="uploader__actions">
        <label className="btn btn--file">
          Elegir foto…
          <input type="file" accept="image/*" onChange={onFile} hidden />
        </label>
        {status === 'processing' ? (
          <span className="muted">Quitando el fondo… {progress > 0 ? `${progress}%` : ''} (la 1ª vez descarga el modelo)</span>
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
