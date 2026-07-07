import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessagingModule } from '../messaging/messaging.module';
import { CATALOG_GATEWAY } from './application/ports/catalog.gateway';
import { INVENTORY_GATEWAY } from './application/ports/inventory.gateway';
import { AddToCartUseCase } from './application/use-cases/cart/add-to-cart.usecase';
import { GetCartUseCase } from './application/use-cases/cart/get-cart.usecase';
import { RemoveFromCartUseCase } from './application/use-cases/cart/remove-from-cart.usecase';
import { GetOrderUseCase } from './application/use-cases/orders/get-order.usecase';
import { ListOrdersUseCase } from './application/use-cases/orders/list-orders.usecase';
import { PlaceOrderUseCase } from './application/use-cases/orders/place-order.usecase';
import { CART_REPOSITORY } from './domain/repositories/cart.repository';
import { ORDER_REPOSITORY } from './domain/repositories/order.repository';
import { HttpCatalogGateway } from './infrastructure/gateways/http-catalog.gateway';
import { HttpInventoryGateway } from './infrastructure/gateways/http-inventory.gateway';
import { PrismaService } from './infrastructure/persistence/prisma/prisma.service';
import { PrismaOrderRepository } from './infrastructure/persistence/prisma/order.prisma.repository';
import { RedisCartRepository } from './infrastructure/redis/redis-cart.repository';
import { RedisService } from './infrastructure/redis/redis.service';
import { CartController } from './interfaces/http/cart.controller';
import { OrdersController } from './interfaces/http/orders.controller';

@Module({
  imports: [AuthModule, MessagingModule],
  controllers: [CartController, OrdersController],
  providers: [
    PrismaService,
    RedisService,
    { provide: CART_REPOSITORY, useClass: RedisCartRepository },
    { provide: ORDER_REPOSITORY, useClass: PrismaOrderRepository },
    { provide: CATALOG_GATEWAY, useClass: HttpCatalogGateway },
    { provide: INVENTORY_GATEWAY, useClass: HttpInventoryGateway },
    AddToCartUseCase,
    GetCartUseCase,
    RemoveFromCartUseCase,
    PlaceOrderUseCase,
    GetOrderUseCase,
    ListOrdersUseCase,
  ],
})
export class OrdersModule {}
