import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

/** Cliente Redis (ioredis) gestionado por el ciclo de vida del módulo. */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  onModuleInit(): void {
    this.client = new Redis(process.env.REDIS_URL ?? 'redis://redis:6379', {
      maxRetriesPerRequest: null,
      lazyConnect: false,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit().catch(() => undefined);
  }

  getClient(): Redis {
    return this.client;
  }
}
