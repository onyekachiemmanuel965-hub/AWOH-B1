# Order Lifecycle

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Rule:** Keep **Cart**, **Order**, **Payment**, **Delivery**, and **Receipt** as distinct concepts.

---

## Happy path (conceptual) — delivery fee known & approved

1. Customer browses products (Category → Subcategory → Product)  
2. Adds products to **Cart** (`productId` + `quantity`)  
3. Reviews cart  
4. Starts **Checkout** (registered account — see Customer Flow)  
5. Provides required customer / delivery location information  
6. Backend validates cart lines against authoritative product/price/inventory data  
7. Backend computes **Delivery** fee server-side → fee known & approved  
8. Customer selects payment method: **Online (Paystack)** or **Offline/cash**  
9. **Order** is created with server-authoritative totals (including delivery fee)  
10. **Payment** record created  
    - Online: initialize Paystack; await server-side verification / webhook  
    - Offline: marked pending/awaiting staff confirmation per policy  
11. Payment verified or recorded → **Payment status** updated  
12. **Order status** updated according to business rules (separate from payment status)  
13. **Receipt** generated from authoritative order/payment data when applicable  
14. Customer notified (email) and can download PDF receipt when applicable  

---

## Delivery negotiation branch (payment blocked until fee approved)

```
Checkout → server cannot finalize delivery fee
→ Delivery status NEEDS_NEGOTIATION
→ Customer sees contact/negotiate message (no internal math)
→ Payment initialization / payable completion BLOCKED
→ Customer contacts AWOH-B THE GREAT TILES VENTURE
→ Staff negotiate and set fee (audited)
→ Delivery fee approved → customer may pay confirmed grand total
```

Do not allow the customer to unknowingly complete payment on an incomplete delivery total.
---

## Concept boundaries

| Concept | Purpose | Must not be confused with |
|---------|---------|---------------------------|
| **Cart** | Pre-purchase working set of items | Not an order; not a payment |
| **Order** | Committed purchase intent with line items and fulfillment lifecycle | Not proof of payment |
| **Payment** | Money collection attempt/result | Not order fulfillment status |
| **Delivery** | Fee, status, negotiation for shipping/delivery | Not product price; internals staff-only |
| **Receipt** | Immutable customer-facing record of authoritative totals | Not editable by customer |

---

## Suggested status families (illustrative)

Exact enums finalized during implementation; avoid inventing unused states.

### Order status (examples)

- `PENDING_PAYMENT`
- `AWAITING_OFFLINE_PAYMENT`
- `PAID` / `CONFIRMED`
- `PROCESSING`
- `OUT_FOR_DELIVERY` / `READY_FOR_PICKUP` (if applicable)
- `COMPLETED`
- `CANCELLED`

### Payment status (examples)

- `PENDING`
- `PROCESSING`
- `SUCCESS`
- `FAILED`
- `CANCELLED`
- `REFUNDED` (where applicable)

### Delivery status (examples)

- `QUOTE_AVAILABLE` (final fee available)
- `NEEDS_NEGOTIATION`
- `FEE_SET_BY_STAFF`
- `SCHEDULED` / `IN_PROGRESS` / `DELIVERED` (as needed later)

---

## Online payment branch

```
Delivery fee confirmed
→ Order created with server grand total → Payment PENDING
→ Paystack init (server) — refused if delivery unconfirmed
→ Customer completes Paystack UI
→ Redirect and/or webhook
→ Server verifies with Paystack
→ Payment SUCCESS (or FAILED)
→ Order status updated
→ Receipt + email when rules say so
```

Frontend success page alone is **insufficient**.

---

## Offline / cash branch

```
Delivery fee confirmed
→ Order created → Payment PENDING / AWAITING_OFFLINE
→ Customer instructed via configured offline instructions (placeholder until provided)
→ Staff confirms receipt of funds
→ Payment SUCCESS (staff action, audited)
→ Order status updated
→ Receipt + email when rules say so
```

Offline selection while delivery still needs negotiation must not present a complete payable total or allow “order paid” semantics.

---

## Failure / cancellation notes

- Failed Paystack payment must not mark order as paid
- Cancelled checkouts should not leave inconsistent paid state
- Inventory reservation strategy (soft hold vs deduct on pay) decided in Stage 06 with stock-safety bias

---

## Related

- Customer UX flow: `CUSTOMER_FLOW.md`
- Payments: `docs/08_PAYMENTS/PAYMENT_ARCHITECTURE.md`
- Delivery: `docs/09_DELIVERY/DELIVERY_ARCHITECTURE.md`
