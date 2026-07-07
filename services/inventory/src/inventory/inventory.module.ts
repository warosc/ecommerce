import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessagingModule } from '../messaging/messaging.module';
import { INVENTORY_REPOSITORY } from './domain/repositories/inventory.repository';
import { CreateInventoryItemUseCase } from './application/use-cases/create-inventory-item.usecase';
import { GetInventoryItemUseCase } from './application/use-cases/get-inventory-item.usecase';
import { ListInventoryUseCase } from './application/use-cases/list-inventory.usecase';
import { ListMovementsUseCase } from './application/use-cases/list-movements.usecase';
import { RegisterMovementUseCase } from './application/use-cases/register-movement.usecase';
import { OrderPlacedConsumer } from './infrastructure/messaging/order-placed.consumer';
import { ProductCreatedConsumer } from './infrastructure/messaging/product-created.consumer';
import { PrismaService } from './infrastructure/persistence/prisma/prisma.service';
import { PrismaInventoryRepository } from './infrastructure/persistence/prisma/inventory.prisma.repository';
import { InventoryController } from './interfaces/http/inventory.controller';

@Module({
  imports: [AuthModule, MessagingModule],
  controllers: [InventoryController],
  providers: [
    PrismaService,
    { provide: INVENTORY_REPOSITORY, useClass: PrismaInventoryRepository },
    CreateInventoryItemUseCase,
    GetInventoryItemUseCase,
    ListInventoryUseCase,
    ListMovementsUseCase,
    RegisterMovementUseCase,
    ProductCreatedConsumer,
    OrderPlacedConsumer,
  ],
})
export class InventoryModule {}
