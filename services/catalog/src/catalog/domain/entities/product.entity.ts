import { randomUUID } from 'node:crypto';
import { InvalidProductError } from '../errors/invalid-product.error';
import { Money } from '../value-objects/money.vo';
import { Sku } from '../value-objects/sku.vo';
import { ProductType } from '../value-objects/product-type.vo';

/** Datos completos de un producto (usado para hidratar desde persistencia). */
export interface ProductProps {
  id: string;
  sku: Sku;
  name: string;
  description: string;
  type: ProductType;
  brand: string;
  price: Money;
  stock: number;
  images: string[];
  /** URL de la montura para el probador virtual (transparente), o null. */
  tryOnImageUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Datos necesarios para crear un producto nuevo (id/fechas se generan). */
export interface NewProductInput {
  sku: Sku;
  name: string;
  description: string;
  type: ProductType;
  brand: string;
  price: Money;
  stock?: number;
  images?: string[];
  active?: boolean;
}

/**
 * Agregado raíz del contexto Catálogo. Encapsula las invariantes de un producto
 * y expone su estado solo por getters (inmutable desde fuera).
 */
export class Product {
  private constructor(private readonly props: ProductProps) {}

  /** Crea un producto nuevo, generando id (UUID v4) y timestamps. */
  static create(input: NewProductInput): Product {
    const name = input.name?.trim() ?? '';
    if (name.length < 2) {
      throw new InvalidProductError('El nombre debe tener al menos 2 caracteres.');
    }
    const brand = input.brand?.trim() ?? '';
    if (brand.length < 1) {
      throw new InvalidProductError('La marca es obligatoria.');
    }
    const stock = input.stock ?? 0;
    if (!Number.isInteger(stock) || stock < 0) {
      throw new InvalidProductError(`Stock inválido: '${stock}'. Debe ser un entero ≥ 0.`);
    }
    const images = input.images ?? [];
    if (!Array.isArray(images) || images.some((i) => typeof i !== 'string' || i.trim() === '')) {
      throw new InvalidProductError('Las imágenes deben ser una lista de URLs no vacías.');
    }

    const now = new Date();
    return new Product({
      id: randomUUID(),
      sku: input.sku,
      name,
      description: input.description?.trim() ?? '',
      type: input.type,
      brand,
      price: input.price,
      stock,
      images,
      tryOnImageUrl: null,
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Reconstruye un producto desde la capa de persistencia (sin validar de nuevo). */
  static fromPersistence(props: ProductProps): Product {
    return new Product(props);
  }

  get id(): string {
    return this.props.id;
  }
  get sku(): Sku {
    return this.props.sku;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string {
    return this.props.description;
  }
  get type(): ProductType {
    return this.props.type;
  }
  get brand(): string {
    return this.props.brand;
  }
  get price(): Money {
    return this.props.price;
  }
  get stock(): number {
    return this.props.stock;
  }
  get images(): string[] {
    return [...this.props.images];
  }
  get tryOnImageUrl(): string | null {
    return this.props.tryOnImageUrl;
  }
  get active(): boolean {
    return this.props.active;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
