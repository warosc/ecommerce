/**
 * @optimus/contracts
 *
 * Fuente única de verdad de los tipos de la API compartidos entre el backend
 * (services/catalog) y el frontend (apps/web).
 *
 * Es un paquete SOLO DE TIPOS: no exporta ningún valor en runtime. Los
 * consumidores deben importarlo con `import type { ... }` para que TypeScript
 * borre por completo el import al compilar y no se cree una dependencia de
 * ejecución entre paquetes (evita problemas de orden de build en el monorepo).
 */

/** Tipo de producto de una óptica. */
export type ProductType = 'FRAME' | 'LENS' | 'ACCESSORY';

/** Valores válidos de {@link ProductType}. Duplicado en cada capa que valida
 * en runtime (dominio del backend, formularios del frontend) para mantener
 * este paquete libre de valores. */
export type ProductTypeValue = ProductType;

/**
 * Dinero representado como entero en la unidad mínima (centavos) más la
 * moneda. Se evita el punto flotante en cálculos monetarios.
 */
export interface Money {
  /** Importe en centavos (entero). Ej: 12500 = Q125.00 */
  amount: number;
  /** Código ISO 4217. Por defecto en Optimus: 'GTQ'. */
  currency: string;
}

/** Representación de un producto tal como la devuelve la API (JSON). */
export interface ProductDto {
  id: string;
  sku: string;
  name: string;
  description: string;
  type: ProductType;
  brand: string;
  price: Money;
  stock: number;
  images: string[];
  /**
   * URL pública de la imagen para el **probador virtual** (montura en PNG/WebP
   * con fondo transparente, vista frontal). `null` si el producto no tiene
   * montura para probar. La superpone el probador AR sobre la cara.
   */
  tryOnImageUrl: string | null;
  active: boolean;
  /** Fecha ISO 8601. */
  createdAt: string;
  /** Fecha ISO 8601. */
  updatedAt: string;
}

/** Metadatos de una respuesta paginada. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Envoltura estándar de las respuestas paginadas de la API. */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Parámetros de consulta aceptados por `GET /api/products`. */
export interface ListProductsQuery {
  page?: number;
  limit?: number;
  type?: ProductType;
  /** Búsqueda por nombre o SKU. */
  search?: string;
}

/** Cuerpo aceptado por `POST /api/products`. */
export interface CreateProductRequest {
  sku: string;
  name: string;
  /** Opcional al crear; el backend usa '' por defecto. */
  description?: string;
  type: ProductType;
  brand: string;
  /** Importe en centavos (entero). */
  priceAmount: number;
  /** ISO 4217. Por defecto 'GTQ'. */
  currency?: string;
  stock?: number;
  images?: string[];
}

// ─────────────────────────── Inventario (Fase 3) ───────────────────────────

/** Tipo de movimiento de stock. */
export type StockMovementType = 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT';

/** Existencias de un producto (por SKU) tal como las devuelve la API de inventario. */
export interface InventoryItemDto {
  sku: string;
  /** Unidades disponibles físicamente. */
  onHand: number;
  /** Fecha ISO 8601 de la última actualización. */
  updatedAt: string;
}

/** Movimiento de stock registrado (historial). */
export interface StockMovementDto {
  id: string;
  sku: string;
  type: StockMovementType;
  /** Cantidad del movimiento (entero positivo). */
  quantity: number;
  reason?: string;
  createdAt: string;
}

/**
 * Cuerpo de `POST /api/inventory/:sku/movements`.
 * - RECEIPT: suma `quantity` al onHand.
 * - ISSUE: resta `quantity` (no puede dejar el onHand negativo).
 * - ADJUSTMENT: fija el onHand a `quantity` (corrección absoluta).
 */
export interface RegisterMovementRequest {
  type: StockMovementType;
  quantity: number;
  reason?: string;
}

// ─────────────────────────── Eventos de dominio ────────────────────────────
// Nota: las routing keys (valores en runtime) se definen en cada servicio; este
// paquete es solo de tipos. Convención del exchange `optimus.events`:
//   - 'catalog.product.created'  → ProductCreatedEvent
//   - 'inventory.stock.changed'  → StockChangedEvent

/** Publicado por Catálogo al crear un producto. */
export interface ProductCreatedEvent {
  id: string;
  sku: string;
  name: string;
  stock: number;
}

/** Publicado por Inventario cuando cambian las existencias de un SKU. */
export interface StockChangedEvent {
  sku: string;
  onHand: number;
}

/** Publicado por Pedidos al confirmarse un pedido (routing key `orders.order.placed`). */
export interface OrderPlacedEvent {
  orderId: string;
  lines: Array<{ sku: string; quantity: number }>;
}

// ─────────────────────────── Ecommerce / Pedidos (Fase 4) ──────────────────

/** Línea del carrito (precios en centavos). */
export interface CartLineDto {
  sku: string;
  name: string;
  unitPriceAmount: number;
  currency: string;
  quantity: number;
  lineTotal: number;
}

/** Carrito completo. */
export interface CartDto {
  cartId: string;
  lines: CartLineDto[];
  totalAmount: number;
  currency: string;
}

/** Cuerpo de `POST /api/cart/:cartId/items`. */
export interface AddCartItemRequest {
  sku: string;
  quantity: number;
}

export type OrderStatus = 'PLACED';

export interface CustomerDto {
  name: string;
  email: string;
  phone?: string;
}

export interface OrderLineDto {
  sku: string;
  name: string;
  unitPriceAmount: number;
  quantity: number;
  lineTotal: number;
}

/** Pedido tal como lo devuelve la API. */
export interface OrderDto {
  id: string;
  status: OrderStatus;
  customer: CustomerDto;
  lines: OrderLineDto[];
  totalAmount: number;
  currency: string;
  createdAt: string;
}

/** Cuerpo de `POST /api/orders` (checkout). */
export interface PlaceOrderRequest {
  cartId: string;
  customer: CustomerDto;
}
