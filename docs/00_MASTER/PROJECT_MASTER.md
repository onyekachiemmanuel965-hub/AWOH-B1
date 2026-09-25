# PROJECT MASTER — AWOH-B THE GREAT TILES VENTURE

| Field | Value |
|-------|--------|
| **Project name** | AWOH-B THE GREAT TILES VENTURE |
| **Short name** | AWOH-B |
| **Document type** | Master project charter |
| **Current stage** | Stage 09 — Security, Testing, Performance & Final UX Polish |
| **Stage status** | Stages 01–08 approved; Stage 09 complete — **awaiting human review** |
| **Architecture** | Modular monolith |
| **Delivery goal** | Production-ready MVP under a short client deadline |

> **Naming note:** This project is **not** AO Solid Base. Do not reuse AO Solid Base branding, naming, or visual identity as the active brand for AWOH-B.

---

## 1. Project purpose

Build a **premium e-commerce platform** for AWOH-B THE GREAT TILES VENTURE so customers can browse architectural tiles/materials, place orders, pay online (Paystack) or offline/cash, and receive confirmation — while staff securely manage catalog, inventory, orders, payments, delivery, content, and users.

---

## 2. Business objective

Enable the business to sell tiles and related materials online with:

- A trustworthy, premium storefront experience
- Reliable catalog and inventory operations
- Clear order and payment handling (online + offline)
- Secure, server-authoritative delivery fee handling (including negotiation when auto-quote is not possible)
- Role-based staff operations and auditability
- Receipts (PDF + email) from authoritative backend data

Prioritize features that affect browse → buy → pay → confirm. Avoid speculative complexity.

---

## 3. Target users

| User type | Description |
|-----------|-------------|
| **Visitor** | Unauthenticated browser of catalog and marketing pages |
| **Customer** | Registered shopper with cart, checkout, orders, receipts |
| **Admin** | Full system administration |
| **Inventory Manager** | Product/inventory operational work |
| **Sales Staff** | Customer/order/sales operational work |
| **Content Manager** | Catalog and storefront content management |

Exact org structure and contact details: **placeholder — see `PLACEHOLDERS.md`**.

---

## 4. Core features (MVP scope)

### Storefront

- Premium marketing homepage
- Dynamic categories / subcategories / products (CMS-managed hierarchy)
- Category and subcategory storefront pages (SEO-friendly URLs)
- Product catalog, search, filtering by category/subcategory
- Product detail pages and image galleries
- Shopping cart
- Customer accounts (registered checkout for MVP)
- Checkout (online Paystack + offline/cash) **only with confirmed delivery fee**
- Order history and status visibility
- Contact / support information (placeholder until client provides)
- Responsive mobile / tablet / desktop
- PWA-ready where practical (progressive enhancement, not a blocker)

### Operations

- Order management
- Payment status management (separate from order status)
- PDF receipts + transactional email receipts
- Delivery fee calculation (server-side only)
- Delivery negotiation workflow; payment blocked until fee approved
- Inventory management
- Content / category / subcategory management
- Customer management
- Staff/admin dashboard
- RBAC
- Security controls and audit logging

### Catalog direction

Initial catalog may focus primarily on **tiles**, but architecture must allow expansion into additional architectural-material categories later **without source-code changes**. Do not invent the client’s final category list — use clearly marked examples only.

---

## 5. Technology stack

| Layer | Stack |
|-------|--------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript, REST API, modular monolith |
| Database | PostgreSQL, Prisma ORM |
| Payments | Paystack (online); offline/cash orders managed by staff |
| Auth | Password hashing; JWT/session strategy with HttpOnly cookies for sensitive tokens; refresh/session protection; RBAC |
| Email | Provider-agnostic transactional email abstraction |
| Files | Practical product image upload storage for MVP (local or object storage — finalize in later stages) |

Do not over-engineer infrastructure. Prefer one deployable backend and one Next.js frontend.

---

## 6. Architecture approach

**Modular monolith** on NestJS + Next.js storefront/admin UI.

- Single PostgreSQL database
- Clear NestJS modules by domain (Auth, Products, Orders, Payments, Delivery, etc.)
- Backend is the source of truth for prices, inventory, delivery, payments, and receipts
- Frontend never holds authoritative business calculation data for delivery or payments
- No microservices for MVP
- No unnecessary message buses, CQRS layers, or speculative abstractions

---

## 7. Security principles

1. Least privilege via RBAC enforced on the API
2. Never trust the browser for payment success or delivery calculation inputs
3. Hash passwords; protect tokens/sessions; prefer HttpOnly cookies for auth tokens where applicable
4. Validate all inputs (DTOs); rate-limit sensitive endpoints
5. Secure file uploads (type + size)
6. Prisma for parameterized data access (SQL injection mitigation)
7. XSS-safe rendering practices; CSRF considerations for cookie-based auth
8. Webhook signature verification for Paystack
9. Secrets only in environment/config — never in frontend or Git
10. Audit important administrative/business actions
11. Error responses must not leak secrets or internal calculation details
12. Customer-facing APIs must not expose internal weight/surcharge/load-bracket data

Full detail: `docs/06_SECURITY/SECURITY_ARCHITECTURE.md`

---

## 8. Payment architecture (summary)

- **Online:** Paystack; initialize from backend; confirm via server-side verification and/or verified webhooks
- **Offline/cash:** Customer places order; staff manage payment recording/status
- **Payment status ≠ order status** (separate models/fields)
- Frontend proof of payment is never authoritative

Full detail: `docs/08_PAYMENTS/PAYMENT_ARCHITECTURE.md`

---

## 9. Delivery architecture (summary)

- Delivery calculation uses **authoritative product/weight/config data from PostgreSQL on the server**
- Customer may submit: `productId`, `quantity`, delivery/location fields required for a quote
- Customer must **never** submit authoritative: `weightPerCartonKg`, carton weight, total order weight, load brackets, weight surcharge, surcharge amount, or other internal calculation inputs
- Customers see: final delivery fee (when available), delivery status, and customer-safe messaging
- **If fee known & approved → normal payment. If negotiation required → contact AWOH-B; payment blocked until fee confirmed.**
- Delivery config/overrides are staff-only and auditable

Full detail: `docs/09_DELIVERY/DELIVERY_ARCHITECTURE.md`

---

## 10. User roles

| Role | Scope |
|------|--------|
| `ADMIN` | Full administration |
| `INVENTORY_MANAGER` | Inventory/product operations |
| `SALES_STAFF` | Customer/order/sales operations |
| `CONTENT_MANAGER` | Categories, products, images, storefront content |
| `CUSTOMER` | Storefront account capabilities only |

Permission matrix: `docs/02_REQUIREMENTS/RBAC_MATRIX.md`

---

## 11. UI direction (initial)

| Token | Direction |
|-------|-----------|
| Primary | Deep Midnight Navy |
| Accent | Champagne Gold |
| Background | Warm Ivory |
| Secondary | Soft Sand / muted neutrals |
| Text | Deep Graphite |

Feel: premium, architectural, elegant, modern, sophisticated, trustworthy — minimal but visually rich.

**Do not copy AO Solid Base visual identity.**

Typography system is finalized in **Stage 02**.

Full detail: `docs/07_UX_UI/DESIGN_DIRECTION.md`

---

## 12. Ten-stage development plan

Exactly these stages (no Stage 11; do not rename/split):

| Stage | Name |
|-------|------|
| 01 | Documentation & Project Foundation |
| 02 | Premium Brand, Design System & UI Foundation |
| 03 | Premium Storefront & Landing Experience |
| 04 | Products, Categories, Search, Cart & Product Experience |
| 05 | Authentication, Customers & RBAC |
| 06 | Checkout, Orders, Paystack & Offline Payments |
| 07 | Secure Delivery & Delivery Negotiation |
| 08 | Admin Dashboard, CMS & Operations |
| 09 | Security, Testing, Performance & Final UX Polish |
| 10 | Production Deployment, Launch & Final Acceptance |

Detail: `docs/00_MASTER/ROADMAP_10_STAGES.md`

---

## 13. Current stage

**Stage 03 — Premium Storefront & Landing Experience**

Premium homepage implemented at `/` in `web/`.  
Awaiting human review before Stage 04 (products, categories, search, cart).

---

## 14. Stage gate rules

A stage is complete only when its **acceptance criteria** are satisfied — not merely because files or code exist.

Each stage must document:

- Objectives, scope, requirements, dependencies
- Security considerations
- Acceptance criteria, testing expectations, risks
- Completion checklist, review status

Human project owner approval is required before starting the next stage.

Detail: `docs/00_MASTER/STAGE_GATES.md`

---

## 15. Open placeholders

Business facts not yet provided by the client must remain placeholders. See `docs/00_MASTER/PLACEHOLDERS.md`.

---

## 16. Related documents

- Roadmap: `ROADMAP_10_STAGES.md`
- Stage gates: `STAGE_GATES.md`
- Stage 01 review: `STAGE_01_REVIEW.md`
- Placeholders: `PLACEHOLDERS.md`
