-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('WEB', 'POS');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "channel" "OrderChannel" NOT NULL DEFAULT 'WEB',
                     ADD COLUMN "paymentMethod" "PaymentMethod";
