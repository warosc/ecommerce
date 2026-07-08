import { Customer } from '../entities/customer.entity';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

export interface ListCustomersFilter {
  page: number;
  limit: number;
}

export interface FindCustomersResult {
  items: Customer[];
  total: number;
}

/** Puerto de persistencia de perfiles de cliente. */
export interface CustomerRepository {
  findByEmail(email: string): Promise<Customer | null>;
  /** Inserta o reemplaza el perfil (clave: email). */
  save(customer: Customer): Promise<Customer>;
  findMany(filter: ListCustomersFilter): Promise<FindCustomersResult>;
}
