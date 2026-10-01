-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "productSku" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "tileSizeLabel" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fulfillmentMethod" TEXT NOT NULL,
    "deliveryFeeStatus" TEXT NOT NULL,
    "deliveryFee" DECIMAL,
    "deliveryQuoteExpiresAt" DATETIME,
    "deliveryQuoteVersion" INTEGER NOT NULL DEFAULT 0,
    "deliveryQuoteConfirmedVersion" INTEGER,
    "deliveryQuoteConfirmedAt" DATETIME,
    "deliveryInternalJson" TEXT,
    "deliveryConfigId" TEXT,
    "subtotal" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "shippingLine1" TEXT,
    "shippingCity" TEXT,
    "shippingLga" TEXT,
    "shippingState" TEXT,
    "shippingNotes" TEXT,
    "shippingStateId" TEXT,
    "shippingLgaId" TEXT,
    "shippingTownId" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_deliveryConfigId_fkey" FOREIGN KEY ("deliveryConfigId") REFERENCES "DeliveryConfig" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_shippingStateId_fkey" FOREIGN KEY ("shippingStateId") REFERENCES "NigState" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_shippingLgaId_fkey" FOREIGN KEY ("shippingLgaId") REFERENCES "NigLga" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_shippingTownId_fkey" FOREIGN KEY ("shippingTownId") REFERENCES "NigTown" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("contactEmail", "contactPhone", "createdAt", "currency", "deliveryConfigId", "deliveryFee", "deliveryFeeStatus", "deliveryInternalJson", "deliveryQuoteConfirmedAt", "deliveryQuoteConfirmedVersion", "deliveryQuoteExpiresAt", "deliveryQuoteVersion", "fulfillmentMethod", "id", "idempotencyKey", "orderNumber", "shippingCity", "shippingLga", "shippingLgaId", "shippingLine1", "shippingNotes", "shippingState", "shippingStateId", "shippingTownId", "status", "subtotal", "total", "updatedAt", "userId") SELECT "contactEmail", "contactPhone", "createdAt", "currency", "deliveryConfigId", "deliveryFee", "deliveryFeeStatus", "deliveryInternalJson", "deliveryQuoteConfirmedAt", "deliveryQuoteConfirmedVersion", "deliveryQuoteExpiresAt", "deliveryQuoteVersion", "fulfillmentMethod", "id", "idempotencyKey", "orderNumber", "shippingCity", "shippingLga", "shippingLgaId", "shippingLine1", "shippingNotes", "shippingState", "shippingStateId", "shippingTownId", "status", "subtotal", "total", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_deliveryFeeStatus_idx" ON "Order"("deliveryFeeStatus");
CREATE INDEX "Order_shippingStateId_idx" ON "Order"("shippingStateId");
CREATE INDEX "Order_shippingLgaId_idx" ON "Order"("shippingLgaId");
CREATE INDEX "Order_shippingTownId_idx" ON "Order"("shippingTownId");
CREATE UNIQUE INDEX "Order_userId_idempotencyKey_key" ON "Order"("userId", "idempotencyKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
