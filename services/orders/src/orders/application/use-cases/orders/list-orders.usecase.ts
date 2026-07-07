import { Inject, Injectable } from '@nestjs/common';
import type { PaginatedResult } from '@optimus/contracts';
import { Order } from '../../../domain/entities/order.entity';
import {
  ORDER_REPOSITORY,
  OrderRepository,
} from '../../../domain/repositories/order.repository';

export interface ListOrdersQuery {
  page?: number;
  limit?: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class ListOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: OrderRepository,
  ) {}

  async execute(query: ListOrdersQuery = {}): Promise<PaginatedResult<Order>> {
    const page = query.page && query.page >= 1 ? Math.floor(query.page) : DEFAULT_PAGE;
    const limit =
      query.limit && query.limit >= 1
        ? Math.min(Math.floor(query.limit), MAX_LIMIT)
        : DEFAULT_LIMIT;

    const { items, total } = await this.orderRepository.findMany({ page, limit });
    return {
      data: items,
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    };
  }
}
