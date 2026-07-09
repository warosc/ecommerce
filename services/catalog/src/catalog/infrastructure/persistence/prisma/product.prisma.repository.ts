import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Product } from '../../../domain/entities/product.entity';
import {
  FindManyResult,
  ListProductsFilter,
  ProductRepository,
} from '../../../domain/repositories/product.repository';
import { ProductMapper } from './product.mapper';
import { PrismaService } from './prisma.service';

/** Adaptador de persistencia del puerto ProductRepository sobre PostgreSQL/Prisma. */
@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filter: ListProductsFilter): Promise<FindManyResult> {
    const where: Prisma.ProductWhereInput = {};
    if (filter.type) {
      where.type = filter.type;
    }
    if (filter.brand) {
      where.brand = { contains: filter.brand, mode: 'insensitive' };
    }
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { sku: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      filter.sort === 'price_asc'
        ? { priceAmount: 'asc' }
        : filter.sort === 'price_desc'
          ? { priceAmount: 'desc' }
          : { createdAt: 'desc' };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: records.map(ProductMapper.toDomain), total };
  }

  async findById(id: string): Promise<Product | null> {
    const record = await this.prisma.product.findUnique({ where: { id } });
    return record ? ProductMapper.toDomain(record) : null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const record = await this.prisma.product.findUnique({ where: { sku } });
    return record ? ProductMapper.toDomain(record) : null;
  }

  async create(product: Product): Promise<Product> {
    const record = await this.prisma.product.create({
      data: ProductMapper.toPersistence(product),
    });
    return ProductMapper.toDomain(record);
  }

  async updateStockBySku(sku: string, stock: number): Promise<void> {
    await this.prisma.product.updateMany({ where: { sku }, data: { stock } });
  }

  async appendImage(id: string, url: string): Promise<Product | null> {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) return null;
    const record = await this.prisma.product.update({
      where: { id },
      data: { images: { push: url } },
    });
    return ProductMapper.toDomain(record);
  }

  async setTryOnImage(id: string, url: string): Promise<Product | null> {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) return null;
    const record = await this.prisma.product.update({
      where: { id },
      data: { tryOnImageUrl: url },
    });
    return ProductMapper.toDomain(record);
  }
}
