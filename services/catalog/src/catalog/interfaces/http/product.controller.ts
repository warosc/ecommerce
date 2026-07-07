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
import { CreateProductRequestDto } from './dto/create-product.request.dto';
import { ListProductsQueryDto } from './dto/list-products.query.dto';
import { toProductDto } from './dto/product.response.dto';

@Controller('products')
export class ProductController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly createProduct: CreateProductUseCase,
    private readonly addProductImage: AddProductImageUseCase,
  ) {}

  @Get()
  async list(
    @Query() query: ListProductsQueryDto,
  ): Promise<PaginatedResult<ProductDto>> {
    const result = await this.listProducts.execute(query);
    return { data: result.data.map(toProductDto), meta: result.meta };
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
}
