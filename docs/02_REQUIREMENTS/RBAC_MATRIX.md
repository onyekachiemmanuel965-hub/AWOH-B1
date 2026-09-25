# RBAC Matrix

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Rule:** Backend enforcement is mandatory. Hiding UI routes is not sufficient.

---

## Roles

| Role code | Name | Description |
|-----------|------|-------------|
| `ADMIN` | Admin | Full system administration |
| `INVENTORY_MANAGER` | Inventory Manager | Inventory/product operational responsibilities |
| `SALES_STAFF` | Sales Staff | Customer/order/sales responsibilities |
| `CONTENT_MANAGER` | Content Manager | Categories, products, images, storefront content |
| `CUSTOMER` | Customer | Customer-facing capabilities only |

Staff roles must never be grantable via customer self-service.

---

## Permission legend

| Symbol | Meaning |
|--------|---------|
| **F** | Full (create/read/update/delete or equivalent operational control) |
| **R** | Read |
| **U** | Update / limited operational actions |
| **N** | None |
| **Own** | Own resources only (e.g. own orders) |

Exact permission keys will be implemented as a finite permission set in Stage 05; this matrix is the authoritative intent.

---

## Capability matrix

| Capability | ADMIN | INVENTORY_MANAGER | SALES_STAFF | CONTENT_MANAGER | CUSTOMER |
|------------|-------|-------------------|-------------|-----------------|----------|
| View public catalog | F | F | F | F | F |
| Manage categories & subcategories | F | R | R | F | N |
| Manage products (catalog fields) | F | U* | R | F | N |
| Assign products to subcategory | F | U* | R | F | N |
| Manage product images | F | R / U* | R | F | N |
| Manage internal delivery product fields (e.g. weight) | F | U* | N | N | N |
| Manage inventory quantities | F | F | R | R | N |
| Manage storefront CMS content | F | N | N | F | N |
| Cart / checkout (self) | N** | N** | N** | N** | F |
| View own orders | F | F | F | N | Own |
| Manage all orders | F | R | F | N | N |
| Payment oversight / offline payment updates | F | N | U | N | N |
| Initiate own Paystack payment | N** | N** | N** | N** | Own |
| Delivery configuration | F | R / U* | R | N | N |
| Delivery fee override / negotiation notes | F | N | U | N | N |
| View customer-safe delivery fee/status | F | F | F | R | Own |
| View internal delivery calculation details | F | R / U* | R*** | N | N |
| Customer user management | F | N | R / U | N | N |
| Staff user management | F | N | N | N | N |
| Role / permission management | F | N | N | N | N |
| Reports (lightweight) | F | R | R | R | N |
| Audit log access | F | R (limited) | R (limited) | R (limited) | N |
| System configuration | F | N | N | N | N |

\* Inventory Manager product edits focus on operational/inventory-related fields; Admin retains full catalog control. Content Manager owns merchandising content but **not** internal weight/delivery economics.  
\** Staff may also be customers in a separate customer account if needed later; default MVP treats staff and customer sessions as separate concerns — do not grant admin powers through customer role.  
\*** Sales Staff may see delivery operational fields required to negotiate/communicate fees, but not necessarily edit delivery configuration; refine in Stage 07/08 without exposing internals to customers.

---

## Customer prohibitions (hard rules)

Customers **MUST NOT**:

- Access admin/ops APIs
- Read or write `weightPerCartonKg`, load brackets, surcharge rules, or authoritative delivery calculation inputs
- Submit authoritative delivery calculation internals
- Mutate payment status
- Mutate receipt totals
- Assign roles or elevate privileges
- View audit logs or other customers’ PII beyond their own account data

---

## Admin capabilities (intent)

- User management, role management
- Product, category, inventory, order, payment oversight
- Delivery configuration
- Reports, dashboard, CMS
- Audit logs, system configuration

---

## Inventory Manager (intent)

- Inventory and product operational responsibilities
- Read/update inventory and related product operational data
- No role administration; limited/no CMS-only content ownership unless also assigned Content Manager

---

## Sales Staff (intent)

- Customer/order/sales responsibilities
- Order management assistance
- Offline payment process support
- Delivery negotiation operational updates per policy
- No system configuration or role management

---

## Content Manager (intent)

- Categories, products, product images
- Relevant storefront content
- No payment control, no role admin, no internal delivery economics control

---

## Enforcement notes

1. Prefer permission checks on NestJS guards/interceptors per route/handler.
2. Deny by default.
3. Log role/permission changes in AuditLog.
4. Separate customer storefront session context from staff admin context in UX (Stage 05/08); always enforce on API regardless of UI.
