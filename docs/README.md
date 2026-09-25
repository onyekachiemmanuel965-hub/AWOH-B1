# Documentation Index

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Current stage:** Stage 01 — Documentation & Project Foundation (correction pass)  
**Stage gate:** Awaiting human review (`00_MASTER/STAGE_01_REVIEW.md`)

Lightweight set — duplicates consolidated where safe.

## Structure

```
docs/
├── 00_MASTER/          Project master, roadmap, stage gates, review, placeholders
├── 01_BUSINESS/        Business context and target users
├── 02_REQUIREMENTS/    Functional + non-functional requirements, RBAC matrix
├── 03_ARCHITECTURE/    System architecture (incl. stack), order/customer/admin flows
├── 04_DATABASE/        High-level domain model (no migrations in Stage 01)
├── 05_API/             Backend modules and high-level API responsibilities
├── 06_SECURITY/        Security architecture
├── 07_UX_UI/           Premium design direction (typography finalized in Stage 02)
├── 08_PAYMENTS/        Paystack + offline payment architecture
├── 09_DELIVERY/        Secure delivery calculation and negotiation
├── 10_TESTING/         Testing strategy outline
└── 11_DEPLOYMENT/      Deployment principles (implementation in Stage 10)
```

## Consolidation notes (correction pass)

| Change | Reason |
|--------|--------|
| Merged `TECHNOLOGY_STACK.md` into `SYSTEM_ARCHITECTURE.md` | Duplicate of stack already in master + architecture |
| Merged `NON_FUNCTIONAL_REQUIREMENTS.md` into `FUNCTIONAL_REQUIREMENTS.md` | Single requirements reference for implementers |

Kept separate: security, payments, delivery, domain, API, flows — each has distinct implementation value.

## Reading order (recommended)

1. `00_MASTER/PROJECT_MASTER.md`
2. `00_MASTER/ROADMAP_10_STAGES.md`
3. `00_MASTER/STAGE_GATES.md`
4. `00_MASTER/PLACEHOLDERS.md` (blocking vs configuration)
5. `01_BUSINESS/BUSINESS_OVERVIEW.md`
6. `02_REQUIREMENTS/FUNCTIONAL_REQUIREMENTS.md`
7. `02_REQUIREMENTS/RBAC_MATRIX.md`
8. `03_ARCHITECTURE/SYSTEM_ARCHITECTURE.md`
9. `04_DATABASE/DOMAIN_MODEL.md` (Category → Subcategory → Product)
10. `09_DELIVERY/DELIVERY_ARCHITECTURE.md`
11. `08_PAYMENTS/PAYMENT_ARCHITECTURE.md`
12. `06_SECURITY/SECURITY_ARCHITECTURE.md`
13. `05_API/API_MODULES.md`
14. `00_MASTER/STAGE_01_REVIEW.md`

## Stage boundary reminder

Stage 01 is **documentation only**. Do not implement storefront, auth, checkout, payments, delivery logic, admin UI, migrations, or deployment until the corresponding stage is authorized.
