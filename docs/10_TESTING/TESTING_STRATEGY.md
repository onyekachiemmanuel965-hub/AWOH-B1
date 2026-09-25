# Testing Strategy (Outline)

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Note:** This is a planning outline. Broad execution is concentrated in **Stage 09**, with tests added as features land in Stages 04–08.

---

## 1. Goals

- Prove security-critical paths (auth, RBAC, payments, delivery boundary)
- Prevent regressions in checkout/order/payment state machines
- Keep MVP velocity — prefer high-value tests over vanity coverage %

---

## 2. Test layers

| Layer | Focus | When |
|-------|-------|------|
| Unit | Pure calculators (delivery), validators, mappers | As modules appear |
| Integration | NestJS modules + Prisma (test DB) | Stages 05–08 |
| API/e2e | Critical HTTP flows | Stages 06–09 |
| UI checks | Storefront responsive/premium flows | Stages 03–09 |
| Manual exploratory | UX polish, negotiation copy, admin practicality | Stage 09 |

---

## 3. Critical test themes

### Auth & RBAC

- Customers denied admin routes
- Role matrix spot-checks for each staff role
- Session/cookie logout/revocation behavior

### Payments

- Paystack verify success/failure paths
- Webhook signature failure rejected
- Idempotent duplicate webhook
- Frontend cannot force SUCCESS
- Offline payment requires authorized role + audit

### Delivery

- Customer quote ignores spoofed weight fields
- Customer product payloads omit internal fields
- Negotiation status returns safe message only
- Fee override writes audit log

### Orders & receipts

- Totals from server data
- Receipt PDF matches DB totals
- IDOR: user A cannot fetch user B receipt

### Uploads

- Reject disallowed MIME/extensions
- Reject oversize files

---

## 4. Stage expectations (summary)

| Stage | Testing expectation |
|-------|---------------------|
| 01 | Documentation consistency review |
| 02–03 | Visual/responsive manual checks |
| 04–05 | Component + API tests as features appear |
| 06–07 | Mandatory payment & delivery security tests |
| 08 | Admin RBAC path tests |
| 09 | Full regression + performance + a11y pass |
| 10 | Smoke tests on production-like env |

---

## 5. Non-goals for early stages

- 100% coverage mandates
- Load testing at hyperscale
- Automating every admin click path before Stage 08 stabilizes
