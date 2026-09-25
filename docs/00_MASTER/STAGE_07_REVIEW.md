# Stage 07 Review — Secure Delivery & Delivery Negotiation

## Stage

Stage 07 — Secure Delivery & Delivery Negotiation

## Status

`READY FOR HUMAN REVIEW`

## Delivery architecture

```
Customer request (productId + quantity + address)
        ↓
DeliveryService
        ↓
DistanceProvider (mock / future maps)
        ↓
DeliveryCalculator (pure)
        ↓
DeliveryPricingConfiguration (DeliveryConfig row)
        ↓
Order deliveryFeeStatus + optional fee + internal snapshot
        ↓
Customer-safe DTO only
```

| Component | Path | Role |
|-----------|------|------|
| `DeliveryCalculator` | `api/src/delivery/delivery.calculator.ts` | Pure fee math from trusted inputs |
| `DeliveryService` | `api/src/delivery/delivery.service.ts` | Quote, evaluate, confirm, override |
| `DeliveryController` | `api/src/delivery/delivery.controller.ts` | Customer + staff REST |
| `MockDistanceProvider` | `api/src/delivery/mock-distance.provider.ts` | Dev distance (not production maps) |
| `DeliveryConfig` | Prisma model | Configurable rates / thresholds / TTL |
| `AuditService` | `api/src/audit/audit.service.ts` | Sensitive delivery actions |

Orders consume `DeliveryService.evaluateForOrderLines` at create time. Payments continue to call `OrdersService.assertPayable` (expiry-aware).

## Data security

### Internal (DB / backend only)

- `Product.weightPerCartonKg`
- Order `deliveryInternalJson` (weights, distance, rates, calculator snapshot)
- `DeliveryConfig` rates, factors, thresholds
- Staff `GET .../delivery/internal`

### Never exposed to customers

Public catalog mapper, order DTO, delivery quote DTO, receipt PDF, cart, and frontend omit:

`weightPerCartonKg`, `totalWeight`, `distanceKm`, `ratePerKm`, `weightFactor`, brackets, surcharges, formulas, provider internals.

### Customer-safe delivery DTO

```json
{ "status": "...", "deliveryFee": "...|null", "currency": "NGN", "message": "..." }
```

Fee is `null` when status is `NEEDS_NEGOTIATION` / `UNCONFIRMED` / `EXPIRED`.

## Delivery state machine

| State | Meaning | Payment |
|-------|---------|---------|
| `NOT_REQUIRED` | Pickup | Allowed |
| `UNCONFIRMED` | Reserved / transitional | Blocked |
| `NEEDS_NEGOTIATION` | Cannot auto-quote or above threshold | Blocked |
| `QUOTE_AVAILABLE` | Auto-calculated fee within policy + TTL | Allowed until expiry |
| `FEE_SET_BY_STAFF` | Staff confirm/override | Allowed |
| `EXPIRED` | Effective when `QUOTE_AVAILABLE` past `deliveryQuoteExpiresAt` | Blocked |

### Transitions

```
PICKUP create → NOT_REQUIRED → payable

DELIVERY create
  ├─ calculator OK under threshold → QUOTE_AVAILABLE (+ expiresAt) → payable
  └─ missing weight / distance / above threshold → NEEDS_NEGOTIATION → blocked

QUOTE_AVAILABLE + TTL elapsed → effective EXPIRED → blocked

Staff confirm (auto-quote) → QUOTE_AVAILABLE (expires cleared) + total locked
Staff override → FEE_SET_BY_STAFF + total recalculated + stale payments CANCELLED
```

## Pricing model (documented MVP)

Docs (`docs/09_DELIVERY/DELIVERY_ARCHITECTURE.md`) require server-side config and do **not** publish a production rate table.

**Boundary (Stage 07 correction):** The arithmetic currently used in `DeliveryCalculator` is a **provisional development placeholder**, not an approved final AWOH-B production formula. Configurable knobs (`ratePerKm`, `weightFactorPerKg`, `minFee`, `maxFee`, `negotiationThreshold`) are server-side and may be replaced when business rules are approved.

Provisional development computation (for architecture exercise only):

```text
rawFee = distanceKm × ratePerKm + totalWeightKg × weightFactorPerKg
```

- Default seeded `ratePerKm` = **₦500.00/km** via `DELIVERY_DEFAULT_DISTANCE_RATE` / `DeliveryConfig` — **configuration/development input only**, not confirmed production policy.
- Default `weightFactorPerKg` = `0` (safe default; does not invent weight surcharges).
- If any line lacks weight, distance is unavailable, or `appliedFee > negotiationThreshold` → `NEEDS_NEGOTIATION` (fee hidden from customer).

See also: `docs/00_MASTER/STAGE_07_CORRECTION_REVIEW.md`.

## Weight configuration

Authoritative field: `Product.weightPerCartonKg` (Decimal, nullable).

Seeded demo references (business-approved carton weights):

| Size hint | kg/carton |
|-----------|-----------|
| 250×400 | 15 |
| 300×600 | 25 |
| 600×600 | 32 |
| 250×500 | 28 |
| 1200×600 | 33 |

Non-tile demo trim uses its own weight (`5`) — catalog remains expandable.

## Distance provider

- Abstraction: `DISTANCE_PROVIDER` + `DistanceProvider`
- Active: `MockDistanceProvider` (`DELIVERY_DISTANCE_PROVIDER=mock`)
- Optional fixed demo km: `DELIVERY_MOCK_DISTANCE_KM`
- Else deterministic hash of address fields → 5–80 km
- Missing address → distance unavailable → negotiation

**Production:** replace with trusted geocoding/maps provider; set `DELIVERY_MAPS_API_KEY` only server-side. Do not use `NEXT_PUBLIC_*` for rates or keys.

## Negotiation flow

1. Customer places DELIVERY order  
2. Backend evaluates → `NEEDS_NEGOTIATION` or `QUOTE_AVAILABLE`  
3. If negotiation: customer message instructs contact AWOH-B; payment blocked  
4. Staff/Admin `POST .../delivery/override` sets authoritative fee → `FEE_SET_BY_STAFF`  
5. Order total = subtotal + fee; pending payments invalidated; fresh payment row  
6. Customer may pay  

Customer cannot submit negotiated/confirmed fees.

## Payment gate

`isPaymentAllowed` / `assertPayable` require:

`NOT_REQUIRED` **or** `QUOTE_AVAILABLE` (unexpired) **or** `FEE_SET_BY_STAFF`

Initialize/verify:

- Reuses payment only if amount matches current order total  
- Cancels stale PENDING/PROCESSING rows with mismatched amounts  
- Rejects CANCELLED/FAILED verification attempts  
- Provider verify amount must match authoritative order total  

## Order integration

- Create path evaluates delivery and persists fee/status/configId/internal snapshot/TTL  
- Confirmed fee updates `deliveryFee` + `total` transactionally  
- Paid orders retain historical fee; future weight/config changes do not rewrite them  

## Audit logging

| Action | When |
|--------|------|
| `delivery.quote_created` | Order create (delivery evaluation persisted) |
| `delivery.confirm` | Staff confirm auto-quote |
| `delivery.override` | Staff override negotiated fee |

Metadata: previous/new fee & status, new total, reason, actor. No secrets / no customer token dumps.

## RBAC

| Endpoint | Roles |
|----------|-------|
| `POST /api/v1/delivery/quote` | Authenticated customer |
| `GET /api/v1/orders/:id/delivery` | Owner only |
| `GET /api/v1/orders/:id/delivery/internal` | ADMIN, SALES_STAFF |
| `POST /api/v1/orders/:id/delivery/confirm` | ADMIN, SALES_STAFF |
| `POST /api/v1/orders/:id/delivery/override` | ADMIN, SALES_STAFF |

Permissions seeded: `delivery.read`, `delivery.manage`. No customer pricing-config mutation APIs in this stage.

## API endpoints

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/v1/delivery/quote` | Pre-checkout safe quote |
| GET | `/api/v1/orders/:id/delivery` | Customer safe status |
| GET | `/api/v1/orders/:id/delivery/internal` | Staff internals |
| POST | `/api/v1/orders/:id/delivery/confirm` | Staff confirm quote |
| POST | `/api/v1/orders/:id/delivery/override` | Staff set fee |

Client money/weight/distance fields are stripped/rejected (`ValidationPipe` whitelist + `forbidNonWhitelisted`).

## Frontend changes

- Checkout: pickup vs delivery messaging (no client fee math)  
- Order detail: safe delivery section (confirmed fee / contact AWOH-B / N/A)  
- Cart unchanged: `productId` + `quantity` only  
- No weight/distance/rate in web source  

## Database

Migration: `20260923190645_stage07_delivery_weights`

- `Product.weightPerCartonKg`
- `Order.deliveryQuoteExpiresAt`, `deliveryInternalJson`, `deliveryConfigId`
- Enum adds `EXPIRED` (via Prisma enum / SQLite text)
- `DeliveryConfig`, `AuditLog`

## Environment variables

Server-only (see `api/.env.example`):

```text
DELIVERY_DEFAULT_DISTANCE_RATE=500.00
DELIVERY_MOCK_DISTANCE_KM=
DELIVERY_DISTANCE_PROVIDER=mock
# DELIVERY_MAPS_API_KEY=
PAYMENT_CURRENCY=NGN
```

**Never** expose rates/weights via `NEXT_PUBLIC_*`.

## Testing

| Suite | Result |
|-------|--------|
| API unit (`npm test`) | **48 passed / 8 suites** |
| Web build | **PASS** |
| API build | **PASS** |

Coverage includes: calculator fees, negotiation triggers, customer DTO privacy, catalog weight omission, payment gate on expiry, override audit + total recalculation, Stage 04–06 regression suites.

## Production considerations

- Verify Decimal / transactions / indexes on **PostgreSQL** before go-live (local runs SQLite)  
- Replace mock distance with trusted provider  
- Review/approve production `DeliveryConfig` rates and negotiation threshold  
- HTTPS + secret hygiene unchanged from Stage 05/06  
- Staff UI for negotiation is **Stage 08**  

## Known limitations

- Mock distance is not geographic truth  
- Weight factor default `0` until business defines surcharges  
- No admin UI for `DeliveryConfig` editing (API foundations only)  
- No full staff delivery dashboard  
- Auto-quote (`QUOTE_AVAILABLE`) is treated as customer-payable approved fee within TTL; staff override remains available for negotiation cases  

## Deferred

### Stage 08

- Staff/admin operational UI (confirm/override, order ops)  
- Offline cash confirmation UI  
- Inventory / CMS dashboards  

### Stage 09+

- Production maps provider  
- Complex bracket engines (if approved)  
- Final production deployment hardening  

## Acceptance checklist

- [x] Backend owns delivery calculations  
- [x] Authoritative product weight in DB  
- [x] Initial tile weights seeded  
- [x] Frontend cannot manipulate fee/weight/distance  
- [x] Configurable pricing (`DeliveryConfig`)  
- [x] Negotiation state + payment gate  
- [x] Confirmed fee updates order total  
- [x] Stale payment invalidation  
- [x] RBAC on staff endpoints + audit  
- [x] Customer DTO / catalog / cart / receipt privacy  
- [x] Offline flow compatible (pickup / offline cash)  
- [x] Stage 04–07 tests + API/web builds  
- [x] `STAGE_07_REVIEW.md`  
- [x] Status: `READY FOR HUMAN REVIEW`

## Git / commit

No commit created in this stage run (await explicit human request).

---

**FINAL STATUS: READY FOR HUMAN REVIEW**

**STOP — DO NOT IMPLEMENT STAGE 08.**
