# Stage 08 Review — Admin Dashboard, CMS & Operations

## Stage

Stage 08 — Admin Dashboard, CMS & Operations

## Status

`READY FOR HUMAN REVIEW`

## Implementation summary

Stage 08 adds a protected `/admin` operations area and NestJS `/api/v1/admin/*` APIs on top of Stages 04–07 without redesigning auth, RBAC, orders, payments, delivery, or public catalog DTOs.

Capabilities:

- Role-aware admin shell + dashboard
- Staff order list/detail with filters
- Offline/cash payment confirmation (audited, idempotent)
- Delivery negotiation UI reusing Stage 07 confirm/override APIs
- Product CMS (create/edit/deactivate, images)
- Category / subcategory management (deactivate-safe)
- Inventory updates (stock, availability, internal weight)
- ADMIN audit log viewer
- Static serving for `/uploads/*`

## Files changed (high level)

### Backend

- `api/src/admin/*` (module, controllers, services, DTOs, mappers, upload)
- `api/src/payments/payments.service.ts` (`confirmOfflinePayment`)
- `api/src/payments/payments.module.ts` (AuditModule)
- `api/src/app.module.ts`, `api/src/main.ts` (AdminModule + static uploads)
- `api/src/auth/auth.module.ts`, `auth.constants.ts`
- `api/prisma/seed.ts` (`audit.read` permission)
- Specs: `admin.mapper.spec.ts`, `admin-catalog.service.spec.ts`, `offline-confirm.spec.ts`
- `api/.env.example` (`UPLOADS_DIR`)

### Frontend

- `web/src/app/admin/**` (layout + dashboard/orders/products/categories/subcategories/inventory/audit)
- `web/src/lib/admin-api.ts`

### Docs

- `docs/00_MASTER/STAGE_08_REVIEW.md`

## Database / migrations

**No schema migration required.**

Used existing models: Order, Payment, Product, ProductImage, Category, Subcategory, AuditLog, Delivery fields from Stage 07.

Seed update: permission `audit.read` (ADMIN via full permission set).

## API endpoints added/changed

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/admin/dashboard` | Staff roles |
| GET | `/api/v1/admin/orders` | orders.read |
| GET | `/api/v1/admin/orders/:id` | orders.read |
| POST | `/api/v1/admin/orders/:id/payments/confirm-offline` | orders.manage (ADMIN/SALES) |
| GET/POST/PATCH | `/api/v1/admin/categories*` | content.manage / products.read |
| GET/POST/PATCH | `/api/v1/admin/subcategories*` | content.manage / products.read |
| GET/POST/PATCH | `/api/v1/admin/products*` | products.* |
| PATCH | `/api/v1/admin/products/:id/price` | ADMIN |
| PATCH | `/api/v1/admin/products/:id/inventory` | inventory.manage |
| POST | `/api/v1/admin/products/:id/images` | products.manage (multipart) |
| DELETE | `/api/v1/admin/products/:pid/images/:iid` | products.manage |
| GET | `/api/v1/admin/inventory` | inventory.read |
| GET | `/api/v1/admin/audit` | audit.read (ADMIN) |

Delivery ops reuse Stage 07:

- `GET /api/v1/orders/:id/delivery/internal`
- `POST /api/v1/orders/:id/delivery/override`
- `POST /api/v1/orders/:id/delivery/confirm`

Static: `GET /uploads/products/*`

## RBAC matrix

| Area | ADMIN | SALES_STAFF | INVENTORY_MANAGER | CONTENT_MANAGER | CUSTOMER |
|------|-------|-------------|-------------------|-----------------|----------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✗ |
| Orders | ✓ | ✓ | read | ✗ | ✗ |
| Offline confirm | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delivery override | ✓ | ✓ | ✗ | ✗ | ✗ |
| Products CMS | ✓ | read | read | manage content | ✗ |
| Price edit | ✓ | ✗ | ✗ | ✗ | ✗ |
| Inventory/weight | ✓ | ✗ | ✓ | ✗ | ✗ |
| Categories/subs | ✓ | read | read | manage | ✗ |
| Audit | ✓ | ✗ | ✗ | ✗ | ✗ |

Frontend nav is role-filtered; **backend guards are authoritative**.

## Admin pages

```text
/admin → /admin/dashboard
/admin/dashboard
/admin/orders
/admin/orders/[id]
/admin/products
/admin/products/new
/admin/products/[id]
/admin/categories
/admin/subcategories
/admin/inventory
/admin/audit
```

## CMS / inventory / audit

- Create product requires initial image URL; uploads validated (JPG/PNG/WEBP, 5MB)
- Prefer deactivate over hard-delete for categories/subcategories/products
- Inventory adjusts `stockQuantity`, `availability`, `weightPerCartonKg` (never public)
- Audit sanitizes metadata (no password/token/secret keys)

## Security / privacy

- Staff order DTO excludes `deliveryInternalJson` and calculation fields
- Public catalog mapper unchanged (no weight/stock)
- Customer cannot call admin APIs (RolesGuard → 403)
- Offline confirm rejects non-offline methods; amount must match order total; audited
- Delivery fee set only via Stage 07 service

## Tests

| Suite | Result |
|-------|--------|
| API unit (`npm test`) | **62 passed / 15 suites** |
| API build | **PASS** |
| Web build | **PASS** |

Includes Stage 04–07 regression + Stage 08 mapper/offline/catalog guards.

## Smoke tests

Performed against local API after seed — **SMOKE_OVERALL=PASS**:

- Customer denied on `/api/v1/admin/orders` (403)
- Admin dashboard + orders list
- Product create (staff fields present)
- Public product excludes `weightPerCartonKg` / `stockQuantity`
- Offline cash confirm → PAID + idempotent re-confirm
- Audit list (ADMIN)
- Customer denied offline confirm (403)

## Known limitations

- No dedicated SALES/CONTENT/INVENTORY demo users in seed (ADMIN + CUSTOMER only by default)
- Admin UI is MVP operational, not a full analytics/WMS suite
- Image storage is local disk (`storage/uploads`) — production object storage deferred
- SQLite local; PostgreSQL verification still required for production
- Delivery internal snapshot shown as JSON to authorized sales/admin (not customers)

## PostgreSQL considerations

- Decimal/transactions/indexes for admin listing filters should be verified on PostgreSQL
- File uploads path permissions on deployed hosts
- No SQLite-specific admin queries beyond Prisma `contains` search

## Stage boundary

Stage 09 (security/perf polish) and Stage 10 (production deploy) **not started**.

---

## Stage 08 Implementation Status

```text
READY FOR HUMAN REVIEW
```

**STOP — DO NOT IMPLEMENT STAGE 09.**
