'use client';

import { useState } from 'react';

/** Galería de producto: imagen principal + miniaturas para cambiarla. */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <div className="pdp__image card__img--placeholder" aria-hidden="true" />;
  }

  return (
    <div className="pdp__gallery">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pdp__image" src={images[active]} alt={alt} />
      {images.length > 1 ? (
        <div className="pdp__thumbs">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`pdp__thumb ${i === active ? 'is-active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Imagen ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
