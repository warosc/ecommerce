import { Order } from '../entities/order.entity';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface ListOrdersFilter {
  page: number;
  limit: number;
}

export interface FindManyResult {
  items: Order[];
  total: number;
}

/** Puerto de persistencia de pedidos (implementado con Prisma/Postgres). */
export interface OrderRepository {
  create(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findMany(filter: ListOrdersFilter): Promise<FindManyResult>;
}
