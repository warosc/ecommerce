/**
 * Error base del dominio. No depende del framework HTTP: la capa de
 * presentación traduce cada `code` a un status code (ver DomainExceptionFilter).
 */
export abstract class DomainError extends Error {
  /** Código estable, en MAYÚSCULAS, usado para mapear a HTTP y para clientes. */
  abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
    // Mantiene la cadena de prototipos correcta al transpilar a ES5/ES2022.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
