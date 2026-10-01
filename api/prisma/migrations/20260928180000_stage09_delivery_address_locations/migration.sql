-- AlterTable
ALTER TABLE "Order" ADD COLUMN "shippingLga" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingStateId" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingLgaId" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingTownId" TEXT;

-- CreateTable
CREATE TABLE "NigState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "NigLga" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stateId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "NigLga_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "NigState" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NigTown" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lgaId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "NigTown_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES "NigLga" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "NigState_code_key" ON "NigState"("code");
CREATE INDEX "NigState_active_sortOrder_idx" ON "NigState"("active", "sortOrder");
CREATE UNIQUE INDEX "NigLga_stateId_code_key" ON "NigLga"("stateId", "code");
CREATE INDEX "NigLga_stateId_active_sortOrder_idx" ON "NigLga"("stateId", "active", "sortOrder");
CREATE UNIQUE INDEX "NigTown_lgaId_code_key" ON "NigTown"("lgaId", "code");
CREATE INDEX "NigTown_lgaId_active_sortOrder_idx" ON "NigTown"("lgaId", "active", "sortOrder");
CREATE INDEX "Order_shippingStateId_idx" ON "Order"("shippingStateId");
CREATE INDEX "Order_shippingLgaId_idx" ON "Order"("shippingLgaId");
CREATE INDEX "Order_shippingTownId_idx" ON "Order"("shippingTownId");
