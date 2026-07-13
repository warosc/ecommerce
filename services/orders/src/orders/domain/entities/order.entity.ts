import { randomUUID } from 'node:crypto';
import { InvalidOrderError } from '../errors';
import { Customer } from '../value-objects/customer.vo';

export type OrderStatus = 'PLACED';
export type OrderChannel = 'WEB' | 'POS';
export type PaymentMethod = 'CASH' | 'CARD';
export type LensType = 'SIN_GRADUACION' | 'MONOFOCAL' | 'PROGRESIVO' | 'OCUPACIONAL';

const LENS_TYPES: readonly LensType[] = [
  'SIN_GRADUACION',
  'MONOFOCAL',
  'PROGRESIVO',
  'OCUPACIONAL',
];

export interface OrderLineProps {
  sku: string;
  name: string;
  unitPriceAmount: number;
  quantity: number;
}

export class OrderLine {
  constructor(private readonly props: OrderLineProps) {}
  get sku(): string {
    return this.props.sku;
  }
  get name(): string {
    return this.props.name;
  }
  get unitPriceAmount(): number {
    return this.props.unitPriceAmount;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get lineTotal(): number {
    return this.props.unitPriceAmount * this.props.quantity;
  }
}

export interface OrderProps {
  id: string;
  status: OrderStatus;
  channel: OrderChannel;
  paymentMethod: PaymentMethod | null;
  customer: Customer;
  lines: OrderLine[];
  lensType: LensType | null;
  prescriptionNote: string | null;
  totalAmount: number;
  currency: string;
  createdAt: Date;
}

export interface CreateOrderOptions {
  currency?: string;
  channel?: OrderChannel;
  paymentMethod?: PaymentMethod | null;
  lensType?: LensType | null;
  prescriptionNote?: string | null;
}

/** Agregado raíz del contexto Pedidos. */
export class Order {
  private constructor(private readonly props: OrderProps) {}

  static create(
    customer: Customer,
    lines: OrderLineProps[],
    options: CreateOrderOptions = {},
  ): Order {
    if (!lines || lines.length === 0) {
      throw new InvalidOrderError('Un pedido debe tener al menos una línea.');
    }
    const orderLines = lines.map((l) => {
      if (!Number.isInteger(l.quantity) || l.quantity < 1) {
        throw new InvalidOrderError(`Cantidad inválida para '${l.sku}'.`);
      }
      return new OrderLine(l);
    });
    const lensType = options.lensType ?? null;
    if (lensType !== null && !LENS_TYPES.includes(lensType)) {
      throw new InvalidOrderError(`Tipo de lente inválido: '${lensType}'.`);
    }
    const noteRaw = options.prescriptionNote?.trim();
    const prescriptionNote = noteRaw ? noteRaw : null;
    if (prescriptionNote !== null && prescriptionNote.length > 500) {
      throw new InvalidOrderError('La receta no debe exceder 500 caracteres.');
    }

    const totalAmount = orderLines.reduce((sum, l) => sum + l.lineTotal, 0);
    return new Order({
      id: randomUUID(),
      status: 'PLACED',
      channel: options.channel ?? 'WEB',
      paymentMethod: options.paymentMethod ?? null,
      customer,
      lines: orderLines,
      lensType,
      prescriptionNote,
      totalAmount,
      currency: options.currency ?? 'GTQ',
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: OrderProps): Order {
    return new Order(props);
  }

  get id(): string {
    return this.props.id;
  }
  get status(): OrderStatus {
    return this.props.status;
  }
  get channel(): OrderChannel {
    return this.props.channel;
  }
  get paymentMethod(): PaymentMethod | null {
    return this.props.paymentMethod;
  }
  get customer(): Customer {
    return this.props.customer;
  }
  get lines(): OrderLine[] {
    return [...this.props.lines];
  }
  get lensType(): LensType | null {
    return this.props.lensType;
  }
  get prescriptionNote(): string | null {
    return this.props.prescriptionNote;
  }
  get totalAmount(): number {
    return this.props.totalAmount;
  }
  get currency(): string {
    return this.props.currency;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
}
