'use server';

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
      const created = (await res.json()) as { sku: string; name: string };
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
