export const FIELD_ENCRYPTOR = Symbol('FIELD_ENCRYPTOR');

/**
 * Cifra/descifra campos sensibles a nivel de aplicación (cifrado en reposo).
 * El texto cifrado incluye el IV y el tag de autenticación.
 */
export interface FieldEncryptor {
  encrypt(plaintext: string): string;
  decrypt(cipher: string): string;
}
