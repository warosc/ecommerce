import { Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';

/** Provee el cliente RabbitMQ (consumo) para el CRM. */
@Module({
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
