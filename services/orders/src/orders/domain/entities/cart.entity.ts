import { InvalidOrderError } from '../errors';

export interface CartLineProps {
  sku: string;
  name: string;
  unitPriceAmount: number;
  currency: string;
  quantity: number;
}

/** Línea del carrito con su total calculado. */
export class CartLine {
  constructor(private readonly props: CartLineProps) {}

  get sku(): string {
    return this.props.sku;
  }
  get name(): string {
    return this.props.name;
  }
  get unitPriceAmount(): number {
    return this.props.unitPriceAmount;
  }
  get currency(): string {
    return this.props.currency;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get lineTotal(): number {
    return this.props.unitPriceAmount * this.props.quantity;
  }

  withQuantity(quantity: number): CartLine {
    return new CartLine({ ...this.props, quantity });
  }
}

/**
 * Carrito de compra (persistido en Redis). Agrega líneas por SKU y calcula
 * totales. Asume una única moneda por carrito.
 */
export class Cart {
  private constructor(
    private readonly _cartId: string,
    private lines: CartLine[],
  ) {}

  static empty(cartId: string): Cart {
    return new Cart(cartId, []);
  }

  static fromLines(cartId: string, lines: CartLineProps[]): Cart {
    return new Cart(
      cartId,
      lines.map((l) => new CartLine(l)),
    );
  }

  addItem(input: CartLineProps): void {
    if (!Number.isInteger(input.quantity) || input.quantity < 1) {
      throw new InvalidOrderError('La cantidad debe ser un entero ≥ 1.');
    }
    const existing = this.lines.find((l) => l.sku === input.sku);
    if (existing) {
      this.lines = this.lines.map((l) =>
        l.sku === input.sku ? l.withQuantity(l.quantity + input.quantity) : l,
      );
    } else {
      this.lines.push(new CartLine(input));
    }
  }

  removeItem(sku: string): void {
    this.lines = this.lines.filter((l) => l.sku !== sku.toUpperCase());
  }

  /** Fija la cantidad de una línea; si es ≤ 0 la elimina. */
  setItemQuantity(sku: string, quantity: number): void {
    if (!Number.isInteger(quantity)) {
      throw new InvalidOrderError('La cantidad debe ser un entero.');
    }
    const normalized = sku.toUpperCase();
    if (quantity <= 0) {
      this.removeItem(normalized);
      return;
    }
    this.lines = this.lines.map((l) =>
      l.sku === normalized ? l.withQuantity(quantity) : l,
    );
  }

  clear(): void {
    this.lines = [];
  }

  isEmpty(): boolean {
    return this.lines.length === 0;
  }

  get cartId(): string {
    return this._cartId;
  }
  get items(): CartLine[] {
    return [...this.lines];
  }
  get currency(): string {
    return this.lines[0]?.currency ?? 'GTQ';
  }
  get totalAmount(): number {
    return this.lines.reduce((sum, l) => sum + l.lineTotal, 0);
  }
}
