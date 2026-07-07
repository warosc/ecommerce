-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('FRAME', 'LENS', 'ACCESSORY');

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" "ProductType" NOT NULL,
    "brand" TEXT NOT NULL,
    "priceAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GTQ',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_type_idx" ON "products"("type");

-- CreateIndex
CREATE INDEX "products_active_idx" ON "products"("active");
