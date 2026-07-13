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
import { PlacePosOrderUseCase } from '../../application/use-cases/orders/place-pos-order.usecase';
import { ListOrdersQueryDto } from './dto/list-orders.query.dto';
import { PlaceOrderRequestDto } from './dto/place-order.request.dto';
import { PlacePosOrderRequestDto } from './dto/place-pos-order.request.dto';
import { toOrderDto } from './dto/response.dto';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly placeOrder: PlaceOrderUseCase,
    private readonly placePosOrder: PlacePosOrderUseCase,
    private readonly getOrder: GetOrderUseCase,
    private readonly listOrders: ListOrdersUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  async place(@Body() body: PlaceOrderRequestDto): Promise<OrderDto> {
    const order = await this.placeOrder.execute({
      cartId: body.cartId,
      customer: body.customer,
      lensType: body.lensType,
      prescriptionNote: body.prescriptionNote,
    });
    return toOrderDto(order);
  }

  /** Venta en tienda (POS). Requiere sesión de personal (admin o vendedor). */
  @Post('pos')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'vendedor')
  async placePos(@Body() body: PlacePosOrderRequestDto): Promise<OrderDto> {
    const order = await this.placePosOrder.execute({
      lines: body.lines,
      paymentMethod: body.paymentMethod,
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
