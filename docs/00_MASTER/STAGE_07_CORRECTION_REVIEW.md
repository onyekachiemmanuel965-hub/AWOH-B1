# Stage 07 Correction Review — Pre-Stage 08 Gate

## Status

`READY FOR STAGE 08`

## Scope

Targeted correction of four human-review conditions. No Stage 08 work. No schema redesign.

**No schema migration required.**

---

## A. Correction Summary

### Condition 1 — Delivery formula / business-rule boundary

| Field | Detail |
|-------|--------|
| **Problem** | Provisional calculator arithmetic was described as if it were an approved production business formula; ₦500/km risked being read as confirmed policy. |
| **Correction** | Marked calculator, DeliveryConfig fallbacks, seed config, `.env.example`, and Stage 07 review docs as **provisional development** behavior. Config knobs remain server-side. No new formulas/brackets invented. |
| **Files changed** | `api/src/delivery/delivery.calculator.ts`, `api/src/delivery/delivery.service.ts`, `api/src/delivery/delivery.calculator.spec.ts`, `api/prisma/seed.ts`, `api/.env.example`, `api/.env`, `docs/00_MASTER/STAGE_07_REVIEW.md` |
| **Verification** | Comments/docs state provisional vs configured; customer DTOs unchanged (safe fields only). |
| **Status** | **PASS** |

### Condition 2 — Clean end-to-end API smoke test

| Field | Detail |
|-------|--------|
| **Problem** | Prior smoke was interrupted by Windows Prisma DLL lock during regenerate. |
| **Correction** | Stopped API → `prisma generate` (PASS) → seed → start API → full delivery→negotiation→override→payment flow. |
| **Files changed** | None required for smoke itself (runtime verification). |
| **Verification** | See section C. |
| **Status** | **PASS** |

### Condition 3 — `deliveryInternalJson` cannot leak

| Field | Detail |
|-------|--------|
| **Problem** | Need proof customer paths never serialize internal delivery snapshots. |
| **Correction** | Confirmed `toPublicOrder` / `toCustomerDeliveryDto` / receipt lines are explicit safe DTOs. Added regression tests + live smoke privacy assertions. Staff internal endpoint remains RBAC-gated. |
| **Files changed** | `api/src/orders/orders.privacy.spec.ts`, `api/src/delivery/delivery.rbac.spec.ts`, `api/src/payments/receipt.service.ts` (`buildReceiptTextLines`), `api/src/payments/receipt.privacy.spec.ts` |
| **Verification** | Unit + smoke: no internal fields on customer order/list/delivery/payment/receipt paths; customer gets 403 on `/delivery/internal`; admin can read internal. |
| **Status** | **PASS** |

### Condition 4 — Seeded product weights explicitly stored

| Field | Detail |
|-------|--------|
| **Problem** | Weights must be authoritative DB fields, not inferred from names/size strings at runtime. |
| **Correction** | Introduced `api/prisma/seed-weights.ts` with explicit size→kg constants; seed assigns `Product.weightPerCartonKg` from those constants. Calculator tests prove DB weight is used and name does **not** invent weight when null. |
| **Files changed** | `api/prisma/seed-weights.ts`, `api/prisma/seed.ts`, `api/src/delivery/seed-weights.spec.ts` |
| **Verification** | Live DB query after seed: all five tile weights PASS. |
| **Status** | **PASS** |

---

## B. Delivery Formula Boundary

### Approved / configured (server-side knobs — not automatic final policy)

- `DeliveryConfig.ratePerKm`
- `DeliveryConfig.weightFactorPerKg` (seeded `0`)
- `DeliveryConfig.minFee` / `maxFee`
- `DeliveryConfig.negotiationThreshold`
- `DeliveryConfig.quoteTtlMinutes`
- Distance via `DistanceProvider` (mock in development)
- Product `weightPerCartonKg` (authoritative carton weights for seeded tiles)

### Provisional (development only — NOT final AWOH-B production formula)

```text
rawFee = distanceKm × ratePerKm + totalWeightKg × weightFactorPerKg
appliedFee = clamp(max(minFee, rawFee), maxFee?)
```

- **₦500/km** is a **configuration / development default** (`DELIVERY_DEFAULT_DISTANCE_RATE` / seed). It is **not** confirmed production business policy unless owners explicitly approve it.
- No undocumented final business formula was invented.
- Architecture remains ready to swap in approved rules later without changing the customer trust boundary.

---

## C. Smoke Test

| Check | Result |
|-------|--------|
| Prisma generation | **PASS** |
| API startup | **PASS** |
| Delivery quote | **PASS** (`NEEDS_NEGOTIATION` under temporary low threshold for negotiation path) |
| Negotiation gate | **PASS** (`paymentAllowed=false`, contact AWOH-B message) |
| Staff/admin confirmation (override) | **PASS** (`FEE_SET_BY_STAFF`, fee 6500) |
| Order total recalculation | **PASS** (18500 + 6500 = 25000) |
| Payment gate | **PASS** (blocked before; allowed after) |
| Payment initialization | **PASS** (authoritative total 25000; client amount fields ignored) |
| Audit `delivery.override` | **PASS** (count ≥ 1) |
| DB tile weights | **PASS** (see table E) |

Negotiation path used a temporary low `negotiationThreshold` for the smoke scenario, then restored to `250000.00`.

---

## D. Privacy Verification

Customer-facing endpoints exercised:

| Endpoint | Internal fields blocked |
|----------|-------------------------|
| `GET /api/v1/products` | **PASS** |
| `POST /api/v1/delivery/quote` | **PASS** |
| `POST /api/v1/orders` | **PASS** |
| `GET /api/v1/orders` | **PASS** |
| `GET /api/v1/orders/:id` | **PASS** |
| `GET /api/v1/orders/:id/delivery` | **PASS** |
| Payment initialize response order | **PASS** |
| Receipt text builder | **PASS** (unit) |
| `GET .../delivery/internal` as CUSTOMER | **403/401 PASS** |
| `GET .../delivery/internal` as ADMIN | **PASS** (internal present) |

Can these appear in customer responses?

| Field | Customer-visible? |
|-------|-------------------|
| `deliveryInternalJson` | **NO** |
| `weightPerCartonKg` | **NO** |
| `totalWeightKg` | **NO** |
| `distanceKm` | **NO** |
| `ratePerKm` | **NO** |
| `weightFactorPerKg` | **NO** |
| `surcharge` | **NO** |
| `negotiationThreshold` | **NO** |

---

## E. Seeded Weight Verification

| Product/Size | Stored DB Weight | Verification |
| ------------ | ---------------: | ------------ |
| 250×400 (`demo-ceramic-surface-c`) | 15 kg | **PASS** |
| 300×600 (`demo-porcelain-surface-b`) | 25 kg | **PASS** |
| 600×600 (`demo-porcelain-surface-a`) | 32 kg | **PASS** |
| 250×500 (`demo-ceramic-surface-f`) | 28 kg | **PASS** |
| 1200×600 (`demo-stone-look-surface-d`) | 33 kg | **PASS** |

Weights are explicitly assigned via `EXPLICIT_TILE_CARTON_WEIGHTS_KG` → `Product.weightPerCartonKg`. Runtime calculator does not infer weight from product names.

---

## F. Regression Tests

| Item | Result |
|------|--------|
| Previous Stage 04–07 suites | Included |
| New privacy / weight / receipt / staff-visibility tests | Added |
| Total tests | **57** |
| Passed | **57** |
| Failed | **0** |
| API build | **PASS** |
| Web build | **PASS** |

---

## G. Remaining Limitations

- Provisional calculator arithmetic awaits owner-approved final formula.
- Mock distance provider is not production geography.
- Staff/admin operational UI remains Stage 08.
- Admin DeliveryConfig UI remains Stage 08.
- Local DB is SQLite; PostgreSQL verification still pending for production.

---

## Final gate status

```text
READY FOR STAGE 08
```

**STOP — do not implement Stage 08 in this pass.**
