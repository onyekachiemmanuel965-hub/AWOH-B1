# Domain Model (High-Level)

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Stage 01 rule:** Document only — **do not** create Prisma schema migrations or implement the database yet.

Keep the model lean. Do not add tables merely to look sophisticated.

---

## Entity map (conceptual)

```
User ──┬── Role ──── RolePermission ──── Permission
       │
       ├── RefreshToken / Session (if required)
       ├── Cart ──── CartItem ──── Product
       ├── Order ──── OrderItem ──── Product
       │      ├── Payment
       │      ├── DeliveryInfo
       │      └── Receipt
       └── AuditLog (actor)

Category ──< Subcategory ──< Product     ← required catalog hierarchy
Product ──── ProductImage
Product ──── Inventory (or inventory fields on Product — prefer one clear approach)
DeliveryConfig (system configuration)
```

---

## Catalog hierarchy (required)

```
CATEGORY
  → SUBCATEGORY
    → PRODUCTS
```

| Rule | Requirement |
|------|-------------|
| Structure | Every product belongs to a **subcategory**; every subcategory belongs to a **category** |
| Dynamic CMS | Categories and subcategories are **data-driven** — not hardcoded in source |
| Expansion | Initial catalog may focus on tiles; adding new categories later must **not** require source-code changes |
| Storefront | SEO-friendly URLs and dedicated pages for category and subcategory listings |
| Admin | Authorized CMS/admin users manage create/edit/activate/deactivate/reorder/assign |

**Example only (not the client’s final taxonomy):** `Tiles` → `Porcelain Tiles` → product SKUs. Do not treat examples as the real catalog.

---

## Entities

### User

| | |
|--|--|
| **Purpose** | Authenticated identity for customers and staff |
| **Important fields** | id, email, passwordHash, name, phone (optional), status, roleId or roles, timestamps |
| **Relationships** | Role(s); Cart; Orders; RefreshTokens/Sessions; AuditLog as actor |
| **Ownership** | Self for profile; Admin for staff lifecycle |
| **Security** | Never return passwordHash; customers cannot elevate role; enumerate carefully |

### Role

| | |
|--|--|
| **Purpose** | Named RBAC role (`ADMIN`, `INVENTORY_MANAGER`, `SALES_STAFF`, `CONTENT_MANAGER`, `CUSTOMER`) |
| **Important fields** | id, code, name, description |
| **Relationships** | Users; RolePermissions |
| **Ownership** | Admin |
| **Security** | Role changes audited |

### Permission

| | |
|--|--|
| **Purpose** | Fine-grained allow rules referenced by guards |
| **Important fields** | id, code, description |
| **Relationships** | RolePermission |
| **Ownership** | Admin / system seed |
| **Security** | Deny by default |

### RolePermission

| | |
|--|--|
| **Purpose** | Many-to-many Role ↔ Permission |
| **Important fields** | roleId, permissionId |
| **Relationships** | Role, Permission |
| **Ownership** | Admin |
| **Security** | Audited changes |

### Category

| | |
|--|--|
| **Purpose** | Top-level catalog grouping (dynamic; CMS-managed) |
| **Important fields** | id, name, slug (SEO-friendly, unique), description, image (optional), sortOrder, status (`ACTIVE` / `INACTIVE`), timestamps |
| **Relationships** | Has many Subcategories |
| **Ownership** | Content Manager / Admin |
| **Security** | Public read of active categories only; writes RBAC-protected; deactivated categories hidden from storefront |

### Subcategory

| | |
|--|--|
| **Purpose** | Second-level catalog grouping under a Category (dynamic; CMS-managed) |
| **Important fields** | id, categoryId, name, slug (SEO-friendly, unique within category or globally — choose one rule at implementation), description, image (optional), sortOrder, status (`ACTIVE` / `INACTIVE`), timestamps |
| **Relationships** | Belongs to one Category; has many Products |
| **Ownership** | Content Manager / Admin |
| **Security** | Public read of active subcategories under active parents; writes RBAC-protected |

> Prefer an explicit **Subcategory** entity (or equivalently `Category` with `parentId` where `parentId IS NULL` = category and `parentId NOT NULL` = subcategory). Either approach is acceptable if the **Category → Subcategory → Product** relationship remains clear and enforceable. Do not flatten to a single non-hierarchical tag list.

### Product

| | |
|--|--|
| **Purpose** | Sellable tile/material (or future architectural-material) item |
| **Important fields (customer-safe)** | name, description, **subcategoryId** (required), price, availability/status, specs (customer-facing), timestamps |
| **Important fields (internal)** | weight/delivery-related authoritative fields (e.g. weightPerCartonKg or equivalent) — **staff only** |
| **Relationships** | Belongs to Subcategory (and thereby Category); ProductImages; Inventory; CartItems; OrderItems |
| **Ownership** | Content/Inventory/Admin per RBAC |
| **Security** | Internal weight/delivery fields excluded from customer DTOs/APIs |

> Products are assigned to a **subcategory** (not only a free-floating category). Filtering by category means “all products under that category’s subcategories.”

### ProductImage

| | |
|--|--|
| **Purpose** | Product gallery assets |
| **Important fields** | id, productId, storageKey/url, altText, sortOrder, mimeType, sizeBytes |
| **Relationships** | Product |
| **Ownership** | Content Manager / Admin |
| **Security** | Upload type/size validation; no executable content |

### Inventory

| | |
|--|--|
| **Purpose** | Stock quantity tracking |
| **Important fields** | productId, quantityOnHand, quantityReserved (if used), updatedAt |
| **Relationships** | Product (1:1 or embedded — choose one in implementation; avoid duplication) |
| **Ownership** | Inventory Manager / Admin |
| **Security** | Stock mutations audited; race-safe updates at checkout |

> Implementation note: If inventory is a simple quantity, it may live on `Product`. Use a separate `Inventory` entity only if it clarifies reservations/history. Prefer simplicity.

### Cart

| | |
|--|--|
| **Purpose** | Pre-order working basket |
| **Important fields** | id, userId (or guest token strategy), timestamps |
| **Relationships** | User; CartItems |
| **Ownership** | Owning user |
| **Security** | Users access own cart only |

### CartItem

| | |
|--|--|
| **Purpose** | Line in cart |
| **Important fields** | cartId, productId, quantity |
| **Relationships** | Cart; Product |
| **Ownership** | Cart owner |
| **Security** | No client-supplied price/weight authority; price resolved server-side |

### Order

| | |
|--|--|
| **Purpose** | Committed purchase |
| **Important fields** | id, userId, status, customer snapshot fields, totals (subtotal, deliveryFee if set, grandTotal), timestamps, notes |
| **Relationships** | User; OrderItems; Payment; DeliveryInfo; Receipt |
| **Ownership** | Customer (own); Sales/Admin (ops) |
| **Security** | Totals computed server-side; status transitions validated |

### OrderItem

| | |
|--|--|
| **Purpose** | Frozen line items at purchase time |
| **Important fields** | orderId, productId, productName snapshot, unitPrice snapshot, quantity, lineTotal |
| **Relationships** | Order; Product (reference) |
| **Ownership** | Via Order |
| **Security** | Snapshots prevent silent historical price drift; internal weight snapshots for staff calc may be stored server-side but not exposed to customers |

### Payment

| | |
|--|--|
| **Purpose** | Payment attempt/result for an order |
| **Important fields** | id, orderId, method (`PAYSTACK` \| `OFFLINE_CASH`), status, providerReference, amount, currency, raw provider metadata (careful), timestamps |
| **Relationships** | Order |
| **Ownership** | System + Sales/Admin for offline updates |
| **Security** | Status changes server-authoritative; no secret storage in DB logs; customer cannot force SUCCESS |

### DeliveryInfo (per order)

| | |
|--|--|
| **Purpose** | Per-order delivery address/status/fee outcome |
| **Important fields** | orderId, address fields, status, finalFee (nullable), negotiationFlag/message state, staff notes (staff-only) |
| **Relationships** | Order |
| **Ownership** | Customer creates location inputs; Staff sets fee/overrides |
| **Security** | Staff notes and internal calc metadata not in customer responses |

### DeliveryConfig

| | |
|--|--|
| **Purpose** | System configuration for delivery calculation rules |
| **Important fields** | rule keys/values, brackets, surcharges, enabled flags, updatedBy, updatedAt |
| **Relationships** | None required (singleton/config rows) |
| **Ownership** | Admin (and permitted roles) |
| **Security** | Staff-only APIs; all changes audited; never sent to customer clients as authoritative rule packs |

### Receipt

| | |
|--|--|
| **Purpose** | Generated receipt artifact metadata |
| **Important fields** | id, orderId, paymentId (optional), storageKey/pdf path, issuedAt, emailSentAt |
| **Relationships** | Order; Payment |
| **Ownership** | System-generated; customer may download own |
| **Security** | Built from authoritative DB data; not client-authored totals |

### AuditLog

| | |
|--|--|
| **Purpose** | Who did what, when, on which entity |
| **Important fields** | id, actorUserId, action, entityType, entityId, metadata (JSON), ip (optional), createdAt |
| **Relationships** | User (actor) |
| **Ownership** | System write; Admin/authorized read |
| **Security** | Never log passwords, tokens, Paystack secrets, or full payment card data (Paystack should not yield PAN to us) |

### RefreshToken / Session (if required)

| | |
|--|--|
| **Purpose** | Persist refresh/session validity and revocation |
| **Important fields** | id, userId, tokenHash, expiresAt, revokedAt, userAgent/ip optional |
| **Relationships** | User |
| **Ownership** | Owning user / system |
| **Security** | Store hashes not raw tokens where applicable; rotate; revoke on logout/password change |

---

## Customer vs internal field boundary (products / delivery)

| Field class | Customer API | Staff API |
|-------------|--------------|-----------|
| Name, description, price, images, public specs | Yes | Yes |
| Inventory availability summary | Yes (safe) | Yes (detailed) |
| weightPerCartonKg / carton weight / load brackets / surcharge rules | **No** | Yes (authorized) |
| Final delivery fee on order | Yes when available | Yes |
| Delivery negotiation message | Yes | Yes |
| Staff negotiation notes / calc breakdown | **No** | Yes (authorized) |

---

## What we intentionally skip for MVP

- Separate microservice databases
- Full event store
- Multi-tenant tables
- Complex CMS page-builder schema beyond needed content records
- Storing raw Paystack secret keys in DB

---

## Next step (not Stage 01)

Prisma schema + migrations begin when persistence is required (typically Stages 04–06), aligned to this model.
