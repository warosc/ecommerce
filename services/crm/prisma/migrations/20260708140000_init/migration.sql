-- CreateTable
CREATE TABLE "customers" (
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalSpentAmount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GTQ',
    "firstOrderAt" TIMESTAMP(3) NOT NULL,
    "lastOrderAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE INDEX "customers_lastOrderAt_idx" ON "customers"("lastOrderAt");
