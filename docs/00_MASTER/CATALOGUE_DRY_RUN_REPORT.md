# Catalogue Dry Run Report — AWOH-B Tile Catalogue

**Status:** DRY RUN ONLY — no database import performed  
**Generated:** 2026-09-26

---

## A. Source

```text
Source:
api/imports/catalogue/AWOH-B-TILE-CATALOGUE.pdf

Original filename:
YAQOUT-BESTWILL CERAMIC NEW UPDATED CATALOG 2026.07.03.pdf

Copied from:
c:\Users\Emmanuel\OneDrive\Pictures\YAQOUT-BESTWILL CERAMIC NEW UPDATED CATALOG 2026.07.03.pdf
```

Machine-readable companion:

- `api/imports/catalogue/catalogue-dry-run-manifest.json`
- `api/imports/catalogue/unresolved-products.json`

---

## B. PDF statistics

| Metric | Value |
| ------ | ----: |
| Total pages | 74 |
| Pages inspected | 74 |
| Catalogue product-type categories | 8 |
| Category × size subcategory pairs | 15 |
| Identifiable product/SKU records | 575 |
| Unique SKUs | 575 |
| Duplicate SKU groups | 0 |
| Conflicting SKU groups | 0 |
| Products with image association (text-confirmed on product page) | 575 |
| Crop confidence HIGH | 0 |
| Crop confidence MEDIUM | 575 |
| Crop confidence LOW | 0 |
| Crop confidence NOT_FOUND | 0 |
| Status READY | 568 |
| Status NEEDS_CATEGORY_REVIEW (suffix SKUs) | 7 |
| Header pages with no extractable SKUs | 2 |
| Unresolved review records | 2 |

**Pricing / inventory / weight:** all `NOT_ASSIGNED` (not invented).

**Crop note:** This dry run used PDF text extraction only. Individual tile images are present on product grid pages (SKU labels under tiles), but pixel-accurate crop boxes were **not** measured. Crop confidence is therefore **MEDIUM** pending visual QA / a future cropping pass. Preview crops were **not** generated to avoid misleading assets.

---

## C. Categories discovered

1. VITRIFIED FLOOR TILES  
2. RUSTIC FLOOR TILES  
3. GLAZED FLOOR TILES  
4. CRACK WALL TILES  
5. WALL TILES  
6. RUSTIC STEP TILES  
7. SUPER POLISHED FLOOR TILES  
8. PORCELAIN RUSTIC FLOOR TILES  

---

## D. Category → size organization

```text
VITRIFIED FLOOR TILES
├── 40 × 40
└── 60 × 60

RUSTIC FLOOR TILES
├── 40 × 40
├── 30 × 60
└── 60 × 60

GLAZED FLOOR TILES
├── 40 × 40
└── 60 × 60

CRACK WALL TILES
├── 25 × 50
└── 30 × 60

WALL TILES
├── 25 × 40
└── 30 × 60

RUSTIC STEP TILES
└── 30 × 60

SUPER POLISHED FLOOR TILES
├── 60 × 60
└── 120 × 60

PORCELAIN RUSTIC FLOOR TILES
└── 120 × 60
```

Size normalization applied:

| Source (mm) | Normalized (cm display) | AWOH-B TileSize enum |
| ----------- | ----------------------- | -------------------- |
| 400×400 | 40 × 40 | SIZE_40X40 |
| 600×600 | 60 × 60 | SIZE_60X60 |
| 250×400 | 25 × 40 | SIZE_25X40 |
| 250×500 | 25 × 50 | SIZE_25X50 |
| 300×600 | 30 × 60 | SIZE_30X60 |
| 600×1200 | 120 × 60 | SIZE_120X60 |

No unsupported sizes were found (`NEEDS_SIZE_REVIEW` = 0).

---

## E. Products

Full SKU table (575 rows) is in:

- Manifest: `api/imports/catalogue/catalogue-dry-run-manifest.json` → `products[]`
- Markdown dump: `api/imports/catalogue/_extract/products-table.md`

### Counts by category / size

| Category | Subcategory | SKU count |
| -------- | ----------- | --------: |
| VITRIFIED FLOOR TILES | 40 × 40 | 13 |
| VITRIFIED FLOOR TILES | 60 × 60 | 3 |
| RUSTIC FLOOR TILES | 40 × 40 | 63 |
| RUSTIC FLOOR TILES | 30 × 60 | 14 |
| RUSTIC FLOOR TILES | 60 × 60 | 29 |
| GLAZED FLOOR TILES | 40 × 40 | 45 |
| GLAZED FLOOR TILES | 60 × 60 | 64 |
| CRACK WALL TILES | 25 × 50 | 37 |
| CRACK WALL TILES | 30 × 60 | 23 |
| WALL TILES | 25 × 40 | 83 |
| WALL TILES | 30 × 60 | 55 |
| RUSTIC STEP TILES | 30 × 60 | 11 |
| SUPER POLISHED FLOOR TILES | 60 × 60 | 72 |
| SUPER POLISHED FLOOR TILES | 120 × 60 | 51 |
| PORCELAIN RUSTIC FLOOR TILES | 120 × 60 | 12 |
| **Total** | | **575** |

### Example rows (SUPER POLISHED FLOOR TILES)

| SKU | Category | Subcategory | Source Size | PDF Page | Image | Crop Confidence | Status |
| --- | -------- | ----------- | ----------- | -------: | ----- | --------------- | ------ |
| 60100 | SUPER POLISHED FLOOR TILES | 60 × 60 | 600 × 600 MM | 52 | FOUND | MEDIUM | READY |
| 60101 | SUPER POLISHED FLOOR TILES | 60 × 60 | 600 × 600 MM | 52 | FOUND | MEDIUM | READY |
| 12114 | SUPER POLISHED FLOOR TILES | 120 × 60 | 600 × 1200 MM | 66 | FOUND | MEDIUM | READY |
| 12120 | SUPER POLISHED FLOOR TILES | 120 × 60 | 600 × 1200 MM | 66 | FOUND | MEDIUM | READY |

---

## F. Duplicates

**None.** All 575 extracted SKUs are unique across the PDF text.

---

## G. Unresolved / review records

### Header pages with no extractable SKU text

| Page | Suspected category | Suspected size | Reason |
| ---: | ------------------ | -------------- | ------ |
| 59 | SUPER POLISHED FLOOR TILES | 60 × 60 | Header present; no SKU codes in extracted text (possible image-only / OCR gap) |
| 74 | PORCELAIN RUSTIC FLOOR TILES | 120 × 60 | Header present; no SKU codes in extracted text (possible image-only / end page) |

### Unusual SKU formats (suffixes) — NEEDS_CATEGORY_REVIEW

| SKU | Category | Size | Page | Note |
| --- | -------- | ---- | ---: | ---- |
| 36359A | WALL TILES | 30 × 60 | 35 | Letter suffix (variant / face?) |
| 36359B | WALL TILES | 30 × 60 | 35 | Letter suffix |
| 36360A | WALL TILES | 30 × 60 | 35 | Letter suffix |
| 36360B | WALL TILES | 30 × 60 | 35 | Letter suffix |
| 36360C | WALL TILES | 30 × 60 | 35 | Letter suffix |
| 36361A | WALL TILES | 30 × 60 | 35 | Letter suffix |
| 36361B | WALL TILES | 30 × 60 | 35 | Letter suffix |

See `api/imports/catalogue/unresolved-products.json`.

---

## H. Recommendations for human review

1. Confirm the 8 product-type categories should each become AWOH-B `Category` records (not nested under a generic “Floor Tiles”).
2. Confirm subcategory = normalized tile size only.
3. Visually review pages **59** and **74** for missing SKUs.
4. Decide how suffix SKUs (`36359A/B`, etc.) should be stored (separate products vs variants).
5. Approve MEDIUM crop confidence → run a dedicated cropping pass before DB import.
6. Assign prices, stock, and weights separately — not from this catalogue dry run.
7. Do not import until this dry run is approved.

---

## I. Existing AWOH-B tile size field (inspection only)

| Item | Finding |
| ---- | ------- |
| Field | `Product.tileSize` |
| Type | Prisma enum `TileSize` |
| Values | `SIZE_60X60`, `SIZE_40X40`, `SIZE_25X40`, `SIZE_25X50`, `SIZE_30X60`, `SIZE_120X60` |
| Admin | Required select on create/edit |
| Storefront | Aspect-ratio frames + size label |
| Catalogue coverage | All six normalized sizes in this PDF map to existing enums |

No schema changes were made in this dry run.

---

## J. Database impact

```text
Database products created: 0
Database categories created: 0
Database subcategories created: 0
ProductImage records created: 0
Prisma migrate/seed: NOT RUN
```

---

**STAGE 10 HAS NOT BEEN STARTED.**
