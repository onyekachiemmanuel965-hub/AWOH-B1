# AWOH-B THE GREAT TILES VENTURE

Premium e-commerce platform for architectural tiles and materials.

## Current status

**Stage 03 — Premium Storefront & Landing Experience** (awaiting human review)

Run the storefront:

```bash
cd web
npm run dev
```

- Homepage: [http://localhost:3000/](http://localhost:3000/)
- Design system: [http://localhost:3000/design-system](http://localhost:3000/design-system)

Stage 03 review: [`docs/00_MASTER/STAGE_03_REVIEW.md`](./docs/00_MASTER/STAGE_03_REVIEW.md)

## Documentation

All project foundation documents live under [`docs/`](./docs/README.md).

| Area | Path |
|------|------|
| Master / roadmap / stage gates | [`docs/00_MASTER/`](./docs/00_MASTER/) |
| Business overview | [`docs/01_BUSINESS/`](./docs/01_BUSINESS/) |
| Requirements & RBAC | [`docs/02_REQUIREMENTS/`](./docs/02_REQUIREMENTS/) |
| Architecture & flows | [`docs/03_ARCHITECTURE/`](./docs/03_ARCHITECTURE/) |
| Domain model | [`docs/04_DATABASE/`](./docs/04_DATABASE/) |
| API modules | [`docs/05_API/`](./docs/05_API/) |
| Security | [`docs/06_SECURITY/`](./docs/06_SECURITY/) |
| UX / UI direction | [`docs/07_UX_UI/`](./docs/07_UX_UI/) |
| Payments | [`docs/08_PAYMENTS/`](./docs/08_PAYMENTS/) |
| Delivery | [`docs/09_DELIVERY/`](./docs/09_DELIVERY/) |
| Testing | [`docs/10_TESTING/`](./docs/10_TESTING/) |
| Deployment notes | [`docs/11_DEPLOYMENT/`](./docs/11_DEPLOYMENT/) |

Start here: [`docs/00_MASTER/PROJECT_MASTER.md`](./docs/00_MASTER/PROJECT_MASTER.md)

Stage reviews: [`STAGE_02_REVIEW.md`](./docs/00_MASTER/STAGE_02_REVIEW.md) · [`STAGE_03_REVIEW.md`](./docs/00_MASTER/STAGE_03_REVIEW.md)

Design system: [`docs/07_UX_UI/DESIGN_SYSTEM.md`](./docs/07_UX_UI/DESIGN_SYSTEM.md)

## Technology stack (planned)

| Layer | Choice |
|-------|--------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | NestJS modular monolith, TypeScript, REST |
| Database | PostgreSQL + Prisma |
| Payments | Paystack (online) + offline/cash |
| Auth | Secure JWT/session with HttpOnly cookies, RBAC |

## Non-negotiable rules

1. **Customer/browser is never authoritative** for delivery weight, surcharges, fee calculation inputs, or monetary totals.
2. **Payment success is never trusted from the frontend**; server-side verification is required.
3. **No payment on an unconfirmed delivery total** — if delivery needs negotiation, customer must contact AWOH-B THE GREAT TILES VENTURE first.
4. **Catalog is dynamic**: Category → Subcategory → Product (CMS-managed, not hardcoded).
5. **RBAC is enforced on the backend**; UI hiding is not security.
6. **No fabricated business contact, pricing, or credential data** — use placeholders until the client provides values.
7. **Exactly 10 development stages** — see roadmap. Do not invent Stage 11.

## Placeholders

Unknown client-specific values are listed in [`docs/00_MASTER/PLACEHOLDERS.md`](./docs/00_MASTER/PLACEHOLDERS.md).

## License / ownership

Client project — ownership and licensing terms to be confirmed with the project owner.
