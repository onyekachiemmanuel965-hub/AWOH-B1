-- CreateIndex
CREATE INDEX "Category_status_idx" ON "Category"("status");

-- CreateIndex
CREATE INDEX "Category_status_sortOrder_idx" ON "Category"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "Subcategory_status_sortOrder_idx" ON "Subcategory"("status", "sortOrder");
