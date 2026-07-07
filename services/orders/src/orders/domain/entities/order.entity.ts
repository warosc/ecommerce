import { randomUUID } from 'node:crypto';
import { InvalidOrderError } from '../errors';
import { Customer } from '../value-objects/customer.vo';

export type OrderStatus = 'PLACED';

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
  customer: Customer;
  lines: OrderLine[];
  totalAmount: number;
  currency: string;
  createdAt: Date;
}

/** Agregado raíz del contexto Pedidos. */
export class Order {
  private constructor(private readonly props: OrderProps) {}

  static create(customer: Customer, lines: OrderLineProps[], currency = 'GTQ'): Order {
    if (!lines || lines.length === 0) {
      throw new InvalidOrderError('Un pedido debe tener al menos una línea.');
    }
    const orderLines = lines.map((l) => {
      if (!Number.isInteger(l.quantity) || l.quantity < 1) {
        throw new InvalidOrderError(`Cantidad inválida para '${l.sku}'.`);
      }
      return new OrderLine(l);
    });
    const totalAmount = orderLines.reduce((sum, l) => sum + l.lineTotal, 0);
    return new Order({
      id: randomUUID(),
      status: 'PLACED',
      customer,
      lines: orderLines,
      totalAmount,
      currency,
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
  get customer(): Customer {
    return this.props.customer;
  }
  get lines(): OrderLine[] {
    return [...this.props.lines];
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
