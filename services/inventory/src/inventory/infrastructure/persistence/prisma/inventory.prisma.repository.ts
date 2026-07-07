import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InventoryItem } from '../../../domain/entities/inventory-item.entity';
import { StockMovement } from '../../../domain/entities/stock-movement.entity';
import {
  FindManyResult,
  InventoryRepository,
  ListInventoryFilter,
} from '../../../domain/repositories/inventory.repository';
import { InventoryMapper } from './inventory.mapper';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySku(sku: string): Promise<InventoryItem | null> {
    const record = await this.prisma.inventoryItem.findUnique({ where: { sku } });
    return record ? InventoryMapper.toDomain(record) : null;
  }

  async findMany(filter: ListInventoryFilter): Promise<FindManyResult> {
    const where: Prisma.InventoryItemWhereInput = filter.search
      ? { sku: { contains: filter.search, mode: 'insensitive' } }
      : {};

    const [records, total] = await this.prisma.$transaction([
      this.prisma.inventoryItem.findMany({
        where,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: { sku: 'asc' },
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return { items: records.map(InventoryMapper.toDomain), total };
  }

  async upsert(item: InventoryItem): Promise<InventoryItem> {
    const record = await this.prisma.inventoryItem.upsert({
      where: { sku: item.sku },
      create: {
        sku: item.sku,
        onHand: item.onHand,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
      // Idempotente: si ya existe no se altera.
      update: {},
    });
    return InventoryMapper.toDomain(record);
  }

  async saveMovement(item: InventoryItem, movement: StockMovement): Promise<void> {
    const data = InventoryMapper.movementToPersistence(movement);
    await this.prisma.$transaction([
      this.prisma.inventoryItem.update({
        where: { sku: item.sku },
        data: { onHand: item.onHand, updatedAt: item.updatedAt },
      }),
      this.prisma.stockMovement.create({ data }),
    ]);
  }

  async findMovements(sku: string): Promise<StockMovement[]> {
    const records = await this.prisma.stockMovement.findMany({
      where: { sku },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(InventoryMapper.movementToDomain);
  }
}
