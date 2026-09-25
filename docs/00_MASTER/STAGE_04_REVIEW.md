# Stage 04 Review — Products, Categories, Search, Cart & Product Experience

## Stage

Stage 04 — Products, Categories, Search, Cart & Product Experience

## Status

`READY FOR HUMAN REVIEW`

## Implemented

- NestJS catalog API with Prisma (Category → Subcategory → Product → ProductImage)
- Public read-only endpoints for categories, subcategories, products, search, filter, sort, pagination, and cart price resolve
- Next.js catalog pages: `/products`, `/products/[productSlug]`, `/categories/[categorySlug]`, `/categories/.../[subcategorySlug]`, `/cart`
- SEO-friendly slugs; product gallery; quantity selector; add-to-cart
- Local cart persistence (`productId` + `quantity` only) via `localStorage`
- Header cart count; homepage featured + category discovery driven by API
- Loading / empty / error / not-found states
- Development seed dataset (clearly labeled demo)
- Catalog service unit tests

## Database Changes

- Prisma schema: `Category`, `Subcategory`, `Product`, `ProductImage`
- Enums: `CatalogStatus`, `ProductAvailability`
- Internal-only `stockQuantity` (not exposed publicly)
- Optional `specsJson` for extensible product specs
- Migration: `api/prisma/migrations/20260923090047_catalog_stage04`
- Local datasource: SQLite (`file:./dev.db`) for zero-infra MVP; production target remains PostgreSQL

## API Changes

Public (customer) endpoints under `/api/v1`:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/categories` | List active categories + subcategories |
| GET | `/categories/:categorySlug` | Category detail |
| GET | `/categories/:categorySlug/subcategories/:subcategorySlug` | Subcategory detail |
| GET | `/products` | List/search/filter/sort/paginate products |
| GET | `/products/:slug` | Product detail |
| GET | `/products/resolve?ids=` | Resolve cart lines to authoritative product data |
| GET | `/health` (`/api/v1/health`) | Health check |

Query validation via DTOs (`page`, `limit` max 48, `sort`, `q`, `category`, `subcategory`, `featured`).

No public create/update/delete product endpoints (Stage 08).

## Frontend Changes

- `web/src/lib/api.ts` — catalog client
- `web/src/lib/cart.ts` — local cart storage
- `web/src/lib/money.ts` — display formatting (NGN placeholder config)
- `web/src/components/cart/cart-provider.tsx` — cart context + toasts
- `web/src/components/catalog/catalog-filters.tsx` — search/filter/sort UI
- `web/src/components/product/product-detail-client.tsx` — gallery, qty, add to cart
- Pages: products, product detail, category, subcategory, cart, branded `not-found`
- Homepage: `FeaturedCollection`, `CategoryDiscovery` consume API
- Header: Collections + Cart `(n)`

## Search / Filter

- Backend `contains` filter on product `name` and `description` (PostgreSQL-compatible; SQLite locally)
- Filters: `category` slug, `subcategory` slug
- Sort: `newest`, `name_asc`, `name_desc`, `price_asc`, `price_desc` (server-side)
- Search result pages set `robots: noindex` when `q` is present

## Cart

- Persistence: `localStorage` key `awoh-b-cart-v1`
- Stores only `{ productId, quantity }`
- Display prices/subtotals resolved via `GET /products/resolve`
- Client totals are display-only; not submitted as authoritative commerce values
- Survives navigation and refresh
- Toast feedback on add/remove/clear (Stage 02 toast system)
- Checkout button disabled (placeholder only)

## Product Images

- Multiple `ProductImage` rows with `sortOrder`, `isPrimary`, `altText`
- Seed/dev images use `/images/placeholders/*.svg` under `web/public`
- Frontend uses `next/image` with `unoptimized` for SVG placeholders
- No admin upload (Stage 08)

## Seed Data

- `api/prisma/seed.ts` — development-only demo categories/subcategories/products
- Explicitly labeled as demo / not production AWOH-B SKUs
- Demonstrates hierarchy + multi-image products + featured flags

## Security

- Prisma parameterized queries
- ValidationPipe whitelist + forbidNonWhitelisted + DTO bounds
- Public DTOs omit `stockQuantity` / internal inventory
- Prices and availability originate from backend only
- Cart does not store prices or credentials
- No auth/payment endpoints introduced

## Accessibility

- Semantic headings on catalog/product/cart pages
- Accessible search, selects, quantity controls (labels, aria-label)
- Cart link announces item count
- Availability badges include text labels (not color alone)
- Focus-visible styles from design system
- Meaningful image alt text where provided

## SEO

- Metadata helpers for catalog, category, subcategory, product pages
- Slug-based URLs (no public numeric IDs)
- Search query pages marked noindex
- Canonical-friendly path structure via `createPageMetadata`

## Performance

- Bounded API `limit` (max 48)
- Pagination on `/products`
- `next/image` for product imagery
- Server components for catalog/list pages where practical
- Cart uses lightweight React context (no Redux)

## Testing

- API unit tests: `api/src/catalog/catalog.service.spec.ts`
  - Result: **10 passed**
- API build: `npm run build` in `api` — **PASS**
- Web build: `npm run build` in `web` — **PASS** (routes: `/`, `/products`, `/products/[productSlug]`, `/categories/...`, `/cart`)
- API smoke: categories/products/search/not-found/health — verified against running server

## Out of Scope

Confirmed **not** implemented in Stage 04:

- Authentication / register / login / password reset
- Customer accounts
- RBAC
- Paystack / payment verification
- Checkout / order creation
- Delivery-fee engine / product weight calculations
- Admin dashboard / CMS / staff management
- Image upload workflows

## Risks

- Local SQLite ≠ production PostgreSQL; migrate provider before production
- Currency configured as NGN placeholder pending business confirmation
- Placeholder SVG images are not production photography
- Search is simple `contains` (case sensitivity may differ SQLite vs Postgres)
- Unauthenticated cart is device-local only (Stage 05 may introduce server carts)

## Stage 05 Dependencies

- Account registration/login for registered checkout MVP
- Association of cart with authenticated customer (optional migration from local cart)
- Protected customer routes; still no payment until Stage 06

## Acceptance Criteria

| ID | Criterion | Result |
|----|-----------|--------|
| AC-04-001 | Real backend-driven product catalog | PASS |
| AC-04-002 | Category → Subcategory → Product hierarchy | PASS |
| AC-04-003 | Products from authoritative backend | PASS |
| AC-04-004 | Prices backend-authoritative | PASS |
| AC-04-005 | Availability backend-authoritative | PASS |
| AC-04-006 | SEO-friendly product URLs | PASS |
| AC-04-007 | SEO-friendly category URLs | PASS |
| AC-04-008 | SEO-friendly subcategory URLs | PASS |
| AC-04-009 | Product detail page | PASS |
| AC-04-010 | Multi-image gallery | PASS |
| AC-04-011 | Quantity selector | PASS |
| AC-04-012 | Add to cart | PASS |
| AC-04-013 | Cart page | PASS |
| AC-04-014 | Cart quantity changes | PASS |
| AC-04-015 | Cart item removal | PASS |
| AC-04-016 | Cart clear | PASS |
| AC-04-017 | Cart survives refresh | PASS |
| AC-04-018 | Cart does not trust client prices | PASS |
| AC-04-019 | Product search | PASS |
| AC-04-020 | Category filtering | PASS |
| AC-04-021 | Subcategory filtering | PASS |
| AC-04-022 | Sorting | PASS |
| AC-04-023 | Pagination / bounded retrieval | PASS |
| AC-04-024 | Loading states | PASS |
| AC-04-025 | Empty states | PASS |
| AC-04-026 | Error states | PASS |
| AC-04-027 | Product/category not-found | PASS |
| AC-04-028 | Responsive breakpoints | PASS |
| AC-04-029 | Accessibility fundamentals | PASS |
| AC-04-030 | SEO foundations | PASS |
| AC-04-031 | API validation | PASS |
| AC-04-032 | No unsafe client price authority | PASS |
| AC-04-033 | No sensitive inventory exposure | PASS |
| AC-04-034 | No Stage 05 auth/RBAC | PASS |
| AC-04-035 | No Stage 06 payment/checkout | PASS |
| AC-04-036 | No Stage 07 delivery engine | PASS |
| AC-04-037 | No Stage 08 admin/CMS | PASS |
| AC-04-038 | Tests/build checks pass | PASS |
| AC-04-039 | Stage 04 documentation exists | PASS |

## Human Approval

`PENDING HUMAN REVIEW`
