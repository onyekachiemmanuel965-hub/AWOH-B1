# Stage 06 Review — Checkout, Orders, Paystack & Offline Payments

## Stage

Stage 06 — Checkout, Orders, Paystack & Offline Payments

## Status

`READY FOR HUMAN REVIEW`

## Architecture

- Authenticated checkout creates server-authoritative `Order` + `OrderItem` snapshots + `Payment`
- Client submits only `productId`, `quantity`, fulfillment, contact/shipping fields, payment method, idempotency key
- Backend re-resolves catalog prices; money math uses integer minor units (`src/common/money.ts`)
- Payment provider interface → `MockPaymentProvider` (default local) or `PaystackPaymentProvider`
- Receipt PDF + console email adapter after verified SUCCESS

## Database

Migration: `20260923183855_stage06_orders_payments`

Models: `Order`, `OrderItem`, `Payment`, `Receipt`  
Enums: `FulfillmentMethod`, `OrderStatus`, `PaymentStatus`, `PaymentMethod`, `DeliveryFeeStatus`

Unique: `orderNumber`, `(userId, idempotencyKey)`, `Payment.providerReference`

## State machines

### Order

`PENDING_PAYMENT` → `PAID` / `PAYMENT_FAILED`  
`AWAITING_OFFLINE_PAYMENT` (cash; not paid until Stage 08 staff)  
`AWAITING_DELIVERY_CONFIRMATION` (delivery fee gate)  
`CANCELLED`

### Payment

`PENDING` → `PROCESSING` → `SUCCESS` / `FAILED`  
Also: `CANCELLED`, `REFUNDED` (reserved)

### Delivery fee gate

| Fulfillment | Stage 06 behavior |
|-------------|-------------------|
| PICKUP | `NOT_REQUIRED`, fee `0.00`, payment allowed |
| DELIVERY | `NEEDS_NEGOTIATION`, payment blocked until Stage 07/08 |

## API

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/v1/orders` | Create order (auth) |
| GET | `/api/v1/orders` | Own orders |
| GET | `/api/v1/orders/:id` | Own order |
| POST | `/api/v1/orders/:id/payment/initialize` | Paystack/mock init |
| POST | `/api/v1/orders/:id/payment/verify` | Server verify |
| GET | `/api/v1/orders/:id/receipt` | PDF (owner + PAID) |
| POST | `/api/v1/payments/webhooks/paystack` | Signed webhook |

## Frontend

- `/checkout`
- `/account/orders`
- `/account/orders/[orderId]`
- Cart → Checkout CTA

## Security

- JwtAuthGuard + OriginGuard on order mutations
- Ownership on all order/payment/receipt reads
- No client money fields accepted
- Webhook HMAC SHA-512 verification
- Idempotent order create + SUCCESS payment finalize
- Secrets via env only

## Configuration

See `api/.env.example`: `PAYMENT_CURRENCY`, `PAYSTACK_*`, `PAYSTACK_MODE=mock`, `PAYMENT_CALLBACK_URL`, `EMAIL_MODE`, `RECEIPTS_DIR`

**Currency:** `PAYMENT_CURRENCY` / `CURRENCY_DEFAULT` (currently NGN placeholder — confirm before production)

## Testing

- Jest: **35 passed** (catalog + auth + orders + payment security)
- API build: **PASS**
- Web build: **PASS**
- Live smoke (mock Paystack):
  - login → pickup order totals `2 × 11400 = 22800`
  - idempotent recreate returns same order id
  - initialize + verify → `PAID` / `SUCCESS` / receipt available
  - delivery order → payment blocked (400)
  - offline pickup → `AWAITING_OFFLINE_PAYMENT` / payment `PENDING`
  - other customer cannot read foreign order (404)

## Cart

Stage 04 local cart unchanged until successful order create, then cleared client-side.

## Deferred

### Stage 07

Delivery fee engine, weight, brackets, negotiation staff UI

### Stage 08

Offline payment confirmation UI, admin order ops, inventory reservation UI

### Other

Live Paystack sandbox (mock used locally), real SMTP email, PostgreSQL runtime verification

## Out of scope confirmation

No Stage 07 delivery calculator, no admin/CMS dashboards, no staff cash confirmation UI.

## Human Approval

`PENDING HUMAN REVIEW`
