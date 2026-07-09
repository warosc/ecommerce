import { AddToCartUseCase } from '../../src/orders/application/use-cases/cart/add-to-cart.usecase';
import { GetCartUseCase } from '../../src/orders/application/use-cases/cart/get-cart.usecase';
import { RemoveFromCartUseCase } from '../../src/orders/application/use-cases/cart/remove-from-cart.usecase';
import { SetCartItemQuantityUseCase } from '../../src/orders/application/use-cases/cart/set-cart-item-quantity.usecase';
import { ProductNotAvailableError } from '../../src/orders/domain/errors';
import {
  InMemoryCartRepository,
  StubCatalogGateway,
  product,
} from '../support/in-memory.repositories';

describe('Cart use cases', () => {
  it('AddToCart consulta Catálogo y agrega la línea con precio autoritativo', async () => {
    const repo = new InMemoryCartRepository();
    const catalog = new StubCatalogGateway({ 'FR-1': product('FR-1', { unitPriceAmount: 45000 }) });
    const cart = await new AddToCartUseCase(repo, catalog).execute('c1', 'fr-1', 2);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].unitPriceAmount).toBe(45000);
    expect(cart.totalAmount).toBe(90000);
  });

  it('AddToCart lanza ProductNotAvailable si no existe o está inactivo', async () => {
    const repo = new InMemoryCartRepository();
    const catalog = new StubCatalogGateway({ 'FR-X': product('FR-X', { active: false }) });
    const uc = new AddToCartUseCase(repo, catalog);
    await expect(uc.execute('c1', 'NOPE', 1)).rejects.toBeInstanceOf(ProductNotAvailableError);
    await expect(uc.execute('c1', 'FR-X', 1)).rejects.toBeInstanceOf(ProductNotAvailableError);
  });

  it('GetCart devuelve carrito vacío si no existe', async () => {
    const cart = await new GetCartUseCase(new InMemoryCartRepository()).execute('nuevo');
    expect(cart.isEmpty()).toBe(true);
  });

  it('RemoveFromCart quita la línea', async () => {
    const repo = new InMemoryCartRepository();
    const catalog = new StubCatalogGateway({ 'FR-1': product('FR-1') });
    await new AddToCartUseCase(repo, catalog).execute('c1', 'FR-1', 1);
    const cart = await new RemoveFromCartUseCase(repo).execute('c1', 'fr-1');
    expect(cart.isEmpty()).toBe(true);
  });

  it('SetCartItemQuantity fija la cantidad y elimina con 0', async () => {
    const repo = new InMemoryCartRepository();
    const catalog = new StubCatalogGateway({ 'FR-1': product('FR-1', { unitPriceAmount: 5000 }) });
    await new AddToCartUseCase(repo, catalog).execute('c1', 'FR-1', 1);
    const useCase = new SetCartItemQuantityUseCase(repo);
    const updated = await useCase.execute('c1', 'fr-1', 3);
    expect(updated.items[0].quantity).toBe(3);
    const emptied = await useCase.execute('c1', 'FR-1', 0);
    expect(emptied.isEmpty()).toBe(true);
  });
});
