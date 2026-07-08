import type { CustomerSegment } from '@optimus/contracts';

/** Umbral de gasto acumulado (centavos) para el segmento VIP: Q2,000. */
export const VIP_THRESHOLD = 200_000;
/** Días sin comprar para considerar a un cliente inactivo. */
export const INACTIVE_DAYS = 90;

export interface CustomerProps {
  email: string;
  name: string;
  phone: string | null;
  totalOrders: number;
  totalSpentAmount: number;
  currency: string;
  firstOrderAt: Date;
  lastOrderAt: Date;
}

/**
 * Perfil de cliente del CRM. Se construye y actualiza a partir de los pedidos
 * (eventos), acumulando su historial de compra. Los segmentos son derivados.
 */
export class Customer {
  private constructor(private readonly props: CustomerProps) {}

  /** Crea el perfil a partir del primer pedido del cliente. */
  static fromFirstOrder(input: {
    email: string;
    name: string;
    phone?: string | null;
    amount: number;
    currency: string;
    at: Date;
  }): Customer {
    return new Customer({
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      totalOrders: 1,
      totalSpentAmount: Math.max(0, input.amount),
      currency: input.currency,
      firstOrderAt: input.at,
      lastOrderAt: input.at,
    });
  }

  static fromPersistence(props: CustomerProps): Customer {
    return new Customer(props);
  }

  /** Devuelve una copia con un pedido más acumulado (inmutable). */
  recordOrder(input: {
    name?: string;
    phone?: string | null;
    amount: number;
    at: Date;
  }): Customer {
    return new Customer({
      ...this.props,
      name: input.name?.trim() || this.props.name,
      phone: input.phone?.trim() || this.props.phone,
      totalOrders: this.props.totalOrders + 1,
      totalSpentAmount: this.props.totalSpentAmount + Math.max(0, input.amount),
      lastOrderAt: input.at > this.props.lastOrderAt ? input.at : this.props.lastOrderAt,
    });
  }

  /** Segmentos derivados del comportamiento (referencia temporal inyectada). */
  segments(now: Date): CustomerSegment[] {
    const result: CustomerSegment[] = [];
    if (this.props.totalOrders === 1) result.push('NUEVO');
    if (this.props.totalOrders >= 3) result.push('RECURRENTE');
    if (this.props.totalSpentAmount >= VIP_THRESHOLD) result.push('VIP');
    const days = (now.getTime() - this.props.lastOrderAt.getTime()) / 86_400_000;
    if (days > INACTIVE_DAYS) result.push('INACTIVO');
    return result;
  }

  get email(): string {
    return this.props.email;
  }
  get name(): string {
    return this.props.name;
  }
  get phone(): string | null {
    return this.props.phone;
  }
  get totalOrders(): number {
    return this.props.totalOrders;
  }
  get totalSpentAmount(): number {
    return this.props.totalSpentAmount;
  }
  get currency(): string {
    return this.props.currency;
  }
  get firstOrderAt(): Date {
    return this.props.firstOrderAt;
  }
  get lastOrderAt(): Date {
    return this.props.lastOrderAt;
  }
}
