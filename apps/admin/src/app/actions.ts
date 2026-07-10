'use server';

import type {
  AppointmentStatus,
  EyePrescription,
  OrderDto,
  PaymentMethod,
  Prescription,
} from '@optimus/contracts';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { CLINIC_API } from '@/lib/clinic';

export interface CreateProductState {
  ok: boolean;
  message: string;
}

const CATALOG_API =
  process.env.CATALOG_API_INTERNAL ?? 'http://catalog-api:3001/api';
const ORDERS_API =
  process.env.ORDERS_API_INTERNAL ?? 'http://orders-api:3005/api';

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

  const compareRaw = String(formData.get('compareAtAmount') ?? '').trim();
  const body = {
    sku: String(formData.get('sku') ?? '').trim(),
    name: String(formData.get('name') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    type: String(formData.get('type') ?? 'FRAME'),
    brand: String(formData.get('brand') ?? '').trim(),
    priceAmount: Number(formData.get('priceAmount') ?? 0),
    compareAtAmount: compareRaw ? Number(compareRaw) : undefined,
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

export interface PosSaleResult {
  ok: boolean;
  message: string;
  order?: OrderDto;
}

export interface PosSaleInput {
  lines: { sku: string; quantity: number }[];
  paymentMethod: PaymentMethod;
  customer?: { name: string; email: string; phone?: string };
}

/**
 * Server action: registra una venta de mostrador (POS) en el servicio de Pedidos,
 * reenviando el Bearer del vendedor. Devuelve el pedido creado (para el ticket).
 */
export async function placePosSaleAction(input: PosSaleInput): Promise<PosSaleResult> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) {
    return { ok: false, message: 'No autenticado. Inicia sesión de nuevo.' };
  }
  if (!input.lines || input.lines.length === 0) {
    return { ok: false, message: 'La venta no tiene productos.' };
  }

  try {
    const res = await fetch(`${ORDERS_API}/orders/pos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
      cache: 'no-store',
    });

    if (res.status === 201) {
      const order = (await res.json()) as OrderDto;
      return { ok: true, message: `Venta registrada: ${order.id}`, order };
    }
    if (res.status === 401) {
      return { ok: false, message: 'Sesión no válida (401). Vuelve a iniciar sesión.' };
    }
    if (res.status === 403) {
      return { ok: false, message: 'No tienes permiso de venta (403).' };
    }
    if (res.status === 404) {
      return { ok: false, message: 'Algún producto no existe o no está disponible (404).' };
    }
    if (res.status === 409) {
      return { ok: false, message: 'Stock insuficiente para algún producto (409).' };
    }
    const detail = await res.text();
    return { ok: false, message: `Error ${res.status}: ${detail}` };
  } catch (error) {
    return {
      ok: false,
      message: `No se pudo contactar la API de Pedidos: ${(error as Error).message}`,
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

// ─────────────────────────── Clínica: Pacientes + Agenda ────────────────────

function num(value: FormDataEntryValue | null): number | undefined {
  const s = String(value ?? '').trim();
  if (s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function eyeFrom(formData: FormData, prefix: string): EyePrescription | undefined {
  const eye: EyePrescription = {
    sphere: num(formData.get(`${prefix}_sphere`)),
    cylinder: num(formData.get(`${prefix}_cylinder`)),
    axis: num(formData.get(`${prefix}_axis`)),
    add: num(formData.get(`${prefix}_add`)),
  };
  return Object.values(eye).some((v) => v !== undefined) ? eye : undefined;
}

function prescriptionFrom(formData: FormData): Prescription | undefined {
  const rx: Prescription = {
    od: eyeFrom(formData, 'od'),
    os: eyeFrom(formData, 'os'),
    pd: num(formData.get('pd')),
  };
  return rx.od || rx.os || rx.pd !== undefined ? rx : undefined;
}

/** Registra un paciente en el servicio clínico. */
export async function createPatientAction(
  _prevState: CreateProductState,
  formData: FormData,
): Promise<CreateProductState> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) return { ok: false, message: 'No autenticado. Inicia sesión de nuevo.' };

  const body = {
    firstName: String(formData.get('firstName') ?? '').trim(),
    lastName: String(formData.get('lastName') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim() || undefined,
    email: String(formData.get('email') ?? '').trim() || undefined,
    birthDate: String(formData.get('birthDate') ?? '').trim() || undefined,
  };

  try {
    const res = await fetch(`${CLINIC_API}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    if (res.status === 201) {
      revalidatePath('/pacientes');
      return { ok: true, message: `Paciente creado: ${body.firstName} ${body.lastName}` };
    }
    if (res.status === 401) return { ok: false, message: 'Sesión no válida (401).' };
    if (res.status === 403) return { ok: false, message: 'Sin permiso (403).' };
    const detail = await res.text();
    return { ok: false, message: `Error ${res.status}: ${detail}` };
  } catch (error) {
    return { ok: false, message: `No se pudo contactar la API Clínica: ${(error as Error).message}` };
  }
}

/** Actualiza la graduación y/o notas del expediente (solo admin). */
export async function updateClinicalAction(
  patientId: string,
  _prevState: CreateProductState,
  formData: FormData,
): Promise<CreateProductState> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) return { ok: false, message: 'No autenticado. Inicia sesión de nuevo.' };

  const notes = String(formData.get('notes') ?? '').trim();
  const body: { prescription?: Prescription; notes?: string } = {
    prescription: prescriptionFrom(formData),
    notes: notes || undefined,
  };

  try {
    const res = await fetch(`${CLINIC_API}/patients/${patientId}/clinical`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    if (res.ok) {
      revalidatePath(`/pacientes/${patientId}`);
      return { ok: true, message: 'Expediente actualizado.' };
    }
    if (res.status === 401) return { ok: false, message: 'Sesión no válida (401).' };
    if (res.status === 403) return { ok: false, message: 'Solo el rol clínico (admin) puede editar (403).' };
    if (res.status === 404) return { ok: false, message: 'El paciente ya no existe (404).' };
    const detail = await res.text();
    return { ok: false, message: `Error ${res.status}: ${detail}` };
  } catch (error) {
    return { ok: false, message: `No se pudo contactar la API Clínica: ${(error as Error).message}` };
  }
}

/** Agenda una cita para un paciente. */
export async function createAppointmentAction(
  _prevState: CreateProductState,
  formData: FormData,
): Promise<CreateProductState> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) return { ok: false, message: 'No autenticado. Inicia sesión de nuevo.' };

  const scheduledAtLocal = String(formData.get('scheduledAt') ?? '').trim();
  const body = {
    patientId: String(formData.get('patientId') ?? '').trim(),
    // El <input type=datetime-local> da hora local sin zona; se convierte a ISO.
    scheduledAt: scheduledAtLocal ? new Date(scheduledAtLocal).toISOString() : '',
    reason: String(formData.get('reason') ?? '').trim(),
  };

  try {
    const res = await fetch(`${CLINIC_API}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    if (res.status === 201) {
      revalidatePath('/agenda');
      return { ok: true, message: 'Cita agendada.' };
    }
    if (res.status === 401) return { ok: false, message: 'Sesión no válida (401).' };
    if (res.status === 404) return { ok: false, message: 'El paciente no existe (404).' };
    const detail = await res.text();
    return { ok: false, message: `Error ${res.status}: ${detail}` };
  } catch (error) {
    return { ok: false, message: `No se pudo contactar la API Clínica: ${(error as Error).message}` };
  }
}

/** Cambia el estado de una cita. */
export async function updateAppointmentStatusAction(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<CreateProductState> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) return { ok: false, message: 'No autenticado.' };

  try {
    const res = await fetch(`${CLINIC_API}/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
      cache: 'no-store',
    });
    if (res.ok) {
      revalidatePath('/agenda');
      return { ok: true, message: 'Estado actualizado.' };
    }
    const detail = await res.text();
    return { ok: false, message: `Error ${res.status}: ${detail}` };
  } catch (error) {
    return { ok: false, message: `No se pudo contactar la API Clínica: ${(error as Error).message}` };
  }
}
