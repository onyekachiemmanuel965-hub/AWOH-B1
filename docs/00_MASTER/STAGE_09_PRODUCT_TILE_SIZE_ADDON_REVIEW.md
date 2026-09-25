# Stage 09 Product Tile Size Add-on Review

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Add-on:** Product Tile Size Selection + Aspect-Ratio Image Presentation  
**Review status:** `PENDING_REVIEW`  
**Stage 10:** NOT STARTED

---

## 1. Purpose

Staff need to record the physical tile format when creating/editing products. That authoritative size drives customer-facing image proportions so tiles look square or rectangular according to their real aspect ratio — without stretching or distorting images.

---

## 2. Supported sizes

| Enum | Key | Label | Aspect ratio (W÷H) |
|------|-----|-------|--------------------|
| `SIZE_60X60` | `60x60` | 60 × 60 cm | 1 |
| `SIZE_40X40` | `40x40` | 40 × 40 cm | 1 |
| `SIZE_25X40` | `25x40` | 25 × 40 cm | 0.625 |
| `SIZE_25X50` | `25x50` | 25 × 50 cm | 0.5 |
| `SIZE_30X60` | `30x60` | 30 × 60 cm | 0.5 |
| `SIZE_120X60` | `120x60` | 120 × 60 cm | 2 |

---

## 3. Data model

- Prisma enum `TileSize` on `Product.tileSize` (nullable for legacy rows)
- Migration: `20260926000100_stage09_product_tile_size` — adds column without inventing sizes for unknown products
- Demo seed assigns a valid size to every demo product
- Shared defs: `api/src/catalog/tile-size.ts` and `web/src/lib/tile-size.ts`

---

## 4. Admin workflow

1. Create/edit product (ADMIN or CONTENT_MANAGER)
2. Required **Tile Size** select
3. Image preview container updates to that aspect ratio immediately
4. Upload via existing JPG/PNG/WEBP path (security unchanged)
5. Persist `tileSize` with product content update

---

## 5. Customer experience

- Product cards show size label and aspect-ratio frame (`object-contain` — no stretch)
- Product detail shows **Tile Size** and uses the same aspect ratio for the main image
- Public API returns `tileSize`, `tileSizeLabel`, `tileAspectRatio` — never weight/stock

---

## 6. RBAC

Tile size is a **product content** field:

- Create / update: `ADMIN`, `CONTENT_MANAGER` (same as existing product content endpoints)
- Not inventory/price — inventory managers do not gain new size mutation rights

---

## 7. Delivery

`weightPerCartonKg` remains backend-only and separate.

- Tile size does **not** derive weight
- No new weights invented for UI sizes
- Known gap: `40×40` has no entry in `EXPLICIT_TILE_CARTON_WEIGHTS_KG` — weight stays whatever is set on the product (or null)

---

## 8. Image behavior

- CSS `aspect-ratio` from width÷height
- `object-fit: contain` — never `fill` / stretch
- Source pixel resolution is independent of physical cm size
- No advanced crop editor in this add-on (future enhancement)

---

## 9. Testing / builds

- API tests: **194 passed**, 194 total (28 suites)
- API build: **PASS**
- Web build: **PASS**
- Tile-size unit/contract coverage in `tile-size.spec.ts` + create guards
- Aspect ratios verified for all six sizes in unit tests

Manual acceptance (proportion + display contract):

| Size | Aspect | Expected presentation |
|------|--------|------------------------|
| 60×60 | 1 | Square |
| 40×40 | 1 | Square |
| 25×40 | 0.625 | Portrait |
| 25×50 | 0.5 | Tall portrait |
| 30×60 | 0.5 | Tall portrait |
| 120×60 | 2 | Wide landscape |

Images use `object-contain` (no stretch).

---

## 10. Known limitations

- Legacy products may have `tileSize = null` until edited or re-seeded
- No interactive crop editor
- `40×40` has no business-approved carton weight in seed-weights (weight field separate)
- Advanced media management out of scope

---

**STAGE 10 HAS NOT BEEN STARTED.**
