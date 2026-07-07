import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { OrderDto, PaginatedResult } from '@optimus/contracts';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { Roles } from '../../../auth/roles.decorator';
import { RolesGuard } from '../../../auth/roles.guard';
import { GetOrderUseCase } from '../../application/use-cases/orders/get-order.usecase';
import { ListOrdersUseCase } from '../../application/use-cases/orders/list-orders.usecase';
import { PlaceOrderUseCase } from '../../application/use-cases/orders/place-order.usecase';
import { ListOrdersQueryDto } from './dto/list-orders.query.dto';
import { PlaceOrderRequestDto } from './dto/place-order.request.dto';
import { toOrderDto } from './dto/response.dto';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly placeOrder: PlaceOrderUseCase,
    private readonly getOrder: GetOrderUseCase,
    private readonly listOrders: ListOrdersUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  async place(@Body() body: PlaceOrderRequestDto): Promise<OrderDto> {
    const order = await this.placeOrder.execute({
      cartId: body.cartId,
      customer: body.customer,
    });
    return toOrderDto(order);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async list(@Query() query: ListOrdersQueryDto): Promise<PaginatedResult<OrderDto>> {
    const result = await this.listOrders.execute(query);
    return { data: result.data.map(toOrderDto), meta: result.meta };
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<OrderDto> {
    return toOrderDto(await this.getOrder.execute(id));
  }
}
