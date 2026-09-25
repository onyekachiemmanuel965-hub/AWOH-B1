# Security Architecture

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Principle:** Security-critical functionality must not be “simplified” into an unsafe design — even under deadline pressure.

---

## 1. Goals

- Protect customer and staff accounts
- Protect payment integrity
- Protect internal delivery economics and operational data
- Enforce RBAC on the backend
- Provide auditability for sensitive actions
- Avoid secret leakage via Git, frontend bundles, or error messages

---

## 2. Authentication security

| Control | Requirement |
|---------|-------------|
| Password hashing | Strong adaptive hashing (e.g. Argon2id or bcrypt with appropriate cost) |
| Credential storage | Store password hashes only |
| Session/token strategy | JWT and/or server sessions appropriate to NestJS + Next.js; prefer **HttpOnly**, **Secure**, **SameSite** cookies for sensitive auth tokens |
| Refresh protection | Refresh tokens rotated/revocable; store hashed refresh tokens if persisted |
| Logout | Invalidate server-side session/refresh where applicable |
| Transport | HTTPS in production |

Exact cookie vs bearer details finalized in Stage 05; these principles are fixed.

---

## 3. CSRF considerations

If auth uses cookies for API calls from the browser:

- Use SameSite appropriately
- Use CSRF tokens or equivalent double-submit / framework patterns for state-changing requests
- Separate concerns for webhook endpoints (no browser CSRF model; use signature verification instead)

If a pure Bearer-header model is chosen for APIs, document CSRF impact and still protect cookie-based Next.js flows.

---

## 4. Authorization (RBAC)

- Deny by default
- NestJS guards check permissions per route/handler
- UI route hiding is **not** authorization
- Customers blocked from `/admin/**` APIs and internal fields
- Role/permission changes audited

See `docs/02_REQUIREMENTS/RBAC_MATRIX.md`.

---

## 5. Input validation

- DTO validation on all mutating and sensitive read endpoints
- Strict types for IDs, quantities, enums
- Reject unknown fields that attempt to inject internal delivery calculation inputs on customer endpoints
- Normalize/validate emails, phones, addresses sensibly

---

## 6. Rate limiting & API protection

- Rate-limit login, register, password reset, checkout, payment init, receipt email, uploads
- Consider IP + account based limits
- Protect webhook endpoint with signature verification (not only rate limits)

---

## 7. Secure file uploads

| Control | Requirement |
|---------|-------------|
| Allowed types | JPG, PNG, WEBP |
| Size limits | Configurable max size (document default at implementation; enforce server-side) |
| Validation | Check Content-Type **and** file signature where practical |
| Storage | Store outside executable web roots; random object keys |
| Authz | Only permitted roles upload product images |

---

## 8. Data access & injection

- Prisma parameterized queries — no raw string-concat SQL for user input
- Least-privilege DB credentials in production where feasible

---

## 9. XSS protection

- React/Next default escaping; avoid `dangerouslySetInnerHTML` for untrusted content
- Sanitize any rich text CMS fields if introduced
- Security headers (CSP baseline in Stage 09/10)

---

## 10. Payment security

- Paystack **secret key** and **webhook secret** only on server
- Initialize transactions on server
- Verify transactions on server (API verify and/or verified webhooks)
- Idempotent handling of webhook retries
- Frontend “payment success” UI is informational only until backend confirms
- Offline payment SUCCESS only via authorized staff action (audited)

Detail: `docs/08_PAYMENTS/PAYMENT_ARCHITECTURE.md`

---

## 11. Delivery data boundary (critical)

Customer/browser must **never** be trusted with or allowed to submit authoritative:

- `weightPerCartonKg`
- carton weight
- total order weight
- load brackets
- weight surcharge / surcharge amount
- other internal calculation inputs

Customer may submit: `productId`, `quantity`, delivery/location fields required for quote.

Server loads authoritative product/config from PostgreSQL and calculates.

Customers see only: final delivery fee (when available), delivery status, customer-safe message.

Detail: `docs/09_DELIVERY/DELIVERY_ARCHITECTURE.md`

---

## 12. Secrets & environment

- `.env` not committed; provide `.env.example` with empty placeholders in later stages
- No secrets in frontend env unless explicitly public (e.g. Paystack public key if required)
- Rotate keys on suspected compromise (ops runbook in Stage 10)

---

## 13. Audit logging

Audit at minimum:

- Delivery configuration changes
- Delivery overrides
- Payment-related administrative actions
- Role changes / user management
- Product and inventory changes
- Important order changes

Capture: actor, action, timestamp, entity/resource, metadata.  
**Do not log:** passwords, tokens, Paystack secrets, webhook signing secrets.

---

## 14. Error handling

- Generic client errors for auth failures where appropriate
- No stack traces, SQL, or internal rule dumps to clients
- Detailed server logs for operators

---

## 15. Customer / admin data separation

- Separate DTO serializers for customer vs staff
- Admin UI under protected routes + API guards
- Prevent IDOR: customers can only access own cart/orders/receipts

---

## 16. Privacy baseline

- Collect minimal PII needed for order/delivery/contact
- Restrict staff access by role
- Do not invent compliance certifications in docs; implement reasonable MVP privacy practices and refine if client requires specific regimes

---

## 17. Stage mapping

| Security work | Stage |
|---------------|-------|
| Documented architecture | 01 (this doc) |
| Auth + RBAC implementation | 05 |
| Payment verification | 06 |
| Delivery boundary enforcement | 07 |
| Admin surface hardening | 08 |
| Broad testing, headers, pen-test style checks | 09 |
| Production secrets & HTTPS hardening | 10 |
