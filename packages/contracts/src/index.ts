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
  /** Canal del pedido (WEB/POS). Enriquecido para el CRM. */
  channel: OrderChannel;
  /** Cliente del pedido (para construir su perfil en el CRM). */
  customer: CustomerDto;
  /** Importe total en centavos. */
  totalAmount: number;
  /** Moneda ISO 4217. */
  currency: string;
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

/** Canal por el que se originó el pedido. */
export type OrderChannel = 'WEB' | 'POS';

/** Método de pago (usado por el POS; el checkout web queda pendiente de Fase 5). */
export type PaymentMethod = 'CASH' | 'CARD';

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
  /** Canal de origen: 'WEB' (checkout) o 'POS' (venta en tienda). */
  channel: OrderChannel;
  /** Método de pago; `null` en pedidos web aún no cobrados. */
  paymentMethod: PaymentMethod | null;
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

// ─────────────────────────── Clínica: Pacientes + Agenda (Fase 7) ───────────
// Datos sensibles. La graduación y las notas viajan en claro por la API (TLS en
// prod) pero se almacenan CIFRADAS en reposo. Acceso restringido por rol.

/** Graduación de un ojo (dioptrías). Todos opcionales según el caso. */
export interface EyePrescription {
  /** Esfera. */
  sphere?: number;
  /** Cilindro. */
  cylinder?: number;
  /** Eje (0–180). */
  axis?: number;
  /** Adición (para progresivos/bifocales). */
  add?: number;
}

/** Graduación óptica completa. `od` = ojo derecho, `os` = ojo izquierdo. */
export interface Prescription {
  od?: EyePrescription;
  os?: EyePrescription;
  /** Distancia interpupilar (mm). */
  pd?: number;
}

/** Paciente tal como lo devuelve la API (incluye datos clínicos descifrados). */
export interface PatientDto {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  /** Fecha ISO 8601 (solo fecha relevante). */
  birthDate: string | null;
  prescription: Prescription | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Resumen de paciente para listados (sin datos clínicos). */
export interface PatientSummaryDto {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: string;
}

/** Cuerpo de `POST /api/patients`. */
export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  prescription?: Prescription;
  notes?: string;
}

/** Cuerpo de `PUT /api/patients/:id/clinical` (graduación + notas). */
export interface UpdateClinicalRequest {
  prescription?: Prescription;
  notes?: string;
}

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

/** Cita de la agenda. */
export interface AppointmentDto {
  id: string;
  patientId: string;
  patientName: string;
  /** Fecha/hora ISO 8601. */
  scheduledAt: string;
  reason: string;
  status: AppointmentStatus;
  createdAt: string;
}

/** Cuerpo de `POST /api/appointments`. */
export interface CreateAppointmentRequest {
  patientId: string;
  scheduledAt: string;
  reason: string;
}

/** Cuerpo de `PATCH /api/appointments/:id/status`. */
export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus;
}

// ─────────────────────────── CRM (Fase 8) ──────────────────────────────────

/** Segmento de cliente derivado de su comportamiento de compra. */
export type CustomerSegment = 'NUEVO' | 'RECURRENTE' | 'VIP' | 'INACTIVO';

/** Perfil de cliente del CRM (agregado a partir de eventos de pedidos). */
export interface CrmCustomerDto {
  email: string;
  name: string;
  phone: string | null;
  totalOrders: number;
  /** Gasto total acumulado en centavos. */
  totalSpentAmount: number;
  currency: string;
  firstOrderAt: string;
  lastOrderAt: string;
  segments: CustomerSegment[];
}

/** Línea de una venta POS (el precio y nombre los resuelve el backend por SKU). */
export interface PosOrderLineInput {
  sku: string;
  quantity: number;
}

/**
 * Cuerpo de `POST /api/orders/pos` (venta en tienda). El cliente es opcional
 * (venta de mostrador); si no se indica, el backend usa un cliente genérico.
 */
export interface PlacePosOrderRequest {
  lines: PosOrderLineInput[];
  paymentMethod: PaymentMethod;
  customer?: CustomerDto;
}
