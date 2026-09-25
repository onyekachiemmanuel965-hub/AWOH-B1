# Admin & Staff Flows

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Principle:** Practical, fast dashboard — not a cluttered analytics toy.

Primary implementation stage: **08** (depends on Auth/RBAC and commerce domains).

---

## 1. Admin login

1. Staff opens admin entry route  
2. Authenticates via secure staff login  
3. Backend issues protected session/tokens (HttpOnly cookies where applicable)  
4. RBAC loads permissions; UI shows only permitted areas (API still enforces)

---

## 2. Dashboard

Lightweight overview for authorized roles, for example:

- Open orders count
- Pending offline payments
- Orders needing delivery negotiation
- Low inventory signals (simple)

Avoid overcrowding the first screen with decorative widgets.

---

## 3. Product management

- Create/update products (merchandising fields)
- Set status/availability
- Attach images (validated type/size)
- Assign category/subcategory  
Content Manager + Admin primary; Inventory Manager operational updates per RBAC.

---

## 4. Category management

- Create/edit/activate/deactivate categories
- Create/edit/activate/deactivate subcategories under categories
- Reorder categories and subcategories
- Optional category/subcategory images
- SEO-friendly slugs for storefront pages
- Assign products to subcategories (Category → Subcategory → Product)

---

## 5. Inventory management

- Adjust quantities
- Reflect availability rules
- Audit significant stock changes

---

## 6. Order management

- List/filter orders
- View order detail (line items, customer-safe + staff operational fields per role)
- Update order status within allowed transitions
- Coordinate with payment and delivery states (without merging concepts)

---

## 7. Payment oversight

- View payment status per order
- Confirm offline/cash payments (audited)
- Investigate failed/cancelled online payments
- Never expose secret keys in UI

---

## 8. Delivery management

- View orders needing negotiation
- Set/override delivery fee (audited)
- Maintain delivery configuration (Admin / permitted roles)
- Customers never see internal config screens

---

## 9. User management

- Admin manages staff users and customer records as needed
- Disable/lock accounts per policy
- No password viewing; reset flows only

---

## 10. Role management

- Admin assigns roles/permissions
- Role changes audited
- Customers cannot self-elevate

---

## 11. Content management

- Storefront content blocks used by landing/catalog
- Product imagery and category content
- Placeholders for missing brand assets until provided

---

## 12. Reports

- Simple operational reports (orders, payments summary, inventory signals)
- Export optional later; keep MVP narrow

---

## 13. Audit logs

- Search/filter important actions
- Show actor, action, time, entity, metadata
- Never display secrets, raw tokens, or password fields

---

## Role → flow emphasis

| Role | Primary flows |
|------|----------------|
| ADMIN | All |
| INVENTORY_MANAGER | Inventory, product ops, limited order read |
| SALES_STAFF | Orders, payments (offline), delivery negotiation ops, customers |
| CONTENT_MANAGER | Categories, products/images, CMS content |

---

## Security reminders for admin UX

- Admin UI is not a security boundary
- CSRF/session protections apply
- Destructive actions should confirm
- Internal delivery fields only on authorized views
