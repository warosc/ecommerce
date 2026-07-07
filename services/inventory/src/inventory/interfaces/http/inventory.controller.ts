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
import type {
  InventoryItemDto,
  PaginatedResult,
  StockMovementDto,
} from '@optimus/contracts';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { Roles } from '../../../auth/roles.decorator';
import { RolesGuard } from '../../../auth/roles.guard';
import { GetInventoryItemUseCase } from '../../application/use-cases/get-inventory-item.usecase';
import { ListInventoryUseCase } from '../../application/use-cases/list-inventory.usecase';
import { ListMovementsUseCase } from '../../application/use-cases/list-movements.usecase';
import { RegisterMovementUseCase } from '../../application/use-cases/register-movement.usecase';
import { ListInventoryQueryDto } from './dto/list-inventory.query.dto';
import { RegisterMovementRequestDto } from './dto/register-movement.request.dto';
import { toInventoryItemDto, toStockMovementDto } from './dto/inventory.response.dto';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly listInventory: ListInventoryUseCase,
    private readonly getItem: GetInventoryItemUseCase,
    private readonly listMovements: ListMovementsUseCase,
    private readonly registerMovement: RegisterMovementUseCase,
  ) {}

  @Get()
  async list(
    @Query() query: ListInventoryQueryDto,
  ): Promise<PaginatedResult<InventoryItemDto>> {
    const result = await this.listInventory.execute(query);
    return { data: result.data.map(toInventoryItemDto), meta: result.meta };
  }

  @Get(':sku')
  async getBySku(@Param('sku') sku: string): Promise<InventoryItemDto> {
    return toInventoryItemDto(await this.getItem.execute(sku));
  }

  @Get(':sku/movements')
  async movements(@Param('sku') sku: string): Promise<StockMovementDto[]> {
    const movements = await this.listMovements.execute(sku);
    return movements.map(toStockMovementDto);
  }

  @Post(':sku/movements')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async register(
    @Param('sku') sku: string,
    @Body() body: RegisterMovementRequestDto,
  ): Promise<InventoryItemDto> {
    const item = await this.registerMovement.execute(sku, {
      type: body.type,
      quantity: body.quantity,
      reason: body.reason,
    });
    return toInventoryItemDto(item);
  }
}
