import { Inject, Injectable } from '@nestjs/common';
import type { PaginatedResult } from '@optimus/contracts';
import { InventoryItem } from '../../domain/entities/inventory-item.entity';
import {
  INVENTORY_REPOSITORY,
  InventoryRepository,
} from '../../domain/repositories/inventory.repository';

export interface ListInventoryQuery {
  page?: number;
  limit?: number;
  search?: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class ListInventoryUseCase {
  constructor(
    @Inject(INVENTORY_REPOSITORY) private readonly repository: InventoryRepository,
  ) {}

  async execute(query: ListInventoryQuery = {}): Promise<PaginatedResult<InventoryItem>> {
    const page = query.page && query.page >= 1 ? Math.floor(query.page) : DEFAULT_PAGE;
    const limit =
      query.limit && query.limit >= 1
        ? Math.min(Math.floor(query.limit), MAX_LIMIT)
        : DEFAULT_LIMIT;
    const search = query.search?.trim() || undefined;

    const { items, total } = await this.repository.findMany({ page, limit, search });
    return {
      data: items,
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    };
  }
}
