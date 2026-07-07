import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Productos de ejemplo de una óptica. Precios en centavos de GTQ.
 * Nombres y marcas ficticios/genéricos (regla: no copiar contenido de terceros).
 */
const SEED_PRODUCTS: Prisma.ProductCreateManyInput[] = [
  {
    sku: 'FR-CLASSIC-01',
    name: 'Montura Óptica Classic Redonda',
    description: 'Montura de acetato ligera, estilo redondo clásico, unisex.',
    type: 'FRAME',
    brand: 'Optimus Basics',
    priceAmount: 45000,
    currency: 'GTQ',
    stock: 24,
    images: ['https://picsum.photos/seed/fr-classic-01/600/400'],
  },
  {
    sku: 'FR-METAL-02',
    name: 'Montura Metálica Aviador',
    description: 'Montura metálica estilo aviador con puente ajustable.',
    type: 'FRAME',
    brand: 'Optimus Metal',
    priceAmount: 62000,
    currency: 'GTQ',
    stock: 15,
    images: ['https://picsum.photos/seed/fr-metal-02/600/400'],
  },
  {
    sku: 'FR-KIDS-03',
    name: 'Montura Infantil Flex',
    description: 'Montura flexible y resistente diseñada para niños.',
    type: 'FRAME',
    brand: 'Optimus Kids',
    priceAmount: 38000,
    currency: 'GTQ',
    stock: 30,
    images: ['https://picsum.photos/seed/fr-kids-03/600/400'],
  },
  {
    sku: 'LN-AR-BLUE-01',
    name: 'Lente Antirreflejo Filtro Azul',
    description: 'Lente monofocal con tratamiento antirreflejo y filtro de luz azul.',
    type: 'LENS',
    brand: 'Optimus Vision',
    priceAmount: 55000,
    currency: 'GTQ',
    stock: 50,
    images: ['https://picsum.photos/seed/ln-ar-blue-01/600/400'],
  },
  {
    sku: 'LN-PROGRE-02',
    name: 'Lente Progresivo Premium',
    description: 'Lente progresivo de alta definición para visión de lejos y cerca.',
    type: 'LENS',
    brand: 'Optimus Vision',
    priceAmount: 140000,
    currency: 'GTQ',
    stock: 12,
    images: ['https://picsum.photos/seed/ln-progre-02/600/400'],
  },
  {
    sku: 'LN-PHOTO-03',
    name: 'Lente Fotocromático',
    description: 'Lente que se oscurece con la luz solar; protección UV400.',
    type: 'LENS',
    brand: 'Optimus Sun',
    priceAmount: 98000,
    currency: 'GTQ',
    stock: 20,
    images: ['https://picsum.photos/seed/ln-photo-03/600/400'],
  },
  {
    sku: 'AC-CASE-01',
    name: 'Estuche Rígido para Lentes',
    description: 'Estuche protector rígido con forro interior de microfibra.',
    type: 'ACCESSORY',
    brand: 'Optimus Care',
    priceAmount: 6000,
    currency: 'GTQ',
    stock: 100,
    images: ['https://picsum.photos/seed/ac-case-01/600/400'],
  },
  {
    sku: 'AC-CLEAN-02',
    name: 'Kit de Limpieza para Lentes',
    description: 'Spray limpiador antiempañante + paño de microfibra.',
    type: 'ACCESSORY',
    brand: 'Optimus Care',
    priceAmount: 4500,
    currency: 'GTQ',
    stock: 80,
    images: ['https://picsum.photos/seed/ac-clean-02/600/400'],
  },
  {
    sku: 'AC-CHAIN-03',
    name: 'Cadena para Lentes',
    description: 'Cadena decorativa ajustable para sujetar los lentes al cuello.',
    type: 'ACCESSORY',
    brand: 'Optimus Style',
    priceAmount: 3500,
    currency: 'GTQ',
    stock: 60,
    images: ['https://picsum.photos/seed/ac-chain-03/600/400'],
  },
  {
    sku: 'FR-SUN-04',
    name: 'Montura de Sol Cuadrada',
    description: 'Montura de sol de acetato con lentes polarizadas incluidas.',
    type: 'FRAME',
    brand: 'Optimus Sun',
    priceAmount: 72000,
    currency: 'GTQ',
    stock: 18,
    images: ['https://picsum.photos/seed/fr-sun-04/600/400'],
  },
];

async function main(): Promise<void> {
  const existing = await prisma.product.count();
  if (existing > 0) {
    console.log(`[seed] Ya existen ${existing} productos. Se omite el seed (idempotente).`);
    return;
  }

  await prisma.product.createMany({ data: SEED_PRODUCTS });
  console.log(`[seed] Insertados ${SEED_PRODUCTS.length} productos de ejemplo.`);
}

main()
  .catch((error) => {
    console.error('[seed] Error al sembrar la base de datos:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
