# Payment Architecture

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Providers:** Paystack (online) + Offline/cash  
**Rule:** Frontend is never proof of successful payment.

---

## 1. Objectives

- Support online checkout via Paystack
- Support offline/cash orders with staff-managed confirmation
- Keep **payment status** separate from **order status**
- Generate receipts from authoritative backend data after applicable success/completion rules
- Enforce the **delivery + payment MVP principle**: no customer payment completion on an incomplete/unconfirmed delivery total

---

## 1A. Delivery gate before payment (mandatory)

| Delivery state | Payment allowed? |
|----------------|------------------|
| Fee known and approved (`QUOTE_AVAILABLE` / staff-approved fee) | Yes — normal online or offline flow using server grand total |
| `NEEDS_NEGOTIATION` / fee unconfirmed | **No** — inform customer to contact AWOH-B THE GREAT TILES VENTURE; block Paystack initialize and block treating offline order as payable-complete |

Backend is authoritative for product price, order totals, delivery fee, payment status, and order status. Never trust customer-submitted monetary totals.

See `docs/09_DELIVERY/DELIVERY_ARCHITECTURE.md` §4.
---

## 2. Payment methods

| Method | Customer action | Confirmation |
|--------|-----------------|--------------|
| `PAYSTACK` | Completes Paystack payment UI after server initialization | Server verifies with Paystack (API verify and/or signed webhook) |
| `OFFLINE_CASH` | Places order selecting offline/cash | Authorized staff marks payment success when funds confirmed |

Offline payment instructions (bank details, etc.) are **placeholders** until the client provides them — do not fabricate.

---

## 3. Payment status model

Use practical states; refine during Stage 06 without inventing unused ones.

| Status | Meaning |
|--------|---------|
| `PENDING` | Payment record created; not completed |
| `PROCESSING` | Awaiting provider confirmation / in flight |
| `SUCCESS` | Funds confirmed (provider or staff offline confirmation) |
| `FAILED` | Provider or process reported failure |
| `CANCELLED` | Abandoned/cancelled before success |
| `REFUNDED` | Refunded where applicable |

Order status updates **in response to** payment events according to business rules, but remains a separate field/entity concern.

---

## 4. Online (Paystack) flow

```
Checkout validated
→ Order created
→ Payment row created (PENDING)
→ Backend initializes Paystack transaction (amount from server totals)
→ Client receives authorization URL / access code (no secrets)
→ Customer pays on Paystack
→ Redirect returns to app (informational)
→ Backend verifies reference with Paystack API
→ and/or webhook received + signature verified
→ Payment → SUCCESS or FAILED
→ Order status updated
→ Receipt + email when rules allow
```

### Non-negotiables

1. Secret key only on server  
2. Webhook signatures verified  
3. Amounts verified against server order totals  
4. Idempotent processing of duplicate webhooks/verifications  
5. UI success screens do not mutate payment to SUCCESS alone  

---

## 5. Offline / cash flow

```
Checkout validated
→ Order created
→ Payment row created (PENDING / awaiting offline)
→ Customer shown configured offline instructions (from config placeholders)
→ Staff confirms funds
→ Payment → SUCCESS (audited)
→ Order status updated
→ Receipt + email when rules allow
```

Staff actions that change payment status must be RBAC-protected and audited.

---

## 6. Amounts & currency

- All chargeable amounts computed/stored by backend
- Currency: `PLACEHOLDER` (confirm with client; Paystack commonly NGN in NG markets)
- Customer cannot patch payment amount endpoints

---

## 7. Receipts linkage

After applicable successful payment / order completion rules:

- Generate PDF from order + payment authoritative records
- Send transactional email via mail adapter
- Customer download authorized for own order only

See also order lifecycle: `docs/03_ARCHITECTURE/ORDER_LIFECYCLE.md`

---

## 8. Admin oversight

Authorized roles can:

- View payment statuses
- Confirm offline payments
- Investigate failed/cancelled payments
- Not view provider secret keys

---

## 9. Configuration requirements

| Key | Location |
|-----|----------|
| `PAYSTACK_PUBLIC_KEY` | Server (+ frontend only if required and public) |
| `PAYSTACK_SECRET_KEY` | Server only |
| `PAYSTACK_WEBHOOK_SECRET` | Server only |
| Offline payment instruction fields | Server config / CMS — placeholder until provided |

Never commit real keys.

---

## 10. Threat notes

| Threat | Mitigation |
|--------|------------|
| Client forges “paid” | Server verify only |
| Replay webhook | Signature + idempotency keys/references |
| Underpay | Compare paid amount to order total |
| Staff mistake on offline | RBAC + audit + confirmations in UI |
| Key leak in frontend | Secrets never shipped to client bundle |
