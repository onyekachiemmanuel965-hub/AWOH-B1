-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "Product_status_sortOrder_idx" ON "Product"("status", "sortOrder");
