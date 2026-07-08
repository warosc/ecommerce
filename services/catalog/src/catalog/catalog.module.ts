import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessagingModule } from '../messaging/messaging.module';
import { IMAGE_STORAGE } from './application/ports/image-storage';
import { PRODUCT_SEARCH } from './application/ports/product-search';
import { AddProductImageUseCase } from './application/use-cases/add-product-image/add-product-image.usecase';
import { CreateProductUseCase } from './application/use-cases/create-product/create-product.usecase';
import { GetProductUseCase } from './application/use-cases/get-product/get-product.usecase';
import { ListProductsUseCase } from './application/use-cases/list-products/list-products.usecase';
import { SearchProductsUseCase } from './application/use-cases/search-products/search-products.usecase';
import { SetProductTryOnImageUseCase } from './application/use-cases/set-try-on-image/set-try-on-image.usecase';
import { UpdateProductStockUseCase } from './application/use-cases/update-product-stock/update-product-stock.usecase';
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository';
import { StockChangedConsumer } from './infrastructure/messaging/stock-changed.consumer';
import { PrismaService } from './infrastructure/persistence/prisma/prisma.service';
import { PrismaProductRepository } from './infrastructure/persistence/prisma/product.prisma.repository';
import { OpenSearchProductIndex } from './infrastructure/search/opensearch-product.index';
import { SearchIndexInitializer } from './infrastructure/search/search-index.initializer';
import { MinioStorageService } from './infrastructure/storage/minio-storage.service';
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
    { provide: IMAGE_STORAGE, useClass: MinioStorageService },
    { provide: PRODUCT_SEARCH, useClass: OpenSearchProductIndex },
    ListProductsUseCase,
    GetProductUseCase,
    CreateProductUseCase,
    UpdateProductStockUseCase,
    AddProductImageUseCase,
    SetProductTryOnImageUseCase,
    SearchProductsUseCase,
    SearchIndexInitializer,
    StockChangedConsumer,
  ],
})
export class CatalogModule {}
