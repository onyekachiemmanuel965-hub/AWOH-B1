# API Modules & Responsibilities

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Stage 01 rule:** Document only — **do not** build APIs yet.

High-level NestJS modular monolith map. Endpoint lists are indicative, not exhaustive.

---

## Cross-cutting API rules

1. Validate all inputs with DTOs
2. Authenticate where required; authorize with RBAC guards
3. Never trust client for payment success or delivery internals
4. Customer DTOs must strip internal fields
5. Rate-limit auth, checkout, payment, and upload endpoints
6. Return safe error messages

Base path suggestion: `/api/v1/...`

---

## Module: Auth

**Responsibilities:** Register (customer), login, logout, refresh/session rotation, password change/reset flows as scoped later.

**Example endpoints:**

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `POST /auth/password/change`

**Security:** Hashing, HttpOnly cookies where applicable, CSRF strategy as designed in Stage 05, lockout/rate limits.

---

## Module: Users

**Responsibilities:** Customer profile self-service; admin/staff user administration.

**Example endpoints:**

- `GET /users/me`
- `PATCH /users/me`
- `GET /admin/users` (RBAC)
- `PATCH /admin/users/:id` (RBAC)

---

## Module: Roles / Permissions

**Responsibilities:** Role assignment and permission management (Admin).

**Example endpoints:**

- `GET /admin/roles`
- `PUT /admin/users/:id/roles`
- `GET /admin/permissions`

**Security:** Audited; customers denied.

---

## Module: Categories & Subcategories

**Responsibilities:** Dynamic **Category → Subcategory → Product** taxonomy; public browse; CMS mutations (create/edit/activate/deactivate/reorder); SEO slugs; optional images.

**Example endpoints:**

- `GET /categories` (active tree)
- `GET /categories/:slug`
- `GET /categories/:slug/subcategories/:subSlug`
- `GET /products?category=&subcategory=` (filter)
- `POST /admin/categories`
- `PATCH /admin/categories/:id` (incl. status, sortOrder, image)
- `POST /admin/categories/:id/subcategories`
- `PATCH /admin/subcategories/:id`
- Soft-deactivate preferred over hard delete when products exist

**Rules:** Taxonomy is data-driven — not hardcoded. Public routes expose active nodes only.

---

## Module: Products

**Responsibilities:** Public catalog read; staff product management; image attach metadata.

**Example endpoints:**

- `GET /products` (search/filter/pagination; filter by category and subcategory)
- `GET /products/:idOrSlug`
- `POST /admin/products` (requires `subcategoryId`)
- `PATCH /admin/products/:id`
- `POST /admin/products/:id/images`
- `DELETE /admin/products/:id/images/:imageId`

**Security:** Public product responses exclude internal delivery weight fields.

---

## Module: Inventory

**Responsibilities:** Stock read/update for authorized roles; availability checks used by checkout.

**Example endpoints:**

- `GET /admin/inventory`
- `PATCH /admin/inventory/:productId`

---

## Module: Cart

**Responsibilities:** Cart CRUD for authenticated registered customer (MVP).

**Example endpoints:**

- `GET /cart`
- `POST /cart/items` body: `{ productId, quantity }`
- `PATCH /cart/items/:id`
- `DELETE /cart/items/:id`

**Security:** Ignore client-supplied unit prices/weights.

---

## Module: Orders

**Responsibilities:** Checkout/create order; customer order history; staff order management.

**Example endpoints:**

- `POST /orders/checkout`
- `GET /orders/me`
- `GET /orders/me/:id`
- `GET /admin/orders`
- `PATCH /admin/orders/:id/status`

---

## Module: Payments

**Responsibilities:** Initialize Paystack payment; verify; webhook; offline payment status updates.

**Example endpoints:**

- `POST /payments/paystack/initialize` (refused if delivery fee unconfirmed)
- `GET /payments/paystack/verify/:reference` (server-side verify orchestration)
- `POST /payments/paystack/webhook` (signature verified)
- `PATCH /admin/payments/:id/offline-status`

**Security:** Webhook signature required; frontend cannot mark SUCCESS; initialize blocked while delivery `NEEDS_NEGOTIATION`.

---

## Module: Delivery

**Responsibilities:** Server-side quote/finalize; negotiation state; staff config and overrides.

**Example endpoints:**

- `POST /delivery/quote` (customer-safe input only → customer-safe output)
- `GET /orders/me/:id/delivery` (fee/status/message only)
- `GET /admin/delivery/config`
- `PUT /admin/delivery/config` (audited)
- `PATCH /admin/orders/:id/delivery` (fee override / negotiation resolution, audited)

**Security:** Reject payloads containing authoritative internal calculation fields from customers.

---

## Module: Receipts

**Responsibilities:** Generate/fetch PDF; trigger email send.

**Example endpoints:**

- `GET /orders/me/:id/receipt.pdf`
- `POST /orders/me/:id/receipt/email` (rate-limited)
- `GET /admin/orders/:id/receipt.pdf`

**Security:** Authorization to own order or staff role; totals from DB only.

---

## Module: Content

**Responsibilities:** Storefront content blocks used by landing/CMS.

**Example endpoints:**

- `GET /content/:key`
- `PUT /admin/content/:key`

---

## Module: Audit

**Responsibilities:** Persist and query audit events.

**Example endpoints:**

- `GET /admin/audit-logs` (filtered)

Writes occur internally from other modules — not a public write API.

---

## Suggested NestJS module list

`AuthModule`, `UsersModule`, `RbacModule`, `CategoriesModule`, `ProductsModule`, `InventoryModule`, `CartModule`, `OrdersModule`, `PaymentsModule`, `DeliveryModule`, `ReceiptsModule`, `ContentModule`, `AuditModule`, `StorageModule`, `MailModule`

Shared: `PrismaModule`, config, throttling.

---

## Non-goals for this document

- Full OpenAPI spec
- Every query parameter
- Implementation code
