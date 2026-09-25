# Customer Flow

**Project:** AWOH-B THE GREAT TILES VENTURE

End-to-end customer journey for the MVP. UI copy can be refined in later stages; security boundaries cannot.

---

## MVP checkout model (recommended)

**Recommendation: registered checkout (create account or log in) before placing a payable order.**

| Topic | Approach |
|-------|----------|
| Why not guest for MVP | Simpler security (fewer IDOR/token edge cases), clearer order history, easier sales follow-up for delivery negotiation, faster to implement safely under deadline |
| Required customer info | Name, email, phone, password (on register), delivery/location fields at checkout |
| Order association | `userId` on Order; contact snapshots stored on order for receipts |
| Confirmation / receipt | Email to account email + in-account order history + PDF download for own orders |
| Protection | Auth session required to access own orders/receipts; IDOR checks; rate limits |

Guest checkout is **out of MVP scope** but the order model should keep email/phone snapshots so guest can be added later without redesigning payments/delivery.

If the project owner later mandates guest checkout, document: required email + phone + address; order access via authenticated email magic-link or unguessable order access token; never enumerable public order IDs alone.

---

## Flow

1. **Visitor enters website**  
   Lands on premium homepage (Stage 03).

2. **Browses products**  
   Category → Subcategory → Product navigation; featured items (Stages 03–04).

3. **Filters / searches products**  
   Search; filter by category and/or subcategory (Stage 04).

4. **Opens product**  
   Detail page: description, specs (customer-safe), price, availability, gallery (Stage 04).

5. **Adds product to cart**  
   Submits `productId` + `quantity` only for line identity (Stage 04).  
   Does **not** submit weight or surcharge fields.

6. **Reviews cart**  
   Sees line items and prices from server-backed data (Stage 04).

7. **Starts checkout**  
   Registers or logs in (Stage 05/06) per MVP recommendation above.

8. **Provides required customer / order information**  
   Delivery/location fields needed for quote (Stage 06).

9. **Delivery calculated or requires negotiation** (Stage 07)  
    - **Fee known & approved:** customer sees final delivery fee; may select payment method  
    - **Needs negotiation:** customer is told to contact AWOH-B THE GREAT TILES VENTURE; **payment blocked** until fee confirmed  
    - No internal weight/surcharge/load-bracket exposure

10. **Selects online or offline payment** (only when delivery fee confirmed)  
    - Online → Paystack path  
    - Offline/cash → staff-managed path (Stage 06)

11. **Order is created** with server-authoritative totals  
    Backend validates and persists order + payment record (Stage 06).

12. **Payment verified when applicable**  
    Server-side Paystack verification / webhook; or staff confirms offline payment (Stage 06).

13. **Customer receives order confirmation**  
    In-app confirmation + email when configured (Stage 06).

14. **Receipt becomes available**  
    PDF download + email receipt from authoritative backend data (Stage 06).

15. **Customer tracks order status**  
    Account order history/status; delivery status at customer-safe level (Stages 06–07).

---

## Customer-visible vs hidden

| Visible to customer | Hidden from customer |
|---------------------|----------------------|
| Product merchandising info | Internal weight per carton / load brackets |
| Price, availability | Weight surcharge formulas |
| Final delivery fee (when set) | Authoritative calculation inputs |
| Delivery/negotiation status messaging | Staff negotiation notes / internal breakdowns |
| Payment status (safe labels) | Paystack secrets, webhook payloads |
| Order status | Other customers’ data, audit logs |

---

## Support touchpoint

Delivery negotiation depends on configured contact channels (`PLACEHOLDER` until client provides). UI must not invent phone/email values.
