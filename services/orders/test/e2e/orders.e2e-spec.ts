import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CATALOG_GATEWAY } from '../../src/orders/application/ports/catalog.gateway';
import { INVENTORY_GATEWAY } from '../../src/orders/application/ports/inventory.gateway';
import { EVENT_PUBLISHER } from '../../src/orders/application/ports/event-publisher';
import { AddToCartUseCase } from '../../src/orders/application/use-cases/cart/add-to-cart.usecase';
import { GetCartUseCase } from '../../src/orders/application/use-cases/cart/get-cart.usecase';
import { RemoveFromCartUseCase } from '../../src/orders/application/use-cases/cart/remove-from-cart.usecase';
import { GetOrderUseCase } from '../../src/orders/application/use-cases/orders/get-order.usecase';
import { ListOrdersUseCase } from '../../src/orders/application/use-cases/orders/list-orders.usecase';
import { PlaceOrderUseCase } from '../../src/orders/application/use-cases/orders/place-order.usecase';
import { PlacePosOrderUseCase } from '../../src/orders/application/use-cases/orders/place-pos-order.usecase';
import { CART_REPOSITORY } from '../../src/orders/domain/repositories/cart.repository';
import { ORDER_REPOSITORY } from '../../src/orders/domain/repositories/order.repository';
import { DomainExceptionFilter } from '../../src/orders/interfaces/http/filters/domain-exception.filter';
import { CartController } from '../../src/orders/interfaces/http/cart.controller';
import { OrdersController } from '../../src/orders/interfaces/http/orders.controller';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/auth/roles.guard';
import {
  CollectingPublisher,
  InMemoryCartRepository,
  InMemoryOrderRepository,
  StubCatalogGateway,
  StubInventoryGateway,
  product,
} from '../support/in-memory.repositories';

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let publisher: CollectingPublisher;

  beforeEach(async () => {
    publisher = new CollectingPublisher();
    const catalog = new StubCatalogGateway({
      'FR-1': product('FR-1', { unitPriceAmount: 45000 }),
      'LN-1': product('LN-1', { unitPriceAmount: 20000 }),
    });
    const inventory = new StubInventoryGateway({ 'FR-1': 100, 'LN-1': 1 });

    const moduleRef = await Test.createTestingModule({
      controllers: [CartController, OrdersController],
      providers: [
        GetCartUseCase,
        AddToCartUseCase,
        RemoveFromCartUseCase,
        PlaceOrderUseCase,
        PlacePosOrderUseCase,
        GetOrderUseCase,
        ListOrdersUseCase,
        { provide: CART_REPOSITORY, useValue: new InMemoryCartRepository() },
        { provide: ORDER_REPOSITORY, useValue: new InMemoryOrderRepository() },
        { provide: CATALOG_GATEWAY, useValue: catalog },
        { provide: INVENTORY_GATEWAY, useValue: inventory },
        { provide: EVENT_PUBLISHER, useValue: publisher },
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

  const server = () => app.getHttpServer();

  it('carrito: añadir, ver, eliminar', async () => {
    await request(server())
      .post('/api/cart/c1/items')
      .send({ sku: 'FR-1', quantity: 2 })
      .expect(200)
      .expect((r) => {
        expect(r.body.lines).toHaveLength(1);
        expect(r.body.totalAmount).toBe(90000);
      });

    await request(server()).get('/api/cart/c1').expect(200);

    await request(server())
      .delete('/api/cart/c1/items/FR-1')
      .expect(200)
      .expect((r) => expect(r.body.lines).toHaveLength(0));
  });

  it('añadir SKU inexistente -> 404', async () => {
    await request(server())
      .post('/api/cart/c1/items')
      .send({ sku: 'NOPE', quantity: 1 })
      .expect(404);
  });

  it('checkout crea pedido (201) y publica order.placed', async () => {
    await request(server()).post('/api/cart/c2/items').send({ sku: 'FR-1', quantity: 2 }).expect(200);
    const res = await request(server())
      .post('/api/orders')
      .send({ cartId: 'c2', customer: { name: 'Ana', email: 'ana@mail.com' } })
      .expect(201);
    expect(res.body.status).toBe('PLACED');
    expect(res.body.totalAmount).toBe(90000);
    expect(publisher.calls).toHaveLength(1);

    await request(server()).get(`/api/orders/${res.body.id}`).expect(200);
  });

  it('checkout con carrito vacío -> 400', async () => {
    await request(server())
      .post('/api/orders')
      .send({ cartId: 'vacio', customer: { name: 'Ana', email: 'ana@mail.com' } })
      .expect(400);
  });

  it('checkout sin stock suficiente -> 409', async () => {
    await request(server()).post('/api/cart/c3/items').send({ sku: 'LN-1', quantity: 5 }).expect(200);
    await request(server())
      .post('/api/orders')
      .send({ cartId: 'c3', customer: { name: 'Ana', email: 'ana@mail.com' } })
      .expect(409);
  });

  it('checkout con email inválido -> 400', async () => {
    await request(server()).post('/api/cart/c4/items').send({ sku: 'FR-1', quantity: 1 }).expect(200);
    await request(server())
      .post('/api/orders')
      .send({ cartId: 'c4', customer: { name: 'Ana', email: 'no-email' } })
      .expect(400);
  });

  it('GET pedido inexistente -> 404', async () => {
    await request(server()).get('/api/orders/nope').expect(404);
  });

  describe('POST /api/orders/pos (venta en tienda)', () => {
    it('crea la venta (201), canal POS y publica order.placed', async () => {
      const res = await request(server())
        .post('/api/orders/pos')
        .send({
          lines: [
            { sku: 'FR-1', quantity: 2 },
            { sku: 'LN-1', quantity: 1 },
          ],
          paymentMethod: 'CASH',
        })
        .expect(201);
      expect(res.body.channel).toBe('POS');
      expect(res.body.paymentMethod).toBe('CASH');
      expect(res.body.totalAmount).toBe(45000 * 2 + 20000);
      expect(res.body.customer.name).toBe('Cliente de mostrador');
      expect(publisher.calls).toHaveLength(1);
    });

    it('rechaza método de pago inválido -> 400', async () => {
      await request(server())
        .post('/api/orders/pos')
        .send({ lines: [{ sku: 'FR-1', quantity: 1 }], paymentMethod: 'BITCOIN' })
        .expect(400);
    });

    it('rechaza venta sin líneas -> 400', async () => {
      await request(server())
        .post('/api/orders/pos')
        .send({ lines: [], paymentMethod: 'CASH' })
        .expect(400);
    });

    it('SKU inexistente -> 404', async () => {
      await request(server())
        .post('/api/orders/pos')
        .send({ lines: [{ sku: 'NOPE', quantity: 1 }], paymentMethod: 'CARD' })
        .expect(404);
    });

    it('stock insuficiente -> 409', async () => {
      await request(server())
        .post('/api/orders/pos')
        .send({ lines: [{ sku: 'LN-1', quantity: 5 }], paymentMethod: 'CASH' })
        .expect(409);
    });
  });
});
