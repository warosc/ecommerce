import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { GetCustomerUseCase } from '../../src/crm/application/use-cases/get-customer.usecase';
import { ListCustomersUseCase } from '../../src/crm/application/use-cases/list-customers.usecase';
import { Customer } from '../../src/crm/domain/entities/customer.entity';
import { CUSTOMER_REPOSITORY } from '../../src/crm/domain/repositories/customer.repository';
import { DomainExceptionFilter } from '../../src/crm/interfaces/http/filters/domain-exception.filter';
import { CustomerController } from '../../src/crm/interfaces/http/customer.controller';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/auth/roles.guard';
import { InMemoryCustomerRepository } from '../support/in-memory.repositories';

describe('CRM (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const vip = Customer.fromFirstOrder({
      email: 'vip@mail.com',
      name: 'Cliente VIP',
      amount: 250000,
      currency: 'GTQ',
      at: new Date('2026-06-01T00:00:00.000Z'),
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        ListCustomersUseCase,
        GetCustomerUseCase,
        { provide: CUSTOMER_REPOSITORY, useValue: new InMemoryCustomerRepository([vip]) },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('lista clientes con stats y segmentos', async () => {
    const res = await request(app.getHttpServer()).get('/api/customers').expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].email).toBe('vip@mail.com');
    expect(res.body.data[0].segments).toEqual(expect.arrayContaining(['VIP']));
  });

  it('obtiene un cliente por email', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customers/vip@mail.com')
      .expect(200);
    expect(res.body.totalSpentAmount).toBe(250000);
  });

  it('devuelve 404 si el cliente no existe', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/customers/nope@mail.com')
      .expect(404);
    expect(res.body.error).toBe('CUSTOMER_NOT_FOUND');
  });
});
