# Stage 09 — Customer Delivery Quote Confirmation + Payment Gate

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Stage:** 09 (customer delivery-quote / payment-gate add-on)  
**Status:** `PENDING_HUMAN_REVIEW`

---

## 1. Objective

Customers who choose **delivery** must receive a staff-entered delivery quote, review the authoritative totals, and **explicitly confirm** that quote before Pay Now / payment initialization is allowed.

This does **not** rebuild the Stage 07 delivery engine. It adds a customer confirmation + version guard on top of the existing fee override / confirm architecture.

---

## 2. Customer flow

1. Customer checks out with `DELIVERY`.
2. Backend stores the order with `deliveryFeeStatus = NEEDS_NEGOTIATION` (existing Stage 07 behaviour — always requires sales quote).
3. Checkout / order page shows **Delivery quote required** with **Contact Sales Staff** (`/contact`) and **Pay Now disabled**.
4. Customer contacts Sales Staff (existing contact page; no invented phone/email).
5. Sales Staff enters the agreed fee via existing staff override (`POST .../delivery/override`).
6. Backend stores fee, recalculates `total = subtotal + deliveryFee` (Decimal / minor units), bumps `deliveryQuoteVersion`, clears prior confirmation.
7. Customer sees **Delivery quote ready** with fee + updated total from the API.
8. Customer clicks **Confirm Delivery Quote** → `POST /api/v1/orders/:id/delivery/accept-quote`.
9. Backend sets `deliveryQuoteConfirmedVersion = deliveryQuoteVersion`.
10. `paymentAllowed` becomes true (if order otherwise payable) → **Pay Now** enabled.
11. Payment initialize uses authoritative `order.total` only.

---

## 3. Staff flow

- **SALES_STAFF / ADMIN** retain existing RBAC on:
  - `GET /api/v1/orders/:orderId/delivery/internal`
  - `POST /api/v1/orders/:orderId/delivery/confirm`
  - `POST /api/v1/orders/:orderId/delivery/override`
- Setting or changing a fee:
  - increments `deliveryQuoteVersion`
  - clears `deliveryQuoteConfirmedVersion` / `deliveryQuoteConfirmedAt`
  - recalculates authoritative total
  - audits `delivery.override` / `delivery.confirm`
- Admin order UI allows fee entry while status is negotiation / quote / fee-set / expired, and notes that changing the fee invalidates customer confirmation.

---

## 4. Customer-visible quote states

| State | Meaning | Pay Now |
|---|---|---|
| `NOT_REQUIRED` | Pickup | Allowed if otherwise payable |
| `DELIVERY_QUOTE_REQUIRED` | Delivery, no staff fee yet | Disabled |
| `DELIVERY_QUOTE_AVAILABLE` | Staff fee set; customer not confirmed | Disabled until confirm |
| `DELIVERY_QUOTE_UPDATED` | Staff changed fee after prior confirm | Disabled until reconfirm |
| `DELIVERY_QUOTE_CONFIRMED` | Customer accepted current version | Enabled if otherwise payable |
| `DELIVERY_QUOTE_EXPIRED` | Quote TTL expired | Disabled |

`DELIVERY_QUOTE_PENDING` is reserved in the client type for softer “being prepared” copy; current backend maps pre-fee delivery to `DELIVERY_QUOTE_REQUIRED`.

---

## 5. Confirmation + versioning

New Order columns:

- `deliveryQuoteVersion` (Int, default 0) — increments on every staff fee set/update
- `deliveryQuoteConfirmedVersion` (Int?, nullable) — last version the customer accepted
- `deliveryQuoteConfirmedAt` (DateTime?)

**Payment allowed (delivery)** iff:

- effective delivery status is `QUOTE_AVAILABLE` or `FEE_SET_BY_STAFF`
- `deliveryFee` is present
- `deliveryQuoteVersion > 0`
- `deliveryQuoteConfirmedVersion === deliveryQuoteVersion`
- order not paid/cancelled

Centralized in `isPaymentAllowed()` (`orders.mapper.ts`). Controllers/services must not invent a second gate.

---

## 6. Backend payment gate

`OrdersService.assertPayable` → used by `PaymentsService.initializePaystack` (and related paths).

Rejects with a customer-safe `BadRequestException` when the quote gate fails. May audit `payment.blocked_delivery_quote`.

Frontend amount / deliveryFee / paymentAllowed flags are never authoritative.

---

## 7. Customer-safe API fields

Public order may include:

- `deliveryQuoteStatus`
- `deliveryQuoteConfirmed`
- `deliveryFee` (only when fee is staff-set / quote available)
- `paymentAllowed`
- `subtotal` / `total`
- `deliveryMessage`

**Never** returned to customers:

- weights, distanceKm, ratePerKm, weight factors, surcharges, negotiation threshold
- `deliveryInternalJson`, `deliveryConfigId`
- `deliveryQuoteVersion` / confirmed version integers (server-only)

---

## 8. API changes

| Method | Path | Who | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/orders/:orderId/delivery/accept-quote` | Owning customer | Confirm current staff quote |
| (existing) | `/api/v1/orders/:orderId/payment/initialize` | Owning customer | Blocked until gate passes |
| (existing) | staff delivery override/confirm/internal | Staff/Admin | Unchanged RBAC |

---

## 9. Frontend UX

Order detail (`/account/orders/[orderId]`) shows a dedicated navy **checkout gate** panel (not a blank black screen):

- Required / expired → Contact Sales Staff + disabled Pay Now
- Available / updated → fee + totals + Confirm Delivery Quote + disabled Pay Now
- Confirmed → fee + subtotal + total + enabled Pay Now

Values always come from `fetchOrder` / accept response (backend). Returning later re-fetches authoritative state.

Contact uses existing `/contact` page (placeholders already documented — no invented numbers).

---

## 10. Security rules

- Customer cannot confirm via client-only state
- Customer cannot set `paymentAllowed` / fee / total in DevTools meaningfully — backend recalculates and re-checks
- Customer cannot call staff/internal delivery endpoints (RBAC 403)
- Stale confirmation invalidated when staff changes fee
- Payment initialize ignores client amount

---

## 11. Audit events

| Action | When |
|---|---|
| `delivery.override` / `delivery.confirm` | Staff sets/updates fee (includes new quote version) |
| `delivery.customer_confirm_quote` | Customer accepts current version |
| `payment.blocked_delivery_quote` | Payment initialize blocked by gate (when order id known) |

---

## 12. Tests

- `orders.delivery-quote-gate.spec.ts` — states, version invalidation, privacy of public DTO
- Updated `orders.service.spec.ts` — assertPayable + acceptDeliveryQuote
- Updated `orders.privacy.spec.ts` — confirmation required for paymentAllowed
- Updated `delivery.service.spec.ts` — override leaves paymentAllowed false; version bump
- Updated delivery RBAC / message expectations

---

## 13. Hard stop

This add-on ends here. Do **not** start Stage 10, deploy, or change Paystack production credentials as part of this work.
