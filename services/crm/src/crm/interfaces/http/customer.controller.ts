import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import type { CrmCustomerDto, PaginatedResult } from '@optimus/contracts';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { Roles } from '../../../auth/roles.decorator';
import { RolesGuard } from '../../../auth/roles.guard';
import { GetCustomerUseCase } from '../../application/use-cases/get-customer.usecase';
import { ListCustomersUseCase } from '../../application/use-cases/list-customers.usecase';
import { ListCustomersQueryDto } from './dto/list-customers.query.dto';
import { toCrmCustomerDto } from './dto/response.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'vendedor')
export class CustomerController {
  constructor(
    private readonly listCustomers: ListCustomersUseCase,
    private readonly getCustomer: GetCustomerUseCase,
  ) {}

  @Get()
  async list(
    @Query() query: ListCustomersQueryDto,
  ): Promise<PaginatedResult<CrmCustomerDto>> {
    const { items, total } = await this.listCustomers.execute(query);
    const now = new Date();
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 50;
    return {
      data: items.map((c) => toCrmCustomerDto(c, now)),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  @Get(':email')
  async getByEmail(@Param('email') email: string): Promise<CrmCustomerDto> {
    return toCrmCustomerDto(await this.getCustomer.execute(email), new Date());
  }
}
