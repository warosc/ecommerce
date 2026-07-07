import { InvalidProductError } from '../errors/invalid-product.error';

/**
 * SKU (Stock Keeping Unit). Value Object inmutable: se normaliza a mayúsculas y
 * se valida el formato (alfanumérico con guiones, 2–32 caracteres).
 */
export class Sku {
  private static readonly PATTERN = /^[A-Z0-9][A-Z0-9-]{1,31}$/;

  private constructor(public readonly value: string) {}

  static create(raw: string): Sku {
    const normalized = (raw ?? '').trim().toUpperCase();
    if (!Sku.PATTERN.test(normalized)) {
      throw new InvalidProductError(
        `SKU inválido: '${raw}'. Debe ser alfanumérico (guiones permitidos), 2–32 caracteres.`,
      );
    }
    return new Sku(normalized);
  }

  equals(other: Sku): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
