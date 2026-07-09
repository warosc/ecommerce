import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import type { CartDto } from '@optimus/contracts';
import { AddToCartUseCase } from '../../application/use-cases/cart/add-to-cart.usecase';
import { GetCartUseCase } from '../../application/use-cases/cart/get-cart.usecase';
import { RemoveFromCartUseCase } from '../../application/use-cases/cart/remove-from-cart.usecase';
import { SetCartItemQuantityUseCase } from '../../application/use-cases/cart/set-cart-item-quantity.usecase';
import { AddCartItemRequestDto } from './dto/add-cart-item.request.dto';
import { SetCartItemQuantityRequestDto } from './dto/set-cart-item-quantity.request.dto';
import { toCartDto } from './dto/response.dto';

@Controller('cart')
export class CartController {
  constructor(
    private readonly getCart: GetCartUseCase,
    private readonly addToCart: AddToCartUseCase,
    private readonly removeFromCart: RemoveFromCartUseCase,
    private readonly setQuantity: SetCartItemQuantityUseCase,
  ) {}

  @Get(':cartId')
  async get(@Param('cartId') cartId: string): Promise<CartDto> {
    return toCartDto(await this.getCart.execute(cartId));
  }

  @Post(':cartId/items')
  @HttpCode(200)
  async add(
    @Param('cartId') cartId: string,
    @Body() body: AddCartItemRequestDto,
  ): Promise<CartDto> {
    return toCartDto(await this.addToCart.execute(cartId, body.sku, body.quantity));
  }

  @Put(':cartId/items/:sku')
  @HttpCode(200)
  async setItemQuantity(
    @Param('cartId') cartId: string,
    @Param('sku') sku: string,
    @Body() body: SetCartItemQuantityRequestDto,
  ): Promise<CartDto> {
    return toCartDto(await this.setQuantity.execute(cartId, sku, body.quantity));
  }

  @Delete(':cartId/items/:sku')
  async remove(
    @Param('cartId') cartId: string,
    @Param('sku') sku: string,
  ): Promise<CartDto> {
    return toCartDto(await this.removeFromCart.execute(cartId, sku));
  }
}
