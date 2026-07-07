import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CreateProductUseCase } from '../../src/catalog/application/use-cases/create-product/create-product.usecase';
import { GetProductUseCase } from '../../src/catalog/application/use-cases/get-product/get-product.usecase';
import { ListProductsUseCase } from '../../src/catalog/application/use-cases/list-products/list-products.usecase';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/auth/roles.guard';
import { EVENT_PUBLISHER } from '../../src/catalog/application/ports/event-publisher';
import { Product } from '../../src/catalog/domain/entities/product.entity';
import { PRODUCT_REPOSITORY } from '../../src/catalog/domain/repositories/product.repository';
import { Money } from '../../src/catalog/domain/value-objects/money.vo';
import { Sku } from '../../src/catalog/domain/value-objects/sku.vo';
import { DomainExceptionFilter } from '../../src/catalog/interfaces/http/filters/domain-exception.filter';
import { ProductController } from '../../src/catalog/interfaces/http/product.controller';
import { InMemoryProductRepository } from '../support/in-memory-product.repository';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let seeded: Product;

  beforeEach(async () => {
    seeded = Product.create({
      sku: Sku.create('SEED-1'),
      name: 'Montura Semilla',
      description: 'Producto sembrado',
      type: 'FRAME',
      brand: 'Optimus',
      price: Money.create(45000),
      stock: 5,
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        ListProductsUseCase,
        GetProductUseCase,
        CreateProductUseCase,
        { provide: PRODUCT_REPOSITORY, useValue: new InMemoryProductRepository([seeded]) },
        { provide: EVENT_PUBLISHER, useValue: { publish: async () => undefined } },
      ],
    })
      // La autenticación (Keycloak) se prueba por separado (unit RolesGuard +
      // verificación e2e con token real). Aquí se bypassa para probar el flujo
      // de negocio del endpoint (201/400/409).
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

  describe('GET /api/products', () => {
    it('devuelve la lista paginada con meta', async () => {
      const res = await request(app.getHttpServer()).get('/api/products').expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        sku: 'SEED-1',
        price: { amount: 45000, currency: 'GTQ' },
      });
      expect(res.body.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    });

    it('filtra por tipo', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products?type=LENS')
        .expect(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('rechaza un tipo inválido con 400', async () => {
      await request(app.getHttpServer()).get('/api/products?type=INVALID').expect(400);
    });
  });

  describe('GET /api/products/:id', () => {
    it('devuelve un producto existente', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/products/${seeded.id}`)
        .expect(200);
      expect(res.body.id).toBe(seeded.id);
    });

    it('devuelve 404 con código PRODUCT_NOT_FOUND', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products/no-existe')
        .expect(404);
      expect(res.body.error).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('POST /api/products', () => {
    const valid = {
      sku: 'AC-CASE-9',
      name: 'Estuche Nuevo',
      description: 'Estuche protector',
      type: 'ACCESSORY',
      brand: 'Optimus Care',
      priceAmount: 6000,
    };

    it('crea un producto y responde 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/products')
        .send(valid)
        .expect(201);
      expect(res.body.sku).toBe('AC-CASE-9');
      expect(res.body.id).toBeDefined();

      await request(app.getHttpServer())
        .get('/api/products')
        .expect(200)
        .expect((r) => expect(r.body.meta.total).toBe(2));
    });

    it('rechaza payload inválido con 400', async () => {
      await request(app.getHttpServer())
        .post('/api/products')
        .send({ ...valid, name: '', priceAmount: -1 })
        .expect(400);
    });

    it('rechaza campos no permitidos con 400 (whitelist)', async () => {
      await request(app.getHttpServer())
        .post('/api/products')
        .send({ ...valid, hacker: true })
        .expect(400);
    });

    it('devuelve 409 con código DUPLICATE_SKU si el SKU ya existe', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/products')
        .send({ ...valid, sku: 'SEED-1' })
        .expect(409);
      expect(res.body.error).toBe('DUPLICATE_SKU');
    });

    it('devuelve 400 INVALID_PRODUCT si el SKU tiene formato inválido de dominio', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/products')
        .send({ ...valid, sku: '!!' })
        .expect(400);
      expect(res.body.error).toBe('INVALID_PRODUCT');
    });
  });
});
