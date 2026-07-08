import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessagingModule } from '../messaging/messaging.module';
import { GetCustomerUseCase } from './application/use-cases/get-customer.usecase';
import { ListCustomersUseCase } from './application/use-cases/list-customers.usecase';
import { RecordOrderUseCase } from './application/use-cases/record-order.usecase';
import { CUSTOMER_REPOSITORY } from './domain/repositories/customer.repository';
import { OrderPlacedConsumer } from './infrastructure/messaging/order-placed.consumer';
import { PrismaService } from './infrastructure/persistence/prisma/prisma.service';
import { PrismaCustomerRepository } from './infrastructure/persistence/prisma/customer.prisma.repository';
import { CustomerController } from './interfaces/http/customer.controller';

/**
 * Módulo CRM. Construye perfiles de cliente a partir de eventos de pedidos
 * (OrderPlacedConsumer → RecordOrderUseCase) y los expone por HTTP con segmentos.
 */
@Module({
  imports: [AuthModule, MessagingModule],
  controllers: [CustomerController],
  providers: [
    PrismaService,
    { provide: CUSTOMER_REPOSITORY, useClass: PrismaCustomerRepository },
    RecordOrderUseCase,
    ListCustomersUseCase,
    GetCustomerUseCase,
    OrderPlacedConsumer,
  ],
})
export class CrmModule {}
