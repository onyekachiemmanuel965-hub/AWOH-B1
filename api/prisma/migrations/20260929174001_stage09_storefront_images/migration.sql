-- CreateTable
CREATE TABLE "StorefrontImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "altText" TEXT,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "StorefrontImage_key_key" ON "StorefrontImage"("key");

-- CreateIndex
CREATE INDEX "StorefrontImage_page_idx" ON "StorefrontImage"("page");
