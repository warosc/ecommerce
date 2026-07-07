import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { EVENT_PUBLISHER } from '../../src/inventory/application/ports/event-publisher';
import { CreateInventoryItemUseCase } from '../../src/inventory/application/use-cases/create-inventory-item.usecase';
import { GetInventoryItemUseCase } from '../../src/inventory/application/use-cases/get-inventory-item.usecase';
import { ListInventoryUseCase } from '../../src/inventory/application/use-cases/list-inventory.usecase';
import { ListMovementsUseCase } from '../../src/inventory/application/use-cases/list-movements.usecase';
import { RegisterMovementUseCase } from '../../src/inventory/application/use-cases/register-movement.usecase';
import { InventoryItem } from '../../src/inventory/domain/entities/inventory-item.entity';
import { INVENTORY_REPOSITORY } from '../../src/inventory/domain/repositories/inventory.repository';
import { DomainExceptionFilter } from '../../src/inventory/interfaces/http/filters/domain-exception.filter';
import { InventoryController } from '../../src/inventory/interfaces/http/inventory.controller';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/auth/roles.guard';
import { InMemoryInventoryRepository } from '../support/in-memory-inventory.repository';

describe('Inventory (e2e)', () => {
  let app: INestApplication;
  const published: Array<{ key: string; payload: unknown }> = [];

  beforeEach(async () => {
    published.length = 0;
    const repo = new InMemoryInventoryRepository([InventoryItem.create('FR-1', 10)]);

    const moduleRef = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        ListInventoryUseCase,
        GetInventoryItemUseCase,
        ListMovementsUseCase,
        RegisterMovementUseCase,
        CreateInventoryItemUseCase,
        { provide: INVENTORY_REPOSITORY, useValue: repo },
        {
          provide: EVENT_PUBLISHER,
          useValue: {
            publish: async (key: string, payload: unknown) => {
              published.push({ key, payload });
            },
          },
        },
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

  it('GET /api/inventory devuelve la lista paginada', async () => {
    const res = await request(app.getHttpServer()).get('/api/inventory').expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ sku: 'FR-1', onHand: 10 });
  });

  it('GET /api/inventory/:sku devuelve el item (404 si no existe)', async () => {
    await request(app.getHttpServer()).get('/api/inventory/FR-1').expect(200);
    const missing = await request(app.getHttpServer()).get('/api/inventory/NOPE').expect(404);
    expect(missing.body.error).toBe('INVENTORY_ITEM_NOT_FOUND');
  });

  it('POST movements RECEIPT incrementa el stock (201) y publica evento', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/inventory/FR-1/movements')
      .send({ type: 'RECEIPT', quantity: 5 })
      .expect(201);
    expect(res.body.onHand).toBe(15);
    expect(published).toHaveLength(1);
    expect(published[0].payload).toEqual({ sku: 'FR-1', onHand: 15 });
  });

  it('POST movements ISSUE por encima del stock -> 409', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/inventory/FR-1/movements')
      .send({ type: 'ISSUE', quantity: 999 })
      .expect(409);
    expect(res.body.error).toBe('INSUFFICIENT_STOCK');
  });

  it('POST movements con tipo inválido -> 400', async () => {
    await request(app.getHttpServer())
      .post('/api/inventory/FR-1/movements')
      .send({ type: 'FOO', quantity: 1 })
      .expect(400);
  });

  it('POST movements sobre SKU inexistente -> 404', async () => {
    await request(app.getHttpServer())
      .post('/api/inventory/NOPE/movements')
      .send({ type: 'RECEIPT', quantity: 1 })
      .expect(404);
  });

  it('GET /api/inventory/:sku/movements lista el historial', async () => {
    await request(app.getHttpServer())
      .post('/api/inventory/FR-1/movements')
      .send({ type: 'RECEIPT', quantity: 2 })
      .expect(201);
    const res = await request(app.getHttpServer())
      .get('/api/inventory/FR-1/movements')
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].type).toBe('RECEIPT');
  });
});
