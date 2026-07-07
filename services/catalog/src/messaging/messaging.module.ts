import { Module } from '@nestjs/common';
import { EVENT_PUBLISHER } from '../catalog/application/ports/event-publisher';
import { MessagingService } from './messaging.service';

@Module({
  providers: [
    MessagingService,
    { provide: EVENT_PUBLISHER, useExisting: MessagingService },
  ],
  exports: [MessagingService, EVENT_PUBLISHER],
})
export class MessagingModule {}
