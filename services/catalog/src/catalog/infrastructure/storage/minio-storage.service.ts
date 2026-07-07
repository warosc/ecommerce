import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { ImageStorage, UploadImageInput } from '../../application/ports/image-storage';

/**
 * Almacenamiento de imágenes en MinIO (S3). Al iniciar, asegura que el bucket
 * exista y tenga política de lectura pública, para servir las imágenes por URL.
 */
@Injectable()
export class MinioStorageService implements ImageStorage, OnModuleInit {
  private readonly logger = new Logger(MinioStorageService.name);
  private readonly bucket = process.env.MINIO_BUCKET ?? 'product-images';
  private readonly publicUrl = (process.env.MINIO_PUBLIC_URL ?? 'http://localhost:9000').replace(
    /\/$/,
    '',
  );
  private client!: Minio.Client;

  async onModuleInit(): Promise<void> {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT ?? 'minio',
      port: Number(process.env.MINIO_PORT ?? 9000),
      useSSL: (process.env.MINIO_USE_SSL ?? 'false') === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    });
    await this.ensureBucketWithRetry();
  }

  private async ensureBucketWithRetry(attempt = 1): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, '');
        this.logger.log(`Bucket '${this.bucket}' creado`);
      }
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucket}/*`],
          },
        ],
      };
      await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
      this.logger.log(`Bucket '${this.bucket}' listo (lectura pública)`);
    } catch (err) {
      if (attempt >= 10) {
        this.logger.error(
          `No se pudo preparar el bucket MinIO tras ${attempt} intentos: ${(err as Error).message}`,
        );
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await this.ensureBucketWithRetry(attempt + 1);
    }
  }

  async upload(keyPrefix: string, input: UploadImageInput): Promise<string> {
    const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${keyPrefix}/${randomUUID()}-${safeName}`;
    await this.client.putObject(this.bucket, key, input.buffer, input.buffer.length, {
      'Content-Type': input.contentType,
    });
    return `${this.publicUrl}/${this.bucket}/${key}`;
  }
}
