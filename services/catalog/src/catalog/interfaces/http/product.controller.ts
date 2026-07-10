import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { PaginatedResult, ProductDto } from '@optimus/contracts';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { Roles } from '../../../auth/roles.decorator';
import { RolesGuard } from '../../../auth/roles.guard';
import { AddProductImageUseCase } from '../../application/use-cases/add-product-image/add-product-image.usecase';
import { CreateProductUseCase } from '../../application/use-cases/create-product/create-product.usecase';
import { GetProductUseCase } from '../../application/use-cases/get-product/get-product.usecase';
import { ListProductsUseCase } from '../../application/use-cases/list-products/list-products.usecase';
import { SearchProductsUseCase } from '../../application/use-cases/search-products/search-products.usecase';
import { SetProductTryOnImageUseCase } from '../../application/use-cases/set-try-on-image/set-try-on-image.usecase';
import { CreateProductRequestDto } from './dto/create-product.request.dto';
import { ListProductsQueryDto } from './dto/list-products.query.dto';
import { SearchProductsQueryDto } from './dto/search-products.query.dto';
import { toProductDto } from './dto/product.response.dto';

@Controller('products')
export class ProductController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly createProduct: CreateProductUseCase,
    private readonly addProductImage: AddProductImageUseCase,
    private readonly setTryOnImage: SetProductTryOnImageUseCase,
    private readonly searchProducts: SearchProductsUseCase,
  ) {}

  @Get()
  async list(
    @Query() query: ListProductsQueryDto,
  ): Promise<PaginatedResult<ProductDto>> {
    const result = await this.listProducts.execute(query);
    return { data: result.data.map(toProductDto), meta: result.meta };
  }

  /** Búsqueda de texto completo (OpenSearch, con respaldo en BD). */
  @Get('search')
  async search(
    @Query() query: SearchProductsQueryDto,
  ): Promise<PaginatedResult<ProductDto>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const { items, total } = await this.searchProducts.execute({
      q: query.q,
      type: query.type,
      page,
      limit,
    });
    return {
      data: items.map(toProductDto),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<ProductDto> {
    return toProductDto(await this.getProduct.execute(id));
  }

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() body: CreateProductRequestDto): Promise<ProductDto> {
    const product = await this.createProduct.execute({
      sku: body.sku,
      name: body.name,
      description: body.description ?? '',
      type: body.type,
      brand: body.brand,
      priceAmount: body.priceAmount,
      compareAtAmount: body.compareAtAmount,
      currency: body.currency,
      stock: body.stock,
      images: body.images,
    });
    return toProductDto(product);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ProductDto> {
    if (!file) {
      throw new BadRequestException('Falta el archivo "file".');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('El archivo debe ser una imagen.');
    }
    const product = await this.addProductImage.execute(id, {
      buffer: file.buffer,
      filename: file.originalname,
      contentType: file.mimetype,
    });
    return toProductDto(product);
  }

  /**
   * Sube la montura del probador virtual (una por producto, reemplaza la
   * anterior). Debe ser PNG o WebP para conservar la transparencia; un JPG
   * pondría un fondo opaco sobre la cara en el probador.
   */
  @Post(':id/try-on-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadTryOnImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ProductDto> {
    if (!file) {
      throw new BadRequestException('Falta el archivo "file".');
    }
    if (file.mimetype !== 'image/png' && file.mimetype !== 'image/webp') {
      throw new BadRequestException(
        'La montura del probador debe ser PNG o WebP con fondo transparente.',
      );
    }
    const product = await this.setTryOnImage.execute(id, {
      buffer: file.buffer,
      filename: file.originalname,
      contentType: file.mimetype,
    });
    return toProductDto(product);
  }
}
