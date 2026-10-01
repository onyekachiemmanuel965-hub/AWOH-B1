# Stage 09 — AWOH-B CMS Role Workspaces Review

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Document:** CMS role workspaces + role-aware admin navigation  
**Status:** `PENDING_HUMAN_REVIEW`

---

## 1. Objective

Make the existing AWOH-B admin/CMS operate with approved role-specific workspaces (AO Solid Base–style **business structure**), without rebuilding authentication, RBAC, delivery, or the design system.

---

## 2. Existing architecture reviewed

- Stage 05: JWT + HttpOnly cookies, RolesGuard, Role/Permission seed matrix
- Stage 07: Delivery fee negotiation / override (staff-only internals)
- Stage 08: Admin catalog, orders, staff, audit controllers
- Stage 09: Delivery quote customer confirmation + payment gate
- Existing `admin-access.ts` module map + `/api/v1/admin/me/access`
- Existing AdminShell nav driven by backend `nav` payload

---

## 3. Role structure

| Role | Workspace |
|---|---|
| ADMIN | Full CMS |
| SALES_STAFF | Dashboard, Orders, Delivery, Payments |
| INVENTORY_MANAGER | Dashboard, Products, Inventory |
| CONTENT_MANAGER | Dashboard, Products, Categories, Subcategories, CMS |
| CUSTOMER | No `/admin` |

---

## 4. Permission structure

Reused existing permission codes (no duplicate ACL):

- `products.read` / `products.manage`
- `inventory.read` / `inventory.manage`
- `orders.read` / `orders.manage`
- `payments.read`
- `delivery.read` / `delivery.manage`
- `content.manage`
- `users.read` / `users.manage`
- `audit.read`
- `account.read`

Seed change: removed `delivery.read` from **INVENTORY_MANAGER** so inventory is not treated as a delivery operator. Re-seed or upsert permissions via `prisma db seed` in local/dev to refresh RolePermission links.

---

## 5–9. Workspaces

### ADMIN
Nav: Dashboard, Products, Categories, Subcategories, Inventory, Orders, Delivery, Staff, Payments, Audit, CMS

### SALES_STAFF
Nav: Dashboard, Orders, Delivery, Payments  
Can set delivery fees / offline confirm via existing order APIs.  
Cannot: Staff, Categories, Inventory, CMS, product pricing.

### INVENTORY_MANAGER
Nav: Dashboard, Products, Inventory  
Stock/availability only. **No** authoritative weight UI. **No** delivery/payments/staff/CMS nav.

### CONTENT_MANAGER
Nav: Dashboard, Products, Categories, Subcategories, CMS  
Catalog content/images/descriptions. No delivery/payments/staff/inventory.

### CUSTOMER
`/admin` denied (shell redirect + `/admin/me/access` 403). Storefront only.

---

## 10. Staff management

Unchanged Admin-only `/admin/staff` flow: register as CUSTOMER → Admin assigns role → refresh sessions revoked on role change (existing).

---

## 11. Delivery workflow

Preserved Stage 07/09:

Address → Sales quote → Customer sees fee → Customer confirms → Pay Now  

Delivery CMS page (`/admin/delivery`) lists delivery orders; fee entry remains on order detail via existing override API.

---

## 12. Payment permissions

Admin + Sales Staff: Payments workspace lists `AWAITING_OFFLINE_PAYMENT`; confirm uses existing offline confirm endpoint (`orders.manage`).

---

## 13. CMS permissions

CMS hub (`/admin/cms`) links to Products / Categories / Subcategories for Content Manager + Admin. Uses existing catalog APIs (`content.manage` / `products.manage`).

---

## 14. Product / catalog

Taxonomy unchanged: Category → Subcategory / tile size → Product. No weight management CMS feature.

---

## 15. Customer privacy

Authoritative product weights are **not** exposed through the customer experience and are **not** part of the customer-facing CMS.

Delivery fees are managed through the Sales Staff/Admin delivery workflow.

Customer APIs continue to omit weight / distance / rate / internal delivery JSON.

---

## 16. Audit

Admin-only (`audit.read`). Role changes and operational events continue via existing AuditService.

---

## 17. Frontend route behavior

- `/admin` → role workspace landing (My Role / allowed / restricted)
- AdminShell loads `/api/v1/admin/me/access` and renders `nav`
- Client path guard redirects unauthorized deep links to `/admin`
- Customer staff-role check redirects to `/`

**Backend remains authoritative** — API 403 still applies if URL/API is forced.

---

## 18. Backend authorization

RolesGuard + `@Roles` / `@RequirePermissions` unchanged as source of truth. Access DTO is informational.

New helpers: `restrictedModulesForRole`, `canAccessAdminPath`.

---

## 19. Database changes

No new migration. Seed RolePermission matrix updated for Inventory Manager (remove `delivery.read`). Apply with seed in non-production environments.

---

## 20. Tests

- Updated `admin-access.spec.ts` (role matrix, path guard, Delivery href)
- Updated `admin-staff.service.spec.ts` (My Access allowed/restricted/permissions)
- Updated `admin.rbac.spec.ts` inventory permission list
- Existing RBAC / privacy / delivery / payment suites remain the regression baseline

---

## 21–22. Builds / limitations

See final report in agent completion message for exact test/build numbers.

**Known limitations**

- Inventory Manager still has `orders.read` in seed (API list/get) while Orders is removed from nav — intentional “restricted operationally” compromise with existing Stage 08 matrix.
- Sales Staff still has `products.read` for API read; Products removed from nav.
- CMS hub is a content gateway, not a separate CMS engine.
- No Stage 10 / deploy.

**PostgreSQL:** Permission seed upserts remain portable; no SQLite-specific schema change.

---

## Final status

**READY FOR HUMAN REVIEW** (API tests 208/208, API build OK, Web build OK; no Stage 10).
