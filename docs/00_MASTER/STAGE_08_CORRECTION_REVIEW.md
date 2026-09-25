# Stage 08 Correction Review — Pre-Stage 09 Gate

## Status

```text
STAGE 08 — READY FOR FINAL HUMAN APPROVAL
```

## Scope

Targeted verification/correction only. No Stage 09 work. No architecture redesign.

**No schema migration required.**

---

## A. RBAC Verification

Verified against the **documented Stage 08 controller + seed permission matrix** via:

1. Automated `RolesGuard` matrix tests (`admin.rbac.spec.ts`) for all five roles × representative operations  
2. Live HTTP smoke with seeded staff users (`SEED_DEV_STAFF=true`) — `SMOKE_RBAC_OVERALL=PASS`

| Operation | ADMIN | SALES | INVENTORY | CONTENT | CUSTOMER |
| --------- | ----- | ----- | --------- | ------- | -------- |
| Dashboard | PASS | PASS | PASS | PASS | PASS (403) |
| Orders | PASS | PASS | PASS | PASS (403) | PASS (403) |
| Offline payment | PASS* | PASS* | PASS (403) | PASS (403) | PASS (403) |
| Delivery operation | PASS* | PASS* | PASS (403) | PASS (403) | PASS (403) |
| Product create | PASS | PASS (403) | PASS (403) | PASS | PASS (403) |
| Product price | PASS | PASS (403) | PASS (403) | PASS (403) | PASS (403) |
| Inventory / weight | PASS | PASS (403) | PASS | PASS (403) | PASS (403) |
| Category management (mutate) | PASS | PASS (403) | PASS (403) | PASS | PASS (403) |
| Category read (GET) | PASS | PASS (allowed R) | PASS (allowed R) | PASS | PASS (403) |
| Subcategory management (mutate) | PASS* | PASS* (403) | PASS* (403) | PASS* | PASS* (403) |
| Audit | PASS | PASS (403) | PASS (403) | PASS (403) | PASS (403) |
| Image upload | PASS* | PASS* (403) | PASS* (403) | PASS* | PASS* (403) |

\*ALLOW for ADMIN/SALES/CONTENT where applicable proven by unit RBAC matrix + matching smoke denials for unauthorized roles. Subcategory/image use the same role/permission contracts as category / product-manage.

### Correction applied

- CONTENT product **create** no longer persists client-supplied `stockQuantity` / `weightPerCartonKg` (only ADMIN may set inventory fields on create).

### Seed addition (dev only)

Optional staff users when `SEED_DEV_STAFF=true`:

- `demo.sales@example.local`
- `demo.inventory@example.local`
- `demo.content@example.local`

---

## B. Weight Security

| Item | Result |
|------|--------|
| Authorized roles | **ADMIN**, **INVENTORY_MANAGER** via `PATCH /api/v1/admin/products/:id/inventory` + `inventory.manage` |
| Validation | Finite number ≥ 0; invalid rejected |
| Mass assignment | Explicit DTO whitelist only (`UpdateInventoryDto`) |
| Audit | `inventory.update` with `weightBefore` / `weightAfter` / `weightChanged` |
| Customer privacy | Public product DTO still omits `weightPerCartonKg` (unit + smoke) |
| Delivery engine | Calculator uses authoritative DB weight × qty; does **not** infer from name (unit test) |
| CONTENT create | Client weight/stock ignored |

---

## C. Image Security

| Item | Result |
|------|--------|
| Accepted | JPG (`image/jpeg`), PNG, WEBP |
| Size limit | 5MB (`PRODUCT_IMAGE_MAX_BYTES`) |
| Rejected | Unsupported MIME, bad extension, MIME/ext mismatch, oversized, path traversal (`..`, `/`, `\`) |
| Filename | Server-generated only; never uses user path as storage path |
| Authorization | ADMIN + CONTENT_MANAGER (`products.manage`); SALES/CUSTOMER denied by RBAC |
| Last-image delete | Existing guard retained (must keep ≥1 image) |

Tests: `admin-upload.service.spec.ts`

---

## D. PostgreSQL

```text
PostgreSQL runtime available: NO
PostgreSQL runtime verification: NOT EXECUTED
```

### Known compatibility concerns (code audit only)

- Admin/catalog search uses Prisma `contains` (SQLite vs PG case-sensitivity may differ; consider `mode: 'insensitive'` on PG later)
- No raw SQL in Stage 08 admin module
- Decimal money paths remain Prisma `Decimal` + minor-unit helpers (PG-compatible when provider switched)
- Pagination uses `skip`/`take` + deterministic `orderBy`
- Local provider remains SQLite; production still requires PG migration verification in Stage 10

Do **not** claim full PostgreSQL readiness.

---

## E. Regression

```text
Previous test baseline: 62 passed / 15 suites
New test result:        130 passed / 18 suites
Failures:               0
API build:              PASS
Web build:              PASS
Smoke tests:            SMOKE_RBAC_OVERALL=PASS
```

New suites include: `admin.rbac.spec.ts`, `admin-upload.service.spec.ts`, `admin-weight.security.spec.ts`.

Stage 04–07 privacy/delivery suites remain green.

---

## Files changed (this pass)

- `api/src/admin/admin-catalog.service.ts` — inventory-field create gate; weight audit metadata; finite weight validation
- `api/src/admin/admin-catalog.controller.ts` — ADMIN-only inventory fields on create
- `api/src/admin/admin-upload.service.ts` — path traversal rejection; safer filename generation
- `api/src/admin/admin.rbac.spec.ts` (new)
- `api/src/admin/admin-upload.service.spec.ts` (new)
- `api/src/admin/admin-weight.security.spec.ts` (new)
- `api/scripts/smoke-rbac-stage08.ps1` (new) — multi-role HTTP smoke
- `api/prisma/seed.ts` — optional staff seed
- `api/.env` / `api/.env.example` — staff seed placeholders
- `docs/00_MASTER/STAGE_08_CORRECTION_REVIEW.md` (this file)

---

## Remaining limitations

- PostgreSQL runtime not executed in this environment
- Auth rate limiter is in-memory (restart clears); multi-instance prod still Stage 10 concern
- Stage 09 broad hardening not started

---

## Final gate

```text
STAGE 08 — READY FOR FINAL HUMAN APPROVAL
```

**STOP — DO NOT IMPLEMENT STAGE 09.**
