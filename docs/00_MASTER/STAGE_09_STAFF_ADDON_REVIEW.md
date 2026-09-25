# Stage 09 Staff Add-on Review — Admin Staff Management + Role-Aware Workspace

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Add-on:** Post–Stage 09 ADMIN Staff / Role Management + role-aware employee workspace  
**Review status:** `PENDING_REVIEW`  
**Stage 10:** NOT STARTED

---

## 1. Overview

Employers need to promote registered employees into staff roles and give each employee a clear answer to: **“What is my role, and what can I access?”**

This add-on carries over that **workflow concept** only — not AO Solid Base UI, branding, or catalog data. AWOH-B keeps its design system and Stage 05/08 RBAC as the security authority.

---

## 2. Workflow

1. Employee registers → **CUSTOMER** (unchanged)  
2. ADMIN opens `/admin/staff`  
3. ADMIN assigns role / activates or deactivates  
4. Employee signs in → `/admin`  
5. Dashboard shows **My role** + **Your access**  
6. Navigation shows only modules for that role  
7. Backend guards still enforce the same boundaries  

---

## 3. Roles

Unchanged: `ADMIN`, `SALES_STAFF`, `INVENTORY_MANAGER`, `CONTENT_MANAGER`, `CUSTOMER`

---

## 4. Actual verified access matrix

Derived from Stage 08 controller `@Roles` (not the prompt example table where they conflict).

| Module | ADMIN | SALES | INVENTORY | CONTENT | CUSTOMER |
|--------|:-----:|:-----:|:---------:|:-------:|:--------:|
| View Staff / change role / status | YES | NO | NO | NO | NO |
| View own access (`/admin/me/access`) | YES | YES | YES | YES | NO |
| Dashboard | YES | YES | YES | YES | NO |
| Orders | YES | YES | YES | NO | NO |
| Delivery (order delivery ops) | YES | YES | NO* | NO | NO |
| Products | YES | YES | YES | YES | NO |
| Categories / Subcategories | YES | NO | NO | YES | NO |
| Inventory | YES | NO | YES | NO | NO |
| Audit | YES | NO | NO | NO | NO |

\*Inventory managers can open **Orders** (Stage 08 `orders.read`) but delivery confirm/override remains ADMIN/SALES on the backend.

Navigation dedupes Delivery onto the Orders href (one nav item).

---

## 5. API changes

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/admin/staff` | + `access` / `accessLabels` / `roleLabel` |
| PATCH | `/api/v1/admin/staff/:id/role` | unchanged rules |
| PATCH | `/api/v1/admin/staff/:id/status` | audit action names updated |
| GET | `/api/v1/admin/me/access` | **new** — current staff role + modules |

No password hashes / refresh tokens in responses.

---

## 6. Database changes

**None.** Reuses `User.status` and `User.roleId`.

---

## 7. Audit events

| Action | When |
|--------|------|
| `staff.role_changed` | Role assignment |
| `staff.user_deactivated` | Deactivate |
| `staff.user_reactivated` | Reactivate |

Visible on existing `/admin/audit`.

---

## 8. Security

- ADMIN-only staff management (RolesGuard + `users.manage`)  
- Backend authorization mandatory  
- CUSTOMER isolated from admin APIs  
- Last active ADMIN cannot be demoted/deactivated  
- Self role/status change forbidden  
- Refresh sessions revoked on role change and deactivation  
- RolesGuard loads role/status from DB on each request  

---

## 9. UX

- `/admin/staff` — Employee, Email, Role, Status, Access, Actions (View / Change role / Activate)  
- `/admin/dashboard` — Welcome + My role + Your access chips  
- Admin shell nav driven by `GET /api/v1/admin/me/access`  

---

## 10. Files changed

### API
- `admin-access.ts`, `admin-access.controller.ts`, `admin-access.spec.ts`
- `admin-staff.service.ts`, `admin-staff.controller.ts`, `admin-staff.service.spec.ts`
- `admin.module.ts`

### Web
- `admin-shell.tsx`, `dashboard/page.tsx`, `staff/page.tsx`, `lib/admin-api.ts`

### Docs
- `docs/00_MASTER/STAGE_09_STAFF_ADDON_REVIEW.md` (this file)

---

## 11. Testing / builds

```text
Previous Stage 09 baseline:     148 passed / 23 suites
Previous staff add-on baseline: 167 passed / 24 suites
New result:                     175 passed / 25 suites
Failures:                       0
API build:                      PASS
Web build:                      PASS
SMOKE_RBAC_OVERALL:             PASS
me/access ADMIN:                200 (Administrator + modules)
me/access SALES:                200
me/access CUSTOMER:             403
```

---

## 12. PostgreSQL

```text
PostgreSQL runtime verification: NOT EXECUTED
```

---

## 13. Known limitations

- No email invitations / password reset  
- Access JWT `role` claim may lag until refresh; API is DB-authoritative  
- Delivery is not a separate page — linked to Orders for ops  
- Soft-disable only (`DISABLED`)  

---

## 14. ADMIN LOGIN ROUTING FIX

### Observed problem

Successful ADMIN login did not land in `/admin`. The user stayed on the customer account path.

### Actual root cause

`web/src/app/login/login-client.tsx` always defaulted post-login navigation to `/account`:

```text
const next = params.get("next") || "/account"
```

AUTH and RBAC were fine — the login API returned `role: ADMIN` and cookies were set. Only the **frontend redirect target** ignored staff roles.

### Fix implemented

- Added `resolvePostLoginPath(role, nextParam)`:
  - Staff (ADMIN / SALES / INVENTORY / CONTENT) → `/admin` by default
  - CUSTOMER → `/welcome` by default (updated in customer UX add-on; was `/account`)
  - Honors safe explicit `?next=` (e.g. `/checkout`, `/admin/staff`)
  - Never sends CUSTOMER to `/admin` via this helper
- Login submit uses the authenticated user's role from the login response
- Admin shell still waits on `loading` before treating the user as unauthenticated (no setTimeout)

### Files changed

- `web/src/lib/post-login-path.ts`
- `web/src/app/login/login-client.tsx`
- `web/src/app/admin/admin-shell.tsx` (loading gate clarity)
- `api/src/auth/post-login-destination.ts` + `.spec.ts` (contract tests)

### Verification

- API tests: **184 passed**, 184 total (`TEST:0`)
- API build: **PASS** (`API_BUILD:0`)
- Web build: **PASS** (`WEB_BUILD:0`)
- Contract: ADMIN / staff roles → `/admin`; CUSTOMER → `/welcome` (see §16); CUSTOMER never defaulted to `/admin`
- Auth/RBAC not redesigned; backend guards unchanged

---

## 16. POST-STAGE-09 CUSTOMER UX ADD-ON

### Dedicated public pages

| Route | Purpose |
|-------|---------|
| `/` | Home (unchanged landing) |
| `/products` | Existing catalog browse (preserved) |
| `/categories` | **New** category discovery index (API-backed) |
| `/categories/[slug]`… | Existing dynamic catalog routes (preserved) |
| `/about` | **New** about page |
| `/contact` | **New** contact page (placeholders + presentational form) |
| `/cart` | Existing cart (preserved) |
| `/login` / `/register` | Existing auth pages (redirect targets updated) |
| `/welcome` | **New** customer post-login welcome (noindex) |
| `/account` | Remains available via header — **not** the default post-login destination |

Header and footer now use real routes (no `/#about` / `/#contact` anchors for primary nav).

### Contact page

- Premium layout with hero, placeholder contact fields (from existing project placeholders), enquiry form UI
- **No email-delivery backend** — form does not pretend to send; documents pending infrastructure

### About page

- Uses existing AWOH-B brand copy (`whyPoints` / site metadata) — no invented business claims

### Categories page

- Lists categories from `GET /api/v1/categories`
- Links into existing `/categories/[slug]` routes

### Customer login welcome flow

```text
CUSTOMER login / register (auto-auth)
  → /welcome
  → brief welcome message + Continue button
  → auto home after ~3.2s (timer cleaned on unmount)
  → /
```

- Immediate **Continue to AWOH-B** → `/`
- `/account` still reachable from header **My Account**
- Explicit `?next=` (e.g. `/checkout`, `/account`) still honored

### Staff / admin login

Unchanged destination:

```text
ADMIN / SALES_STAFF / INVENTORY_MANAGER / CONTENT_MANAGER → /admin
```

Staff hitting `/welcome` are redirected to `/admin`.

### Account

`/account` preserved. Login no longer auto-redirects there by default.

### Registration

Register still auto-authenticates (existing auth). Post-register uses the same `resolvePostLoginPath` → welcome → home for CUSTOMER.

### Tests

- API: **188 passed**, 188 total (27 suites) after this add-on
- Updated `post-login-destination.spec.ts` (CUSTOMER → `/welcome`)
- Added `public-nav.contract.spec.ts` (dedicated routes + login defaults)
- API build: PASS · Web build: PASS (routes include `/about`, `/contact`, `/categories`, `/welcome`)

### Known limitations

- Contact form submission / email delivery **not implemented**
- Business phone/email/address remain `[PLACEHOLDER]` until client provides them
- Welcome auto-redirect duration is fixed (~3.2s); button continues immediately

---

## 17. Final status

```text
STAGE 09 STAFF ADD-ON + CUSTOMER UX ADD-ON — READY FOR HUMAN REVIEW
```

**STAGE 10 HAS NOT BEEN STARTED.**
