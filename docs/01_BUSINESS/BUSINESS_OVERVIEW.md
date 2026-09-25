# Business Overview

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Document:** Business context for implementation planning

---

## 1. Business summary

AWOH-B THE GREAT TILES VENTURE is a tiles and architectural materials business. The digital platform must present a **premium** brand experience and support real commerce: browsing, ordering, paying (online or offline), and operational fulfillment by staff.

This is not a throwaway prototype. The MVP must be production-ready, simple to operate, and secure.

---

## 2. Business goals

1. Convert visitors into paying customers through a premium catalog experience.
2. Accept **Paystack** online payments and **offline/cash** orders.
3. Keep internal delivery economics private while still quoting or negotiating delivery fairly.
4. Give staff practical tools for inventory, orders, payments, content, and customers.
5. Deliver under a short deadline without sacrificing security-critical controls.

---

## 3. What success looks like (MVP)

- Customers can discover products via **Category → Subcategory → Product**, add to cart, checkout (registered account), and pay only when delivery totals are confirmed.
- Customers receive confirmation and can access a receipt derived from backend order/payment data.
- Staff can manage dynamic catalog taxonomy, inventory, orders, payment status, and delivery negotiation cases.
- New product categories can be added via CMS without source-code changes (initial focus may be tiles; expandable later).
- Internal weight/surcharge logic never leaks to the customer frontend.
- Unauthorized users cannot reach admin APIs.

---

## 4. Target users

| Segment | Needs |
|---------|--------|
| Homeowners / designers / contractors (customers) | Browse premium materials, trust pricing, order easily, understand delivery/payment status |
| Sales staff | Manage customer orders, assist offline payments, communicate delivery negotiation |
| Inventory managers | Keep stock and product availability accurate |
| Content managers | Keep catalog imagery and category content current |
| Admins | Oversee users, roles, configuration, audit, reports |

---

## 5. Business constraints

| Constraint | Implication |
|------------|-------------|
| Short delivery deadline | Modular monolith; no microservices; no speculative features |
| Sensitive delivery economics | Server-side calculation only; negotiation when needed; **no payment on unconfirmed delivery total** |
| Payment integrity | Server-side Paystack verification; payment status separate from order status |
| Dynamic catalog | Category → Subcategory → Product; CMS-managed; not hardcoded |
| Incomplete client data | Placeholders for address, phones, rates, keys — see `docs/00_MASTER/PLACEHOLDERS.md` |

---

## 6. Out of business scope for MVP (unless later authorized)

- Multi-vendor marketplace
- Complex loyalty/rewards programs
- Microservices or event-driven overhaul
- Guest checkout (deferred; registered MVP)
- Hard-coded category lists in source
- Fabricating real-world business contact or banking details
- Copying AO Solid Base brand identity

---

## 7. Brand positioning (business-facing)

Premium architectural / interior materials retailer: elegant, trustworthy, modern. Visual system details live in `docs/07_UX_UI/DESIGN_DIRECTION.md` and are refined in Stage 02.
