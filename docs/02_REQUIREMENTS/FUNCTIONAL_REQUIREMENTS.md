# Functional & Non-Functional Requirements

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Scope:** MVP requirements for planning. Implementation is staged (see roadmap).

Requirement IDs are stable references for later stages and testing.

---

## FR-STORE — Storefront & catalog

| ID | Requirement | Primary stage |
|----|-------------|---------------|
| FR-STORE-01 | Premium marketing homepage communicating brand identity | 03 |
| FR-STORE-02 | Brand introduction and storefront sections as designed | 03 |
| FR-STORE-03 | Browse **Category → Subcategory → Product** hierarchy | 04 |
| FR-STORE-04 | Product listing with search and filtering (incl. by category and subcategory) | 04 |
| FR-STORE-05 | Product detail page with specifications and availability | 04 |
| FR-STORE-06 | Product image gallery (JPG/PNG/WEBP) | 04 |
| FR-STORE-07 | Featured products on landing (data-driven when available) | 03–04 |
| FR-STORE-08 | Contact / support information from configuration (placeholders until provided) | 03 |
| FR-STORE-09 | Responsive layouts for mobile, tablet, laptop, desktop, large desktop | 02–03 |
| FR-STORE-10 | PWA-ready enhancements where practical | 09 |
| FR-STORE-11 | Category-specific storefront pages with SEO-friendly URLs | 04 |
| FR-STORE-12 | Subcategory-specific storefront pages with SEO-friendly URLs | 04 |
| FR-STORE-13 | Category/subcategory images where appropriate | 04 / 08 |

---

## FR-CAT — Dynamic categories & subcategories

Catalog is **data-driven**. Do not hard-code the category list in source. Adding a new category must not require code changes.

| ID | Requirement | Primary stage |
|----|-------------|---------------|
| FR-CAT-01 | Create / edit categories | 08 |
| FR-CAT-02 | Activate / deactivate categories | 08 |
| FR-CAT-03 | Create / edit subcategories under a category | 08 |
| FR-CAT-04 | Activate / deactivate subcategories | 08 |
| FR-CAT-05 | Assign products to a subcategory (and thereby a category) | 04 / 08 |
| FR-CAT-06 | Reorder categories | 08 |
| FR-CAT-07 | Reorder subcategories | 08 |
| FR-CAT-08 | Initial catalog may focus on tiles; architecture allows future architectural-material categories without code changes | 04 / 08 |

**Example only (not client final list):** Category `Tiles` → Subcategory `Porcelain Tiles` → products.

---

## FR-CART — Cart

| ID | Requirement | Primary stage |
|----|-------------|---------------|
| FR-CART-01 | Add/update/remove cart items by productId + quantity | 04 |
| FR-CART-02 | Cart review before checkout | 04 |
| FR-CART-03 | Cart prices validated against backend product data at checkout | 06 |

---

## FR-AUTH — Accounts & access

| ID | Requirement | Primary stage |
|----|-------------|---------------|
| FR-AUTH-01 | Customer registration and login | 05 |
| FR-AUTH-02 | Staff login for admin/ops roles | 05 |
| FR-AUTH-03 | Secure password hashing | 05 |
| FR-AUTH-04 | Session/token strategy with HttpOnly cookies where applicable | 05 |
| FR-AUTH-05 | Refresh/session protection | 05 |
| FR-AUTH-06 | Backend RBAC enforcement on all protected APIs | 05 |
| FR-AUTH-07 | Customers cannot access administrative APIs or internal operational data | 05 |
| FR-AUTH-08 | MVP checkout is **registered** (login/register); guest checkout deferred | 05 / 06 |

---

## FR-ORDER — Orders & checkout

| ID | Requirement | Primary stage |
|----|-------------|---------------|
| FR-ORDER-01 | Checkout collects required customer/order information | 06 |
| FR-ORDER-02 | Customer selects online (Paystack) or offline/cash payment **only when delivery fee is confirmed** | 06 / 07 |
| FR-ORDER-03 | Backend validates order before creation; never trust client monetary totals | 06 |
| FR-ORDER-04 | Order created with line items from authoritative product data | 06 |
| FR-ORDER-05 | Order status managed separately from payment status | 06 |
| FR-ORDER-06 | Customer can view order history and status | 06 |
| FR-ORDER-07 | Staff can manage orders per RBAC | 08 |

---

## FR-PAY — Payments

| ID | Requirement | Primary stage |
|----|-------------|---------------|
| FR-PAY-01 | Online payment via Paystack | 06 |
| FR-PAY-02 | Payment confirmation validated server-side (not trusted from frontend) | 06 |
| FR-PAY-03 | Webhook verification for Paystack events | 06 |
| FR-PAY-04 | Clear payment states (e.g. PENDING, PROCESSING, SUCCESS, FAILED, CANCELLED, REFUNDED where applicable) | 06 |
| FR-PAY-05 | Offline/cash order placement supported | 06 |
| FR-PAY-06 | Staff manage offline payment process and payment status | 06 / 08 |
| FR-PAY-07 | Payment oversight for authorized roles | 08 |
| FR-PAY-08 | Block payment completion when delivery fee is unconfirmed / needs negotiation | 06 / 07 |

---

## FR-RCPT — Receipts

| ID | Requirement | Primary stage |
|----|-------------|---------------|
| FR-RCPT-01 | PDF receipt download from authoritative backend data | 06 |
| FR-RCPT-02 | Transactional email receipt support | 06 |
| FR-RCPT-03 | Customers cannot modify receipt totals from the frontend | 06 |

---

## FR-DEL — Delivery

| ID | Requirement | Primary stage |
|----|-------------|---------------|
| FR-DEL-01 | Delivery fee calculated server-side from authoritative DB data | 07 |
| FR-DEL-02 | Customer submits only productId, quantity, and required location/delivery fields — never authoritative weight/surcharge inputs | 07 |
| FR-DEL-03 | Customer sees only final fee (when available), delivery status, and safe messaging | 07 |
| FR-DEL-04 | When fee cannot be auto-finalized, customer is instructed to contact AWOH-B THE GREAT TILES VENTURE to negotiate delivery | 07 |
| FR-DEL-05 | Staff manage delivery config/overrides per RBAC | 07 / 08 |
| FR-DEL-06 | Delivery calculation/override/config actions are auditable | 07 |
| FR-DEL-07 | If fee known & approved → normal checkout/payment; if negotiation required → no payment on incomplete delivery total | 06 / 07 |

---

## FR-PROD — Products & inventory

| ID | Requirement | Primary stage |
|----|-------------|---------------|
| FR-PROD-01 | Products support name, description, subcategory (→ category), price, availability, inventory, images, status, tile/material specs | 04 / 08 |
| FR-PROD-02 | Image upload validation: type (JPG/PNG/WEBP) and configurable size limits | 04 / 08 |
| FR-PROD-03 | Inventory management for authorized roles | 08 |
| FR-PROD-04 | Internal product fields used for delivery (e.g. weight data) are staff-only | 07 / 08 |

---

## FR-CMS — Content & admin ops

| ID | Requirement | Primary stage |
|----|-------------|---------------|
| FR-CMS-01 | Full category & subcategory CMS (see FR-CAT) | 08 |
| FR-CMS-02 | Product and image management | 08 |
| FR-CMS-03 | Relevant storefront content management | 08 |
| FR-CMS-04 | Customer management for authorized roles | 08 |
| FR-CMS-05 | Practical staff/admin dashboard | 08 |
| FR-CMS-06 | Lightweight reports | 08 |
| FR-CMS-07 | User and role management (Admin) | 08 |
| FR-CMS-08 | Audit log viewing for authorized roles | 08 |

---

## FR-SEC — Security & audit (functional)

| ID | Requirement | Primary stage |
|----|-------------|---------------|
| FR-SEC-01 | Audit logging for important admin/business actions | 05–08 |
| FR-SEC-02 | Audit entries capture who, what, when, entity, relevant metadata (no secrets) | ongoing |
| FR-SEC-03 | Rate limiting and API protection on sensitive endpoints | 05 / 09 |
| FR-SEC-04 | Secure error handling without sensitive leakage | ongoing |

---

## Non-functional requirements

### NFR-PERF — Performance

| ID | Requirement |
|----|-------------|
| NFR-PERF-01 | Storefront pages should feel responsive on typical mobile networks; optimize images and avoid unnecessary client payloads |
| NFR-PERF-02 | Admin dashboards prioritize practical speed over decorative complexity |
| NFR-PERF-03 | Delivery and payment calculations run on the server; do not push heavy authoritative datasets to the browser |

### NFR-SCALE — Scale (MVP realism)

| ID | Requirement |
|----|-------------|
| NFR-SCALE-01 | Architecture targets a single-business MVP load, not speculative hyperscale |
| NFR-SCALE-02 | Modular monolith must remain separable by module later if needed — without building microservices now |

### NFR-REL — Reliability

| ID | Requirement |
|----|-------------|
| NFR-REL-01 | Payment webhook handling must be idempotent where practical |
| NFR-REL-02 | Order/payment state transitions must be consistent and recoverable from failed client redirects |
| NFR-REL-03 | Receipt generation uses persisted authoritative order/payment data |

### NFR-SEC — Security

| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | All security requirements in `docs/06_SECURITY/SECURITY_ARCHITECTURE.md` apply |
| NFR-SEC-02 | Secrets never committed to Git or embedded in frontend bundles |
| NFR-SEC-03 | Internal delivery economics never exposed on customer APIs/UI |
| NFR-SEC-04 | RBAC enforced server-side |

### NFR-A11Y / UX / MAINT / OPS

| ID | Requirement |
|----|-------------|
| NFR-A11Y-01 | Prefer accessible components; keyboard operable primary flows |
| NFR-A11Y-02 | Meaningful contrast aligned with premium palette (validated in Stages 02 / 09) |
| NFR-UX-01 | Premium architectural feel per design direction |
| NFR-UX-02 | Mobile is first-class, not an afterthought |
| NFR-UX-03 | Subtle motion only; avoid noisy UI |
| NFR-MAINT-01 | Prefer clear NestJS modules and Next.js App Router conventions |
| NFR-MAINT-02 | Avoid unnecessary abstractions and dependencies |
| NFR-MAINT-03 | Email and storage integrations behind thin adapters |
| NFR-OPS-01 | Environment-based configuration |
| NFR-OPS-02 | Audit trail for sensitive operational actions |
| NFR-OPS-03 | Deployment approach documented for Stage 10; keep MVP hosting simple |

---

## Explicit non-goals (MVP)

- Microservices
- Hard-coded category lists in source
- Customer-authoritative delivery math or monetary totals
- Paying with incomplete/unconfirmed delivery totals
- Trusting frontend payment success alone
- Guest checkout (deferred; registered MVP)
- Fabricated client business details
- Copying AO Solid Base identity
