# Delivery Architecture

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Critical rule:** Delivery and product-weight information is **internal business data**. The customer-facing frontend must never be trusted with authoritative delivery calculation data.

---

## 1. Objectives

- Calculate delivery fees on the **server** using PostgreSQL authoritative data
- Support cases where delivery **cannot** be auto-finalized → negotiation workflow
- Expose only customer-safe fee/status/messaging to customers
- Allow staff to configure rules and override fees with **audit logging**

---

## 2. Trust boundary

### Customer may submit

- `productId`
- `quantity`
- Delivery/location information required for a quote (address fields, city, etc. as defined later)

### Customer must NOT submit (authoritative)

- `weightPerCartonKg`
- Carton weight
- Total order weight
- Load brackets
- Weight surcharge
- Surcharge amount
- Other authoritative delivery calculation inputs

If such fields appear on customer requests, **reject or ignore** them; never treat them as authoritative.

### Backend must

1. Load products and internal weight/delivery fields from PostgreSQL  
2. Load DeliveryConfig from PostgreSQL  
3. Compute fee or decide negotiation is required  
4. Persist delivery outcome on the order  
5. Return customer-safe response only  

---

## 3. Customer-visible outputs

Customers may see:

- **Final delivery fee** when available
- **Delivery status** (customer-safe labels)
- **Customer-facing message** (e.g. contact to negotiate)

Customers must not see:

- Internal formulas, brackets, weight tables
- Staff negotiation notes (unless explicitly sanitized into a customer message)
- Raw surcharge breakdowns that reveal internal economics (MVP default: hide)

Exact wording can be refined in UI stages. Intent:

> The customer needs to contact AWOH-B THE GREAT TILES VENTURE to discuss/negotiate the delivery fee.

Contact channels remain `PLACEHOLDER` until provided.

---

## 4. Delivery + payment MVP principle (mandatory)

### If the delivery fee is known and approved

Customer may proceed through the normal checkout/payment flow (online Paystack or offline/cash). Payable totals include the server-authoritative delivery fee.

### If the delivery fee requires negotiation

1. Customer must be clearly informed that they need to **contact AWOH-B THE GREAT TILES VENTURE** to discuss/agree the delivery fee.
2. The system must **NOT** allow the customer to unknowingly complete a payment using an incomplete or unconfirmed delivery total.
3. Backend must refuse payment initialization / offline “ready to pay” completion while delivery is `NEEDS_NEGOTIATION` (or equivalent unconfirmed state).
4. After staff set/approve the fee (audited), customer may resume normal payment with the confirmed total.

### Authoritative fields (backend only)

Never trust customer-submitted monetary totals. Backend remains authoritative for:

- Product price
- Order totals
- Delivery fee
- Payment status
- Order status

Do not expose internal weight calculations or surcharge formulas to customers.

---

## 5. Negotiation workflow

```
Checkout/quote requested
→ Server attempts calculation
→ If finalize OK: store finalFee + status QUOTE_AVAILABLE (or equivalent)
   → Customer may proceed to payment with confirmed grand total
→ If not: status NEEDS_NEGOTIATION + customer contact/negotiate message
   → Payment init blocked until fee approved
→ Customer contacts business (configured channels — PLACEHOLDER until provided)
→ Staff sets fee / resolves negotiation (RBAC, audited)
→ Customer sees updated final fee/status
→ Customer may proceed to payment
```

Draft/inquiry orders may be persisted to support negotiation follow-up, but they must not become payable until delivery fee is confirmed.

---

## 6. Staff capabilities

| Action | Typical roles | Audited |
|--------|---------------|---------|
| View internal calc inputs | Admin, Inventory Manager, Sales (as needed) | N/A (read) |
| Edit DeliveryConfig | Admin (+ limited if ever delegated) | Yes |
| Override / set delivery fee on order | Admin, Sales Staff | Yes |
| Add staff notes | Sales Staff, Admin | Yes (no secrets) |

Content Managers and Customers: no delivery config control.

---

## 7. Configuration

Delivery rates, brackets, and surcharge rules are **configuration**, not hardcoded invented business facts in docs.

Until the client provides real numbers:

- Document the mechanism
- Use placeholders in config
- Do not invent production rates

---

## 8. API shape (conceptual)

**Customer quote/response**

```json
{
  "status": "NEEDS_NEGOTIATION",
  "deliveryFee": null,
  "message": "Please contact AWOH-B THE GREAT TILES VENTURE to discuss delivery."
}
```

or

```json
{
  "status": "QUOTE_AVAILABLE",
  "deliveryFee": 0,
  "currency": "PLACEHOLDER",
  "message": null
}
```

(`0` shown only as example shape — not a real rate.)

**Staff response** may include internal fields permitted by RBAC.

---

## 9. Audit events (minimum)

- DeliveryConfig created/updated
- Per-order delivery fee set/overridden
- Negotiation resolved/reopened
- Related important order delivery status changes

Metadata: actor id, order id, old/new fee, reason — never passwords/tokens.

---

## 10. Relationship to other domains

| Domain | Relationship |
|--------|--------------|
| Product | Holds internal weight fields |
| Order | Holds delivery outcome |
| Payment | Payable only when delivery fee is known and approved; amount = server grand total including delivery |
| Receipt | Shows customer-safe delivery fee line when applicable |

---

## 11. Testing focus (later)

- Customer endpoints cannot accept authoritative internal inputs
- Customer serializers omit internal fields
- Override paths require RBAC + audit rows
- Quote uses DB values even if client sends spoofed weights
