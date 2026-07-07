export const IMAGE_STORAGE = Symbol('IMAGE_STORAGE');

export interface UploadImageInput {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

/** Puerto de almacenamiento de objetos (imágenes). Implementado con MinIO. */
export interface ImageStorage {
  /** Sube el objeto y devuelve su URL pública. */
  upload(keyPrefix: string, input: UploadImageInput): Promise<string>;
}
