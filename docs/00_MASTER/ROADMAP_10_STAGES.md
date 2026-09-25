# Ten-Stage Roadmap

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Rule:** Exactly these ten stages. Do **not** create Stage 11. Do **not** rename or split stages.

---

## STAGE 01 — Documentation & Project Foundation

**Status:** Documentation complete — awaiting human review

Establish project charter, docs structure, architecture approach, domain model (documented only), API module map, security/payment/delivery/RBAC baselines, stage gates, and Stage 01 review report.

**Does not include:** application code, migrations, integrations, UI implementation.

---

## STAGE 02 — Premium Brand, Design System & UI Foundation

Establish AWOH-B visual identity (not AO Solid Base), typography, color tokens, spacing, component primitives, layout shells, accessibility baselines, and shared UI foundations for storefront and admin.

**Depends on:** Stage 01 approval.

---

## STAGE 03 — Premium Storefront & Landing Experience

Implement premium marketing homepage and core landing experience: hero, brand introduction, category highlights, featured products placeholders/wiring as available, contact/footer shells, responsive layouts.

**Depends on:** Stage 02 design system.

---

## STAGE 04 — Products, Categories, Search, Cart & Product Experience

Implement catalog browsing, categories/subcategories, product detail + galleries, search/filtering, and cart experience backed by real product data APIs as available for this stage.

**Depends on:** Stages 02–03 foundations; product domain APIs as scoped for this stage.

---

## STAGE 05 — Authentication, Customers & RBAC

Implement secure authentication, customer accounts, staff login, password hashing, session/token strategy (HttpOnly cookies where applicable), and backend RBAC enforcement.

**Depends on:** Domain model and security architecture from Stage 01; UI foundations from Stage 02.

---

## STAGE 06 — Checkout, Orders, Paystack & Offline Payments

Implement checkout, order creation, Paystack online payment with server-side verification, offline/cash orders, payment vs order status separation, and receipt generation/email hooks as applicable.

**Depends on:** Auth/RBAC (Stage 05), cart/catalog (Stage 04).

---

## STAGE 07 — Secure Delivery & Delivery Negotiation

Implement server-authoritative delivery calculation, negotiation workflow when fees cannot be auto-finalized, customer-safe messaging only, staff delivery management, and audit logging for delivery actions.

**Depends on:** Orders (Stage 06); delivery architecture docs (Stage 01).

---

## STAGE 08 — Admin Dashboard, CMS & Operations

Implement practical admin/ops dashboard: products, categories, inventory, orders, payments oversight, delivery management, users/roles (per RBAC), content management, reports (lightweight), audit log viewing.

**Depends on:** Auth/RBAC and core commerce domains (Stages 05–07).

---

## STAGE 09 — Security, Testing, Performance & Final UX Polish

**Status:** Implementation complete — awaiting human review

Harden security, complete critical test coverage, performance pass, accessibility polish, UX refinements, PWA-ready checks where practical, and pre-launch verification against acceptance criteria.

**Depends on:** Feature-complete MVP from Stages 03–08.

---

## STAGE 10 — Production Deployment, Launch & Final Acceptance

Production environment configuration, secrets management, deployment, monitoring basics, launch checklist, and final client acceptance.

**Depends on:** Stage 09 completion and human go-ahead.

---

## Cross-cutting rules

| Rule | Description |
|------|-------------|
| Simple + premium + secure + fast | Prefer modular monolith; avoid microservices |
| Security not deferred unsafely | Auth, payment verification, delivery authority, RBAC remain non-negotiable |
| Stage stop | Do not start the next stage until the current stage gate is approved |
| No invented business data | Use placeholders for unknown client facts |

---

## Stage assignment of major capabilities

| Capability | Primary stage |
|------------|---------------|
| Documentation foundation | 01 |
| Design system / brand | 02 |
| Landing / marketing storefront shell | 03 |
| Catalog, search, product pages, cart | 04 |
| Auth, customers, RBAC | 05 |
| Checkout, orders, Paystack, offline pay, receipts core | 06 |
| Delivery calc + negotiation | 07 |
| Admin CMS / operations | 08 |
| Hardening, testing, polish | 09 |
| Deploy & launch | 10 |

Some supporting backend pieces may be introduced when a stage requires them; do not pull entire later-stage products forward without authorization.
