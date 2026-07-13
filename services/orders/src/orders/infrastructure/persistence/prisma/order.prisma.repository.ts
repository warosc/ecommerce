import { Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import {
  FindManyResult,
  ListOrdersFilter,
  OrderRepository,
} from '../../../domain/repositories/order.repository';
import { OrderMapper } from './order.mapper';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(order: Order): Promise<Order> {
    const record = await this.prisma.order.create({
      data: {
        id: order.id,
        status: OrderMapper.statusToPersistence(order.status),
        channel: order.channel,
        paymentMethod: order.paymentMethod,
        customerName: order.customer.name,
        customerEmail: order.customer.email,
        customerPhone: order.customer.phone ?? null,
        lensType: order.lensType,
        prescriptionNote: order.prescriptionNote,
        totalAmount: order.totalAmount,
        currency: order.currency,
        createdAt: order.createdAt,
        lines: {
          create: order.lines.map((l) => ({
            sku: l.sku,
            name: l.name,
            unitPriceAmount: l.unitPriceAmount,
            quantity: l.quantity,
          })),
        },
      },
      include: { lines: true },
    });
    return OrderMapper.toDomain(record);
  }

  async findById(id: string): Promise<Order | null> {
    const record = await this.prisma.order.findUnique({
      where: { id },
      include: { lines: true },
    });
    return record ? OrderMapper.toDomain(record) : null;
  }

  async findMany(filter: ListOrdersFilter): Promise<FindManyResult> {
    const [records, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: { createdAt: 'desc' },
        include: { lines: true },
      }),
      this.prisma.order.count(),
    ]);
    return { items: records.map(OrderMapper.toDomain), total };
  }
}
