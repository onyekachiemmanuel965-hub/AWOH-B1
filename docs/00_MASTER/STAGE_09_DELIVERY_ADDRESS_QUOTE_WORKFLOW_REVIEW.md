# Stage 09 — Delivery Address + Quote Workflow Review

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Enhancement:** AO Solid Base–style delivery address + quote workflow  
**Status:** `READY FOR HUMAN REVIEW`  
**Hard stop:** This enhancement extends Stage 07. It does **not** create a second delivery engine, Stage 10, or Stage 11.

---

## 1. Objective

Customers who choose **DELIVERY** must provide a complete Nigerian destination (State → LGA → Town/City → street address, optional instructions) before requesting a delivery quote. Payment stays locked until Sales Staff enters an authoritative fee and the customer explicitly confirms the current quote version.

Business model (AO Solid Base logic, AWOH-B architecture/visual identity):

```
CUSTOMER DESTINATION → REQUEST QUOTE → CONTACT SALES → STAFF FEE → CUSTOMER CONFIRM → PAY
```

---

## 2. AO Solid Base business workflow adopted

| Step | Behaviour |
|---|---|
| Destination first | State / LGA / Town / address required before quote request |
| Sales negotiation | Customer contacts Sales Staff (`/contact`); fee is agreed offline |
| Staff authority | Staff enters fee via existing Stage 07 override/confirm APIs |
| Customer confirm | Explicit confirm of current quote version |
| Payment gate | Backend `isPaymentAllowed` + payment initialize reject unconfirmed / stale / expired quotes |
| Address change | Invalidates prior quote + confirmation |

Visual design remains AWOH-B (Midnight Navy, Champagne Gold, Warm Ivory, Soft Sand, Deep Graphite; Cormorant Garamond / Manrope). AO Solid Base UI is **not** cloned.

---

## 3. Address hierarchy

```
NigState
  └── NigLga
        └── NigTown
```

Dependent loading only:

- `GET /api/v1/locations/states`
- `GET /api/v1/locations/states/:stateId/lgas`
- `GET /api/v1/locations/lgas/:lgaId/towns`

Frontend resets child selections when parent changes and disables dependent dropdowns until parent exists.

---

## 4. Location data implementation

| Item | Detail |
|---|---|
| Seed | `api/prisma/nigeria-locations.seed.ts` |
| Coverage | **37** states/FCT, **774** LGAs, **833** towns (curated operational set) |
| Towns scope | Each LGA gets its administrative seat (LGA name) plus curated major towns where listed |
| Limitation | **Not** a complete national gazetteer of every village/hamlet. Customers needing unlisted settlements use the nearest listed Town/City and put estate/landmark detail in street address / instructions. |

No Amsterdam / US / generic international location data.

---

## 5. Delivery address storage

Order-scoped snapshot fields on `Order` (not mutable profile address):

| Field | Role |
|---|---|
| `shippingState` / `shippingLga` / `shippingCity` / `shippingLine1` / `shippingNotes` | Human-readable snapshot for history |
| `shippingStateId` / `shippingLgaId` / `shippingTownId` | FK-backed hierarchy IDs at time of submission |

Customer-safe DTO exposes `deliveryAddress: { state, lga, townCity, address, deliveryInstructions }`.

---

## 6. Customer UX flow

1. Cart → Checkout → choose **Delivery**
2. Premium **Delivery address** section: State → LGA → Town/City → street → optional instructions
3. **Request Delivery Quote** creates order (`NEEDS_NEGOTIATION`)
4. Order page shows **Delivery quote pending** + **Contact Sales Staff** (`/contact`)
5. Pay Now disabled
6. After staff fee: fee + subtotal + total shown; **Confirm Delivery Quote**
7. After confirm: Pay Now enabled; payment init uses authoritative `order.total`
8. Customer may **Change address** on unpaid delivery orders → quote invalidated → new quote required

Pickup flow unchanged (no delivery address required).

---

## 7. Sales Staff workflow

Authorized **SALES_STAFF** / **ADMIN** on admin order detail:

- Customer identity
- State / LGA / Town/City / full address / instructions
- Existing Stage 07 internal summary (weights/distance) where permitted
- Enter agreed fee → Save (existing override path)
- Backend recalculates `total = subtotal + deliveryFee` and bumps quote version

INVENTORY_MANAGER / CONTENT_MANAGER retain existing Stage 08 delivery restrictions.

---

## 8. Quote confirmation mechanism

- `POST /api/v1/orders/:orderId/delivery/accept-quote`
- Requires ownership, DELIVERY fulfillment, fee present, status `QUOTE_AVAILABLE` or `FEE_SET_BY_STAFF`, not expired
- Sets `deliveryQuoteConfirmedVersion = deliveryQuoteVersion` and `deliveryQuoteConfirmedAt`
- Audit: `delivery.customer_confirm_quote`

---

## 9. Quote invalidation mechanism

| Event | Effect |
|---|---|
| Staff fee create/update | `deliveryQuoteVersion++`; clear confirmed version/at |
| Customer address change | Clear fee, set `NEEDS_NEGOTIATION`, version `0`, clear confirmation, total = subtotal |
| Quote TTL expiry | Effective status `EXPIRED`; payment blocked |
| Stale confirmation | `confirmedVersion !== version` → `DELIVERY_QUOTE_UPDATED`; payment blocked |

---

## 10. Payment gate

`isPaymentAllowed` (orders.mapper) requires for delivery:

1. Valid delivery address snapshot
2. Fee status `QUOTE_AVAILABLE` or `FEE_SET_BY_STAFF` (not expired)
3. Authoritative `deliveryFee` present
4. Customer confirmed **current** quote version

`OrdersService.assertPayable` + `PaymentsService.initializePaystack` enforce this server-side. Client-submitted fee/total are ignored; amount comes from `order.total`.

---

## 11. Security / privacy

- Hierarchy validated server-side (`LocationsService.resolveValidatedAddress`) — mismatched State/LGA/Town rejected
- Street address length + character pattern validation
- Customer DTOs omit: weights, distance, rates, surcharge, negotiation threshold, `deliveryInternalJson`, quote version integers
- Customer cannot set deliveryFee / total via checkout APIs
- Address treated as untrusted input

---

## 12. RBAC verification

| Role | Delivery address / quote |
|---|---|
| CUSTOMER | Own address submit/update, quote request/view/confirm; no fee set; no internal delivery |
| SALES_STAFF | Authorized order destination view + Stage 07 fee ops |
| ADMIN | Full authorized delivery ops |
| INVENTORY_MANAGER | Existing Stage 08 restrictions preserved |
| CONTENT_MANAGER | No delivery operations |

---

## 13. Audit events

| Action | When |
|---|---|
| `delivery.address_submitted` | Delivery order created with destination |
| `delivery.quote_requested` | Delivery checkout creates pending quote |
| `delivery.address_updated` | Customer changes destination (quote invalidated) |
| `delivery.customer_confirm_quote` | Customer confirms current version |
| Existing Stage 07 | `delivery.override` / `delivery.confirm` / expiry handling |

---

## 14. API changes

**New / extended**

- `GET /api/v1/locations/states`
- `GET /api/v1/locations/states/:stateId/lgas`
- `GET /api/v1/locations/lgas/:lgaId/towns`
- `POST /api/v1/orders` — DELIVERY requires `shippingStateId`, `shippingLgaId`, `shippingTownId`, `shippingLine1`
- `POST /api/v1/orders/:orderId/delivery/address` — update destination + invalidate quote

**Reused (Stage 07 / prior Stage 09)**

- `POST /api/v1/orders/:orderId/delivery/accept-quote`
- Staff override / confirm / internal delivery endpoints
- Payment initialize / verify

---

## 15. Database / Prisma changes

**Migration:** `20260928180000_stage09_delivery_address_locations`

- `Order.shippingLga`, `shippingStateId`, `shippingLgaId`, `shippingTownId`
- Models: `NigState`, `NigLga`, `NigTown`
- Indexes on location FKs / hierarchy codes

---

## 16. Tests executed

| Suite | Result |
|---|---|
| API `npm test` (30 suites / 213 tests) | **PASS** |
| Location hierarchy + invalid character validation | **PASS** |
| Delivery quote payment gate (address, pending, confirm, stale, expired, pickup) | **PASS** |
| Customer privacy (no internal leak) | **PASS** |
| Orders service create/assertPayable/acceptQuote | **PASS** |
| RBAC / admin / delivery existing suites | **PASS** |
| API `npm run build` | **PASS** |
| Web `npm run build` | **PASS** (1 pre-existing hooks warning on admin order page) |
| Locations live check (`/api/v1/locations/*`) | **PASS** (37 states; dependent LGA/town load) |
| Stage 08 RBAC smoke (`scripts/smoke-rbac-stage08.ps1`) | **PASS** (`SMOKE_RBAC_OVERALL=PASS`) |

---

## 17. Known limitations

1. Town list is **operational**, not a full Nigerian gazetteer.
2. Distance/weight calculation still uses Stage 07 engine for staff-facing internals; customer-facing fee remains staff-entered (AO Solid Base model).
3. SQLite development DB; Order→Nig* foreign keys are declared in Prisma schema; production PostgreSQL should apply the same migration with native FK enforcement.
4. End-to-end browser acceptance of the full human sales negotiation path requires a running API + manual staff/customer pass (automated unit/integration cover the gate logic).

---

## 18. PostgreSQL considerations

- Migration SQL is Prisma-generated SQLite-compatible; re-generate / deploy with `prisma migrate` against PostgreSQL for production.
- Decimal money fields already use Prisma `Decimal` — preserve that on Postgres.
- Location tables are read-heavy; indexes on `(active, sortOrder)` and parent FKs are appropriate for dependent dropdowns.
- Prefer seeding locations from the same `nigeria-locations.seed.ts` source of truth.

---

## 19. Final status

**READY FOR HUMAN REVIEW**

Do not start Stage 10. Do not deploy from this agent turn. Stop after this report.
