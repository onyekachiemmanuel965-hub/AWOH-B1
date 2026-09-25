# Placeholders & Open Questions

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Rule:** Do **not** invent missing business facts. Mark unknowns clearly until the client provides them.

---

## BLOCKING QUESTIONS

These need an owner decision (or explicit acceptance of the documented recommendation) before the named stage is implemented safely. They do **not** block Stage 02 design-system work.

| ID | Question | Impact if unresolved | Current documentation stance |
|----|----------|----------------------|------------------------------|
| BQ-01 | Confirm MVP **registered checkout** (vs requiring guest checkout) | Changes Stage 05/06 auth and order-access design | **Recommended:** registered checkout; guest deferred |
| BQ-02 | Confirm **delivery fee must be approved before any customer payment** | Changes Stage 06/07 payment gating | **Required rule** in delivery/payment docs — reject only if owner overrides in writing |
| BQ-03 | Pickup-only / delivery-only / both fulfillment modes? | Affects checkout fields and order statuses in Stages 06–07 | Assume delivery quoting is in scope; pickup optional until confirmed |

No fabricated answers. If the owner accepts BQ-01/BQ-02 recommendations as written, treat them as resolved for implementation.

---

## CONFIGURATION / PLACEHOLDER QUESTIONS

These can use clearly marked placeholders without blocking development of earlier stages. Replace before production launch (Stage 10 checklist).

### Business identity & contact

| Item | Status | Notes |
|------|--------|-------|
| Legal business name (if different from brand) | `PLACEHOLDER` | Confirm with client |
| Trading name | AWOH-B THE GREAT TILES VENTURE | Confirmed as project brand |
| Physical address | `PLACEHOLDER` | Contact/footer/receipts |
| Phone numbers | `PLACEHOLDER` | Support / sales |
| Public email addresses | `PLACEHOLDER` | Support / orders |
| Business registration numbers | `PLACEHOLDER` | If required on receipts |
| Social media accounts | `PLACEHOLDER` | Optional for MVP |
| Support / negotiation contact channel | `PLACEHOLDER` | Shown when delivery needs negotiation |

### Branding assets

| Item | Status |
|------|--------|
| Official logo files | `PLACEHOLDER` |
| Brand photography / product hero imagery | `PLACEHOLDER` |
| Final typography confirmation | Stage 02 |

### Commerce configuration

| Item | Status | Notes |
|------|--------|-------|
| Currency | `PLACEHOLDER` | Confirm before Paystack go-live (often NGN — do not assume in production) |
| Tax/VAT handling | `PLACEHOLDER` | Confirm if prices include tax; default display: “prices as listed” until confirmed |
| Actual product catalog / prices | `PLACEHOLDER` | Seed data later; taxonomy is dynamic |
| Final category/subcategory names | `PLACEHOLDER` | CMS-managed; examples in docs are not final |
| Inventory starting quantities | `PLACEHOLDER` | |
| Exact delivery rates / brackets | `PLACEHOLDER` | Configured later; never exposed as internals to customers |
| Offline payment instructions | `PLACEHOLDER` | Bank details must not be fabricated |

### Payments (Paystack)

| Item | Status | Storage rule |
|------|--------|--------------|
| Paystack public key | `PLACEHOLDER` | Env; public key may be used by frontend if required |
| Paystack secret key | `PLACEHOLDER` | Server env only — never frontend / never Git |
| Webhook secret | `PLACEHOLDER` | Server env only |
| Callback / webhook URLs | `PLACEHOLDER` | Environment-specific |

### Email / storage / hosting

| Item | Status |
|------|--------|
| Transactional email provider choice | `PLACEHOLDER` (abstraction required) |
| SMTP / API credentials | `PLACEHOLDER` — server env only |
| From address / display name | `PLACEHOLDER` |
| Image storage approach | Decide in implementation; keep MVP-practical |
| Production host / domain | `PLACEHOLDER` |
| Database connection strings | `PLACEHOLDER` — server env only |
| App secrets / JWT signing keys | `PLACEHOLDER` — server env only |

---

## Guidance for implementers

1. Use named config keys (e.g. `BUSINESS_SUPPORT_PHONE`) rather than hardcoding invented values.
2. UI may show “Contact us” with placeholder copy until real values exist.
3. Receipts and emails must pull business identity from configuration, not from hardcoded false data.
4. Never commit `.env` files with real secrets.
5. Adding categories/subcategories is a CMS/data operation — not a code change.
