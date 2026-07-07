import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessagingModule } from '../messaging/messaging.module';
import { CreateProductUseCase } from './application/use-cases/create-product/create-product.usecase';
import { GetProductUseCase } from './application/use-cases/get-product/get-product.usecase';
import { ListProductsUseCase } from './application/use-cases/list-products/list-products.usecase';
import { UpdateProductStockUseCase } from './application/use-cases/update-product-stock/update-product-stock.usecase';
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository';
import { StockChangedConsumer } from './infrastructure/messaging/stock-changed.consumer';
import { PrismaService } from './infrastructure/persistence/prisma/prisma.service';
import { PrismaProductRepository } from './infrastructure/persistence/prisma/product.prisma.repository';
import { ProductController } from './interfaces/http/product.controller';

/**
 * Módulo del contexto Catálogo. Aquí se cablea la regla de dependencia:
 * el puerto PRODUCT_REPOSITORY (dominio) se bindea al adaptador Prisma
 * (infraestructura). Sustituir el adaptador no toca dominio ni aplicación.
 */
@Module({
  imports: [AuthModule, MessagingModule],
  controllers: [ProductController],
  providers: [
    PrismaService,
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
    ListProductsUseCase,
    GetProductUseCase,
    CreateProductUseCase,
    UpdateProductStockUseCase,
    StockChangedConsumer,
  ],
})
export class CatalogModule {}
