-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PLACED');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PLACED',
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GTQ',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_lines" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitPriceAmount" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_lines_orderId_idx" ON "order_lines"("orderId");

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
