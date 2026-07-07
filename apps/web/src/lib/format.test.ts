import { describe, expect, it } from 'vitest';
import { formatPrice } from './format';

describe('formatPrice', () => {
  it('convierte centavos a la unidad principal', () => {
    expect(formatPrice(45000, 'GTQ')).toMatch(/450[.,]00/);
  });

  it('formatea el importe cero', () => {
    expect(formatPrice(0, 'GTQ')).toMatch(/0[.,]00/);
  });

  it('incluye el símbolo/código de la moneda', () => {
    const formatted = formatPrice(12500, 'GTQ');
    expect(formatted).toMatch(/Q|GTQ/);
  });
});
