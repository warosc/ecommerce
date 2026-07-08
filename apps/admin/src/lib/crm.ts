import type { CrmCustomerDto, PaginatedResult } from '@optimus/contracts';
import { auth } from '@/auth';

export const CRM_API = process.env.CRM_API_INTERNAL ?? 'http://crm-api:3009/api';

/** Lista de perfiles de cliente del CRM (con segmentos). Requiere sesión. */
export async function fetchCustomers(): Promise<CrmCustomerDto[]> {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) return [];
  const res = await fetch(`${CRM_API}/customers?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const body = (await res.json()) as PaginatedResult<CrmCustomerDto>;
  return body.data;
}
