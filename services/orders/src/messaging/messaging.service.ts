import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { EventPublisher } from '../orders/application/ports/event-publisher';

const EXCHANGE = 'optimus.events';

export interface Subscription {
  queue: string;
  routingKeys: string[];
  handler: (payload: unknown) => Promise<void>;
}

/** Cliente RabbitMQ (amqplib) con reconexión. Implementa EventPublisher. */
@Injectable()
export class MessagingService implements EventPublisher, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagingService.name);
  private readonly url = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@rabbitmq:5672';
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private readonly subscriptions: Subscription[] = [];
  private closing = false;

  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
  }

  async onModuleDestroy(): Promise<void> {
    this.closing = true;
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  registerSubscription(sub: Subscription): void {
    this.subscriptions.push(sub);
    if (this.channel) {
      void this.setupConsumer(sub);
    }
  }

  async publish(routingKey: string, payload: unknown): Promise<void> {
    if (!this.channel) {
      this.logger.warn(`Sin canal RabbitMQ; evento '${routingKey}' no publicado`);
      return;
    }
    this.channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      contentType: 'application/json',
    });
    this.logger.log(`Publicado '${routingKey}'`);
  }

  private async connectWithRetry(attempt = 1): Promise<void> {
    try {
      const connection = await amqp.connect(this.url);
      const channel = await connection.createChannel();
      await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
      this.connection = connection;
      this.channel = channel;

      connection.on('error', (err) =>
        this.logger.error(`Error de conexión RabbitMQ: ${err.message}`),
      );
      connection.on('close', () => {
        this.channel = undefined;
        this.connection = undefined;
        if (!this.closing) {
          this.logger.warn('Conexión RabbitMQ cerrada; reintentando en 3s');
          setTimeout(() => void this.connectWithRetry(), 3000);
        }
      });

      for (const sub of this.subscriptions) {
        await this.setupConsumer(sub);
      }
      this.logger.log('Conectado a RabbitMQ');
    } catch (err) {
      if (attempt >= 20) {
        this.logger.error(`No se pudo conectar a RabbitMQ tras ${attempt} intentos`);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await this.connectWithRetry(attempt + 1);
    }
  }

  private async setupConsumer(sub: Subscription): Promise<void> {
    if (!this.channel) return;
    await this.channel.assertQueue(sub.queue, { durable: true });
    for (const key of sub.routingKeys) {
      await this.channel.bindQueue(sub.queue, EXCHANGE, key);
    }
    await this.channel.consume(sub.queue, (msg) => {
      if (!msg) return;
      const channel = this.channel;
      if (!channel) return;
      void (async () => {
        try {
          const payload = JSON.parse(msg.content.toString());
          await sub.handler(payload);
          channel.ack(msg);
        } catch (err) {
          this.logger.error(`Error procesando '${sub.queue}': ${(err as Error).message}`);
          channel.nack(msg, false, false);
        }
      })();
    });
    this.logger.log(`Suscrito a [${sub.routingKeys.join(', ')}] -> ${sub.queue}`);
  }
}
