# Catalogue Dry Run Review — AWOH-B

```text
STATUS:
READY FOR HUMAN REVIEW
```

---

### Source

- PDF: `api/imports/catalogue/AWOH-B-TILE-CATALOGUE.pdf`
- Original: `YAQOUT-BESTWILL CERAMIC NEW UPDATED CATALOG 2026.07.03.pdf`
- Pages: **74** (all inspected via text extraction)

---

### Inspection

Successfully extracted page text for all 74 pages with `pdfjs-dist`.

Parsed:

- Product-type headers (category)
- Size tokens (mm → cm normalization)
- SKU / product codes under each header

Did **not**:

- Write to the database
- Create Category / Subcategory / Product / ProductImage records
- Run Prisma migrate or seed
- Generate crop preview images (crop boxes not measured)

---

### Organization

```text
CATEGORY = catalogue product type
SUBCATEGORY = tile size
PRODUCT = SKU
```

8 categories · 15 category×size pairs · 575 unique SKUs.

Full tree: `docs/00_MASTER/CATALOGUE_CATEGORY_MAPPING.md`

---

### Statistics

| Metric | Count |
| ------ | ----: |
| Pages inspected | 74 |
| Categories | 8 |
| Sizes (normalized) | 6 |
| Category × size pairs | 15 |
| Unique SKUs | 575 |
| Duplicate/conflict SKUs | 0 |
| Image candidates (SKU on product page) | 575 |
| Crop confidence MEDIUM | 575 |
| Crop confidence HIGH | 0 |
| READY | 568 |
| NEEDS_CATEGORY_REVIEW (suffix) | 7 |
| Unresolved header pages | 2 |

---

### Image extraction

- Product pages show grid layouts with SKU labels under tiles → images are **candidates** for individual crops.
- Crop confidence set to **MEDIUM** because this pass did not measure pixel bounding boxes.
- No misleading preview files were written under `dry-run-previews/`.
- Next authorized step (after approval): controlled crop + visual QA → then DB import.

---

### Database impact

```text
Database products created: 0
Database categories created: 0
Database subcategories created: 0
ProductImage records created: 0
```

---

### Issues requiring your review

1. **Pages 59 & 74** — category/size header, no SKUs in text (possible image-only pages).
2. **Suffix SKUs on page 35** — `36359A/B`, `36360A/B/C`, `36361A/B` under WALL TILES / 30 × 60.
3. Confirm **WALL TILES** vs **CRACK WALL TILES** remain separate categories.
4. Approve taxonomy before any import.
5. Prices, stock, weights remain **NOT_ASSIGNED**.

Artifacts:

- `api/imports/catalogue/catalogue-dry-run-manifest.json`
- `api/imports/catalogue/unresolved-products.json`
- `docs/00_MASTER/CATALOGUE_DRY_RUN_REPORT.md`
- `docs/00_MASTER/CATALOGUE_CATEGORY_MAPPING.md`

---

### Next step

After human approval, a **separate** controlled catalogue import/cropping task may be authorized.

**Do not proceed to cropping or database import until approved.**

**STAGE 10 HAS NOT BEEN STARTED.**
