-- AlterTable
ALTER TABLE "Order" ADD COLUMN "deliveryQuoteVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "deliveryQuoteConfirmedVersion" INTEGER;
ALTER TABLE "Order" ADD COLUMN "deliveryQuoteConfirmedAt" DATETIME;
