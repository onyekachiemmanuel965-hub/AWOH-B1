# Stage 09 — Receipt & PDF Receipt Enhancement Review

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Enhancement:** Customer-safe premium receipt / PDF (extends Stage 06)  
**Status:** `READY FOR HUMAN REVIEW`  
**Hard stop:** This enhancement reuses the existing Receipt model and payment/receipt pipeline. It does **not** create a second receipt system, Stage 10, or production deployment.

---

## 1. Objective

Enhance the existing Stage 06 receipt so customers receive a professional, premium, complete, **customer-safe** PDF that reflects only authoritative server-side order, payment, delivery-fee, and address snapshot data.

---

## 2. Existing receipt architecture inspected

| Area | Finding |
|---|---|
| Prisma `Receipt` | `orderId` unique, `storagePath`, `emailStatus`, `generatedAt` — sufficient; no new table |
| `ReceiptService` | PDFKit generation + console email mode (Stage 06) |
| `PaymentsService.finalizeSuccessfulPayment` | Creates receipt once when payment succeeds; skips if `order.receipt` exists |
| `GET /api/v1/orders/:orderId/receipt` | Customer download via `getReceiptForUser` → `getOwnedEntity` |
| Order shipping snapshot | State / LGA / city / line1 / notes already on `Order` |
| Delivery internals | `deliveryInternalJson` must never reach customer PDF |
| OrderItem | Extended with optional `productSku` + `tileSizeLabel` snapshots (migration already applied) |

---

## 3. Files changed

| Path | Change |
|---|---|
| `api/src/payments/receipt.service.ts` | Customer-safe `CustomerReceiptData` mapping + premium PDF layout + branding |
| `api/src/payments/payments.service.ts` | Include `user` on receipt generation; P2002-safe receipt create |
| `api/src/orders/orders.service.ts` | Snapshot `productSku` + `tileSizeLabel` at order create |
| `api/src/payments/receipt.enhancement.spec.ts` | New mapping / PDF / auth / idempotency tests |
| `api/src/payments/receipt.privacy.spec.ts` | Updated fixtures (SKU / LGA / tile size) |
| `api/src/orders/orders.service.spec.ts` | Product mock includes `tileSize` / `specsJson` |
| `api/.env.example` | Optional `BUSINESS_*` / logo path placeholders |
| `api/assets/brand/logo.png`, `icon.png` | AWOH-B brand assets for PDF |
| `web/public/brand/logo.png`, `icon.png` | Same assets for web |
| `api/prisma/migrations/20260929163147_stage09_order_item_sku_tilesize_snapshot/` | Already applied (OrderItem snapshots) |
| `docs/00_MASTER/STAGE_09_RECEIPT_ENHANCEMENT_REVIEW.md` | This report |

---

## 4. Receipt fields implemented

- Business header (name + configured contact fields only)
- Receipt number (`RCPT-{orderNumber}`), order number, date/time
- Customer name / email / phone
- Fulfillment: Delivery or Pickup (+ optional pickup note)
- Delivery address snapshot (state, LGA, town/city, address, instructions) when DELIVERY
- Item table: Product, SKU, Size, Qty, Unit Price, Amount
- Subtotal, Delivery Fee (final authoritative only), TOTAL
- Payment method / status / transaction reference / payment date (when paid)
- Customer-safe order status label
- Premium footer with thank-you + configured contacts

---

## 5. Customer privacy protections

- Explicit `CustomerReceiptData` — PDF/email never receive raw order with internals
- Excluded: weights, distance, rates, surcharges, negotiation threshold, `deliveryInternalJson`, provider secrets/webhooks, staff notes, DB ids not meant for customers
- Customer sees **final delivery fee only**
- `buildReceiptTextLines` used for privacy assertions shares the same mapping path

---

## 6. Delivery quote integration

- Fee comes from persisted `order.deliveryFee` after staff quote + customer confirmation + payment
- Address comes from order shipping snapshot fields (not live profile)
- Receipt generation remains post-payment; payment gate unchanged

---

## 7. Payment integration

- Paystack: receipt only after backend verify/webhook success path (`finalizeSuccessfulPayment`)
- Reference shown from `payment.providerReference`
- Unpaid / pending never labeled `PAID`

---

## 8. Offline payment handling

- Offline pending → status `AWAITING PAYMENT` / order “Awaiting Offline Payment”
- Confirmed offline → `Cash / Offline Payment` + `PAID` + payment date
- Idempotent confirm: existing receipt → no duplicate PDF/row (unique `orderId` + early return)

---

## 9. PDF design improvements

- Midnight Navy / Champagne Gold / Warm Ivory / Graphite hierarchy
- Logo from `api/assets/brand/logo.png` (or `BUSINESS_LOGO_PATH`) with aspect-preserving fit
- Table header band, gold rules, multi-page row flow with header redraw
- Long product names wrap within column width

---

## 10. Authorization checks

- Customer receipt: `getOwnedEntity(userId, orderId)` — other customers get NotFound
- Receipt available only when `OrderStatus.PAID` and receipt row exists
- Staff offline confirm path unchanged; no RBAC weakening
- Internal admin order views untouched (still may show operational delivery data under RBAC)

---

## 11. Tests added/updated

- `receipt.enhancement.spec.ts` — mapping, privacy, pickup vs delivery, prices, offline/Paystack status, multi-page PDF, ownership, idempotency
- `receipt.privacy.spec.ts` — continued leak assertions
- Existing Stage 06 offline-confirm / payment tests preserved

---

## 12. Test results

- Full API Jest suite: **229 passed / 0 failed** (31 suites)
- Receipt enhancement + privacy: **17 passed** (re-confirmed 16 enhancement + 1 privacy)
- Existing Stage 06/07/08/09 suites included in the full run — no deletions

---

## 13. Build results

- API `nest build`: **PASS**
- Web `next build`: **PASS** (brand assets only; no web receipt renderer change required)

---

## 14. Migration

- Schema change: `OrderItem.productSku` (nullable), `OrderItem.tileSizeLabel` (nullable)
- Migration: `20260929163147_stage09_order_item_sku_tilesize_snapshot`
- Safe for existing rows (nullable); new orders populate snapshots
- No new Receipt table / no ReceiptV2

---

## 15. Remaining limitations

- Business contact lines only appear when `BUSINESS_*` env vars are set (no invented production contacts)
- Email remains `EMAIL_MODE=console` (no production ESP in this task)
- Legacy orders without SKU/size snapshots fall back to slug-derived SKU and `—` for size
- Customer receipt date uses successful `paidAt` when present; otherwise generation clock (PDF not regenerated once Receipt exists)

---

## 16. Production considerations

- Configure `BUSINESS_NAME`, address, phone, email, website, pickup note before go-live
- Ensure `api/assets/brand/logo.png` is deployed with the API process cwd
- PostgreSQL: migration is additive/nullable — apply with normal Prisma migrate in production
- **PostgreSQL runtime verification:** not performed in this controlled task (local SQLite / unit tests)

---

## Hard stop

Receipt enhancement complete. **Do not start Stage 10. Do not deploy.**
