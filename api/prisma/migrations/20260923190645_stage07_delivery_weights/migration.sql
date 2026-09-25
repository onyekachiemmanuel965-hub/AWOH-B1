-- AlterTable
ALTER TABLE "Product" ADD COLUMN "weightPerCartonKg" DECIMAL;

-- CreateTable
CREATE TABLE "DeliveryConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "ratePerKm" DECIMAL NOT NULL,
    "weightFactorPerKg" DECIMAL NOT NULL DEFAULT 0,
    "minFee" DECIMAL NOT NULL DEFAULT 0,
    "maxFee" DECIMAL,
    "negotiationThreshold" DECIMAL,
    "quoteTtlMinutes" INTEGER NOT NULL DEFAULT 120,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadataJson" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
    "deliveryInternalJson" TEXT,
    "deliveryConfigId" TEXT,
    "subtotal" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "shippingLine1" TEXT,
    "shippingCity" TEXT,
    "shippingState" TEXT,
    "shippingNotes" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_deliveryConfigId_fkey" FOREIGN KEY ("deliveryConfigId") REFERENCES "DeliveryConfig" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("contactEmail", "contactPhone", "createdAt", "currency", "deliveryFee", "deliveryFeeStatus", "fulfillmentMethod", "id", "idempotencyKey", "orderNumber", "shippingCity", "shippingLine1", "shippingNotes", "shippingState", "status", "subtotal", "total", "updatedAt", "userId") SELECT "contactEmail", "contactPhone", "createdAt", "currency", "deliveryFee", "deliveryFeeStatus", "fulfillmentMethod", "id", "idempotencyKey", "orderNumber", "shippingCity", "shippingLine1", "shippingNotes", "shippingState", "status", "subtotal", "total", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_deliveryFeeStatus_idx" ON "Order"("deliveryFeeStatus");
CREATE UNIQUE INDEX "Order_userId_idempotencyKey_key" ON "Order"("userId", "idempotencyKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
