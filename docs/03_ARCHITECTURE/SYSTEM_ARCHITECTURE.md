# System Architecture

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Approach:** Simple modular monolith — premium, secure, fast to implement

---

## 1. High-level view

```
┌─────────────────────────────────────────────────────────────┐
│                     Clients (Browser / PWA)                 │
│         Next.js App Router — Storefront + Admin UI          │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS / REST JSON
┌───────────────────────────▼─────────────────────────────────┐
│                 NestJS Modular Monolith API                 │
│  Auth │ Users │ Products │ Cart │ Orders │ Payments │ ...   │
└───────┬───────────────┬───────────────────┬─────────────────┘
        │               │                   │
        ▼               ▼                   ▼
  PostgreSQL        File/Image          External services
  (Prisma)          storage (MVP)       Paystack, Email
```

---

## 2. Architectural principles

1. **One backend, one database** for MVP
2. **Backend is source of truth** for products, prices, inventory, orders, payments, delivery, receipts
3. **Frontend is untrusted** for authoritative business calculations and payment confirmation
4. **Modules by domain** inside NestJS — not separate deployable services
5. **Prefer boring, proven patterns** over speculative architecture
6. **Security-critical paths stay server-side**

---

## 3. Frontend responsibilities (Next.js)

- Premium storefront rendering (RSC + client components as appropriate)
- Admin/ops UI for authorized staff
- Collect user input (productId, quantity, address fields, payment method selection)
- Initiate client interactions with Paystack **only after backend initialization**
- Never store Paystack secret keys
- Never accept or trust client-supplied authoritative delivery weight/surcharge inputs
- Responsive UX across device sizes

Admin and storefront may share one Next.js app with route groups, or a clear internal `/admin` area — decide in Stage 02/03 for speed. Prefer one app unless split clearly reduces risk.

---

## 4. Backend responsibilities (NestJS)

- Authentication/authorization (RBAC)
- Domain validation and DTO validation
- Persistence via Prisma/PostgreSQL
- Paystack initialization + verification + webhook handling
- Delivery calculation and negotiation state
- Receipt generation orchestration
- Transactional email dispatch via provider adapter
- Audit logging
- Secure file upload validation

---

## 5. Data ownership

| Data | Owner | Customer visibility |
|------|-------|---------------------|
| Categories / subcategories | Backend DB (CMS-managed) | Active public taxonomy only |
| Product merchandising fields | Backend DB | Public/customer-safe fields only |
| Internal weight / delivery inputs | Backend DB | **Never** to customers |
| Cart | Backend (authenticated registered customer for MVP) | Own cart |
| Orders / payments / receipts | Backend | Own records; no mutable totals |
| Delivery config | Backend | Staff only |
| Audit logs | Backend | Staff (authorized) only |

---

## 6. Technology stack (consolidated)

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | Next.js App Router, TypeScript, Tailwind | Accessible primitives chosen in Stage 02 |
| Backend | NestJS REST, TypeScript | Modular monolith |
| Data | PostgreSQL + Prisma | Migrations in later stages |
| Payments | Paystack + offline/cash | Server verification mandatory |
| Auth | Hashed passwords; JWT/session; HttpOnly cookies where applicable; RBAC | Cookie vs bearer finalized Stage 05 |
| Email | Provider-agnostic adapter | Provider `PLACEHOLDER` |
| Files | Local or S3-compatible via thin interface | JPG/PNG/WEBP; size limits |

Preserve this stack unless a blocking incompatibility appears. No Stage 01 app packages required.

---

## 7. Explicitly rejected for MVP

- Microservices
- Event sourcing / CQRS as a default
- Multiple databases per domain
- Hard-coded catalog category lists
- Guest checkout (deferred; registered MVP)
- Paying with unconfirmed delivery totals
- Kubernetes-heavy setups unless already required by hosting choice
- Trusting browser math for delivery or payment success

---

## 8. Cross-cutting concerns

| Concern | Approach |
|---------|----------|
| Auth | NestJS guards + hashed passwords + HttpOnly cookies where applicable |
| Validation | DTO/class-validator (or equivalent) on all mutating endpoints |
| Errors | Safe client messages; detailed logs server-side |
| Config | Environment variables; no secrets in repo |
| Observability | Structured logs; expand in Stage 09/10 |

---

## 9. Related docs

- Flows: `ORDER_LIFECYCLE.md`, `CUSTOMER_FLOW.md`, `ADMIN_FLOW.md`
- Domain: `docs/04_DATABASE/DOMAIN_MODEL.md`
- API: `docs/05_API/API_MODULES.md`
- Delivery/payment gate: `docs/09_DELIVERY/DELIVERY_ARCHITECTURE.md`, `docs/08_PAYMENTS/PAYMENT_ARCHITECTURE.md`
