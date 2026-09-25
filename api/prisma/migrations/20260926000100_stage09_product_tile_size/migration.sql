-- AlterTable: add optional TileSize (legacy products remain null until set/seeded).
-- Do NOT invent incorrect dimensions for unknown products.

-- CreateTable
-- SQLite stores Prisma enums as TEXT; CHECK enforced by application validation.

ALTER TABLE "Product" ADD COLUMN "tileSize" TEXT;
