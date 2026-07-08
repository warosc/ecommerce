import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { FieldEncryptor } from '../../application/ports/field-encryptor';

/**
 * Cifrado de campos con AES-256-GCM (autenticado). La clave viene de
 * `CLINIC_ENCRYPTION_KEY` (hex de 64 chars o base64 de 32 bytes). El texto
 * cifrado es `v1.<base64(iv|tag|ct)>`.
 */
@Injectable()
export class AesFieldEncryptor implements FieldEncryptor {
  private readonly key: Buffer;

  constructor(rawKey: string | undefined = process.env.CLINIC_ENCRYPTION_KEY) {
    if (!rawKey) {
      throw new Error('Falta CLINIC_ENCRYPTION_KEY (clave de cifrado en reposo).');
    }
    this.key = /^[0-9a-fA-F]{64}$/.test(rawKey)
      ? Buffer.from(rawKey, 'hex')
      : Buffer.from(rawKey, 'base64');
    if (this.key.length !== 32) {
      throw new Error('CLINIC_ENCRYPTION_KEY debe ser de 32 bytes (hex de 64 o base64).');
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v1.${Buffer.concat([iv, tag, ct]).toString('base64')}`;
  }

  decrypt(cipher: string): string {
    const [version, payload] = cipher.split('.', 2);
    if (version !== 'v1' || !payload) {
      throw new Error('Formato de texto cifrado no reconocido.');
    }
    const buf = Buffer.from(payload, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ct = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  }
}
