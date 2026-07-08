'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export interface CreateProductState {
  ok: boolean;
  message: string;
}

const CATALOG_API =
  process.env.CATALOG_API_INTERNAL ?? 'http://catalog-api:3001/api';

/**
 * Server action: crea un producto llamando al POST protegido del Catálogo,
 * reenviando el access_token de Keycloak del usuario como Bearer. El token nunca
 * se expone al navegador (la llamada ocurre en el servidor).
 */
export async function createProduct(
  _prevState: CreateProductState,
  formData: FormData,
): Promise<CreateProductState> {
  const session = await auth();
  const token = session?.accessToken;

  if (!token) {
    return { ok: false, message: 'No autenticado. Inicia sesión de nuevo.' };
  }

  const body = {
    sku: String(formData.get('sku') ?? '').trim(),
    name: String(formData.get('name') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    type: String(formData.get('type') ?? 'FRAME'),
    brand: String(formData.get('brand') ?? '').trim(),
    priceAmount: Number(formData.get('priceAmount') ?? 0),
    stock: Number(formData.get('stock') ?? 0),
  };

  try {
    const res = await fetch(`${CATALOG_API}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (res.status === 201) {
      const created = (await res.json()) as { id: string; sku: string; name: string };

      // Subida opcional de imagen a MinIO (vía el endpoint del Catálogo).
      const image = formData.get('image');
      if (image instanceof File && image.size > 0) {
        const fd = new FormData();
        fd.append('file', image, image.name);
        const up = await fetch(`${CATALOG_API}/products/${created.id}/images`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!up.ok) {
          return {
            ok: true,
            message: `Producto ${created.sku} creado, pero la imagen falló (HTTP ${up.status}).`,
          };
        }
      }

      // Subida opcional de la montura para el probador virtual (PNG/WebP transparente).
      const tryOn = formData.get('tryOnImage');
      if (tryOn instanceof File && tryOn.size > 0) {
        const fd = new FormData();
        fd.append('file', tryOn, tryOn.name);
        const up = await fetch(`${CATALOG_API}/products/${created.id}/try-on-image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!up.ok) {
          const detail = await up.text();
          return {
            ok: true,
            message: `Producto ${created.sku} creado, pero la montura del probador falló (HTTP ${up.status}): ${detail}`,
          };
        }
      }

      return { ok: true, message: `Producto creado: ${created.sku} — ${created.name}` };
    }
    if (res.status === 401) {
      return { ok: false, message: 'Sesión no válida (401). Vuelve a iniciar sesión.' };
    }
    if (res.status === 403) {
      return { ok: false, message: 'No tienes permisos de administrador (403).' };
    }
    if (res.status === 409) {
      return { ok: false, message: 'Ya existe un producto con ese SKU (409).' };
    }
    const detail = await res.text();
    return { ok: false, message: `Error ${res.status}: ${detail}` };
  } catch (error) {
    return {
      ok: false,
      message: `No se pudo contactar la API de Catálogo: ${(error as Error).message}`,
    };
  }
}

/**
 * Server action: fija la montura del probador de un producto **existente**.
 * Recibe el PNG transparente (ya recortado en el navegador) y lo reenvía al
 * endpoint protegido del Catálogo con el Bearer del usuario. El token no se
 * expone al navegador (la llamada ocurre en el servidor).
 */
export async function setTryOnImageAction(
  productId: string,
  _prevState: CreateProductState,
  formData: FormData,
): Promise<CreateProductState> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) {
    return { ok: false, message: 'No autenticado. Inicia sesión de nuevo.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Falta la imagen recortada.' };
  }

  try {
    const fd = new FormData();
    fd.append('file', file, file.name || 'tryon.png');
    const res = await fetch(`${CATALOG_API}/products/${productId}/try-on-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    if (res.ok) {
      revalidatePath('/productos');
      return { ok: true, message: 'Montura del probador guardada.' };
    }
    if (res.status === 401) {
      return { ok: false, message: 'Sesión no válida (401). Vuelve a iniciar sesión.' };
    }
    if (res.status === 403) {
      return { ok: false, message: 'No tienes permisos de administrador (403).' };
    }
    if (res.status === 404) {
      return { ok: false, message: 'El producto ya no existe (404).' };
    }
    const detail = await res.text();
    return { ok: false, message: `Error ${res.status}: ${detail}` };
  } catch (error) {
    return {
      ok: false,
      message: `No se pudo contactar la API de Catálogo: ${(error as Error).message}`,
    };
  }
}
