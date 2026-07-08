import { AesFieldEncryptor } from '../../src/clinic/infrastructure/crypto/aes-field-encryptor';
import { FIELD_ENCRYPTOR } from '../../src/clinic/application/ports/field-encryptor';

const KEY_HEX = 'a'.repeat(64); // 32 bytes en hex

it('expone el token de inyección del puerto', () => {
  expect(typeof FIELD_ENCRYPTOR).toBe('symbol');
});

describe('AesFieldEncryptor', () => {
  const enc = new AesFieldEncryptor(KEY_HEX);

  it('cifra y descifra (ida y vuelta)', () => {
    const plain = JSON.stringify({ od: { sphere: -1.25, axis: 90 }, pd: 63 });
    const cipher = enc.encrypt(plain);
    expect(cipher.startsWith('v1.')).toBe(true);
    expect(cipher).not.toContain(plain);
    expect(enc.decrypt(cipher)).toBe(plain);
  });

  it('genera cifrados distintos para el mismo texto (IV aleatorio)', () => {
    expect(enc.encrypt('hola')).not.toBe(enc.encrypt('hola'));
  });

  it('detecta manipulación (tag GCM) al descifrar', () => {
    const cipher = enc.encrypt('secreto');
    const tampered = `v1.${Buffer.from('x'.repeat(60)).toString('base64')}`;
    expect(() => enc.decrypt(tampered)).toThrow();
  });

  it('rechaza formato desconocido', () => {
    expect(() => enc.decrypt('sinversion')).toThrow();
  });

  it('rechaza una clave de tamaño inválido', () => {
    expect(() => new AesFieldEncryptor('corta')).toThrow();
  });

  it('acepta clave en base64 de 32 bytes', () => {
    const b64 = Buffer.alloc(32, 7).toString('base64');
    const e = new AesFieldEncryptor(b64);
    expect(e.decrypt(e.encrypt('x'))).toBe('x');
  });
});
