import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Existencias iniciales de los productos sembrados en el Catálogo. Inventario es
 * la fuente de verdad del stock (`onHand`); estos items permiten que las ventas
 * (web/POS) descuenten stock de los productos de ejemplo. Idempotente.
 */
const SEED_ITEMS: { sku: string; onHand: number }[] = [
  { sku: 'FR-CLASSIC-01', onHand: 24 },
  { sku: 'FR-METAL-02', onHand: 15 },
  { sku: 'FR-KIDS-03', onHand: 30 },
  { sku: 'LN-AR-BLUE-01', onHand: 50 },
  { sku: 'LN-PROGRE-02', onHand: 12 },
  { sku: 'LN-PHOTO-03', onHand: 20 },
  { sku: 'AC-CASE-01', onHand: 100 },
  { sku: 'AC-CLEAN-02', onHand: 80 },
  { sku: 'AC-CHAIN-03', onHand: 60 },
  { sku: 'FR-SUN-04', onHand: 18 },
];

async function main(): Promise<void> {
  const existing = await prisma.inventoryItem.count();
  if (existing > 0) {
    console.log(`[seed] Ya existen ${existing} items de inventario. Se omite (idempotente).`);
    return;
  }
  await prisma.inventoryItem.createMany({ data: SEED_ITEMS });
  console.log(`[seed] Insertados ${SEED_ITEMS.length} items de inventario.`);
}

main()
  .catch((error) => {
    console.error('[seed] Error al sembrar el inventario:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
