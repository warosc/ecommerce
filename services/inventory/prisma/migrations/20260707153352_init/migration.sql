-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('RECEIPT', 'ISSUE', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "inventory_items" (
    "sku" TEXT NOT NULL,
    "onHand" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("sku")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_movements_sku_idx" ON "stock_movements"("sku");

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_sku_fkey" FOREIGN KEY ("sku") REFERENCES "inventory_items"("sku") ON DELETE CASCADE ON UPDATE CASCADE;
