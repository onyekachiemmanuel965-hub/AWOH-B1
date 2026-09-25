# Stage 05 Review — Authentication, Customers & RBAC

## Stage

Stage 05 — Authentication, Customers & RBAC

## Status

`READY FOR HUMAN REVIEW`

## Authentication Architecture

- **Access token:** short-lived JWT (`JWT_ACCESS_TTL_SEC`, default 900s) stored in HttpOnly cookie `awoh_access`
- **Refresh token:** opaque random token; only SHA-256 hash stored in `RefreshToken`; cookie `awoh_refresh`
- **Rotation:** refresh revokes the previous refresh row and issues a new pair
- **Logout:** revokes refresh token server-side and clears both cookies
- **Cookies:** `HttpOnly`, `Path=/`, `SameSite` from `COOKIE_SAMESITE` (default `lax`), `Secure` when `NODE_ENV=production` or `COOKIE_SECURE=true`
- **No tokens in localStorage/sessionStorage**
- **CSRF strategy:** SameSite cookies + `OriginGuard` validating `Origin`/`Referer` against `CORS_ORIGIN` on state-changing requests. Limitations: non-browser clients without Origin are allowed (API/tooling); multi-instance production should keep explicit trusted origins and HTTPS
- **CORS:** explicit origin list with `credentials: true` — never `*` with credentials

## User Model

- `User` — email (unique, normalized), passwordHash, first/last name, optional phone, `UserStatus` ACTIVE/DISABLED, `roleId`
- `Role` — ADMIN, INVENTORY_MANAGER, SALES_STAFF, CONTENT_MANAGER, CUSTOMER
- `Permission` — seeded capability codes for future stages
- `RolePermission` — many-to-many
- `RefreshToken` — hashed token, expiry, revocation

## Registration

- `POST /api/v1/auth/register`
- Always assigns **CUSTOMER** role server-side
- Client `role` field rejected by ValidationPipe (`forbidNonWhitelisted`)
- Email trimmed + lowercased; uniqueness enforced
- Generic failure message on duplicate email (enumeration-resistant)

## Authorization

- `JwtAuthGuard` — reads access JWT from cookie (or Bearer for tooling)
- `RolesGuard` + `@Roles` / `@RequirePermissions`
- ADMIN bypasses permission checks
- Probe endpoints:
  - `GET /api/v1/auth/rbac/customer-check` — requires `account.read`
  - `GET /api/v1/auth/rbac/staff-check` — staff roles only (CUSTOMER → 403)

## Frontend

- `/login` — email/password, show/hide password, errors, redirect
- `/register` — name, email, password + confirm
- `/account` — profile + logout; unauthenticated → `/login?next=/account`
- Header: Sign in / Account based on session via `/auth/me` (credentials include)

## Security

| Topic | Implementation |
|-------|----------------|
| Password hashing | bcrypt cost 12 |
| Password policy | min 8, letter+number, block common weak list; public errors generic |
| Tokens | HttpOnly cookies; refresh hashed at rest |
| Cookie security | env-driven Secure/SameSite |
| CORS | explicit trusted origins + credentials |
| CSRF | SameSite + OriginGuard |
| Rate limiting | in-process limiter on register/login/refresh (MVP; not multi-instance) |
| Validation | class-validator DTOs |
| Errors | generic auth failures; no hashes/tokens in responses |

## Database

- Migration: `20260923181224_auth_rbac_stage05`
- Applied successfully on local SQLite
- Production target remains PostgreSQL (compatible schema)

## Tests

- `auth.service.spec.ts` + `catalog.service.spec.ts`: **24 passed**
- API build: **PASS**
- Web build: **PASS** (routes include `/login`, `/register`, `/account`)
- Live smoke: register (role escalation rejected 400), CUSTOMER assigned, `/me`, staff-check 403, customer-check 200, refresh, logout→401, demo login, cookies `awoh_access` + `awoh_refresh`

## Development Seed

- Roles + permissions always seeded
- CUSTOMER user if `DEV_CUSTOMER_EMAIL` + `DEV_CUSTOMER_PASSWORD`
- ADMIN only if `SEED_DEV_ADMIN=true` + admin email/password and **not** `NODE_ENV=production`
- Local `.env` uses `@example.local` demo credentials only

## Cart Relationship

Stage 04 `localStorage` cart (`awoh-b-cart-v1`, productId+quantity) remains unchanged. No server cart sync in Stage 05. Stage 06 can attach cart lines to the authenticated user at checkout.

## Deferred Items

- Password reset / forgot password
- Email verification
- Change-password endpoint (not required for this stage; deferred)
- Full audit log dashboard
- Server-side cart
- Redis-backed rate limiting / session store

## Risks

- In-process rate limiter resets on restart and does not share across instances
- SQLite case sensitivity differs from PostgreSQL (emails normalized to lowercase)
- Dev JWT secret must be rotated before any shared environment
- Cross-site production (separate API subdomain) may need `SameSite=None; Secure` + continued Origin checks

## Stage 06 Dependencies

- Authenticated CUSTOMER identity for registered checkout
- Session cookies / `/auth/me` for checkout UX
- RBAC foundation for later staff order/payment ops (Stage 08)
- Local cart still supplies productId+quantity until checkout creates authoritative order lines

## Out of Scope

Confirmed not implemented:

- Paystack / payments / webhooks / receipts
- Checkout / orders
- Delivery fees / negotiation / weight exposure
- Admin / CMS / inventory / sales UIs
- Guest checkout

## Acceptance Criteria

| ID | Result |
|----|--------|
| AC-05-001 | PASS |
| AC-05-002 | PASS |
| AC-05-003 | PASS |
| AC-05-004 | PASS |
| AC-05-005 | PASS |
| AC-05-006 | PASS |
| AC-05-007 | PASS |
| AC-05-008 | PASS |
| AC-05-009 | PASS |
| AC-05-010 | PASS |
| AC-05-011 | PASS |
| AC-05-012 | PASS |
| AC-05-013 | PASS |
| AC-05-014 | PASS |
| AC-05-015 | PASS |
| AC-05-016 | PASS |
| AC-05-017 | PASS |
| AC-05-018 | PASS |
| AC-05-019 | PASS |
| AC-05-020 | PASS |
| AC-05-021 | PASS |
| AC-05-022 | PASS |
| AC-05-023 | PASS |
| AC-05-024 | PASS |
| AC-05-025 | PASS |
| AC-05-026 | PASS |
| AC-05-027 | PASS |
| AC-05-028 | PASS |
| AC-05-029 | PASS |
| AC-05-030 | PASS |
| AC-05-031 | PASS |
| AC-05-032 | PASS |
| AC-05-033 | PASS |
| AC-05-034 | PASS |
| AC-05-035 | PASS |
| AC-05-036 | PASS |
| AC-05-037 | PASS |
| AC-05-038 | PASS |
| AC-05-039 | PASS |
| AC-05-040 | PASS |
| AC-05-041 | PASS |
| AC-05-042 | PASS |
| AC-05-043 | PASS |
| AC-05-044 | PASS |
| AC-05-045 | PASS |
| AC-05-046 | PASS |

## Human Approval

`PENDING HUMAN REVIEW`
