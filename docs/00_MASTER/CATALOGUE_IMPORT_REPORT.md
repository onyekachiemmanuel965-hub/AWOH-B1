# AWOH-B Catalogue Import Report

**FINAL STATUS: IMPORT COMPLETED WITH EXCLUSIONS**  
**Generated:** 2026-09-28T22:09:44.852Z

---

## Source

PDF: `api/imports/catalogue/AWOH-B-TILE-CATALOGUE.pdf`

Supporting artifacts:
- `catalogue-dry-run-manifest.json`
- `catalogue-crop-manifest.json`
- `crop-human-review-decisions.json`
- `docs/00_MASTER/CATALOGUE_VISUAL_QA_DECISION_REPORT.md`
- `docs/00_MASTER/CATALOGUE_RECROP_40300_60100_VALIDATION.md`

---

## Import Summary

| Metric | Count |
|--------|------:|
| Source catalogue SKUs | 575 |
| Imported products | 563 |
| Excluded products | 12 |
| Failed products | 0 |
| Originally expected (before blank preflight) | 573 |

Task originally authorized 573 imports excluding only 40300/60100. Import preflight discovered additional blank/placeholder crops of the same class and excluded them rather than importing blank imagery.

---

## Explicit Exclusions

| SKU | Code | Discovery | Page | Category | Size |
|-----|------|-----------|-----:|----------|------|
| 40500 | EXCLUDED_IMAGE_UNAVAILABLE | Preflight blank | p8 | RUSTIC FLOOR TILES | 40 × 40 |
| 40300 | EXCLUDED_IMAGE_UNAVAILABLE | QA-known | p15 | GLAZED FLOOR TILES | 40 × 40 |
| 25100 | EXCLUDED_IMAGE_UNAVAILABLE | Preflight blank | p24 | WALL TILES | 25 × 40 |
| 36300 | EXCLUDED_IMAGE_UNAVAILABLE | Preflight blank | p31 | WALL TILES | 30 × 60 |
| 36332 | EXCLUDED_IMAGE_UNAVAILABLE | Preflight blank | p32 | WALL TILES | 30 × 60 |
| 36506 | EXCLUDED_IMAGE_UNAVAILABLE | Preflight blank | p37 | RUSTIC FLOOR TILES | 30 × 60 |
| 60500 | EXCLUDED_IMAGE_UNAVAILABLE | Preflight blank | p50 | RUSTIC FLOOR TILES | 60 × 60 |
| 60535 | EXCLUDED_IMAGE_UNAVAILABLE | Preflight blank | p52 | RUSTIC FLOOR TILES | 60 × 60 |
| 60100 | EXCLUDED_IMAGE_UNAVAILABLE | QA-known | p54 | SUPER POLISHED FLOOR TILES | 60 × 60 |
| 60701 | EXCLUDED_IMAGE_UNAVAILABLE | Preflight blank | p62 | SUPER POLISHED FLOOR TILES | 60 × 60 |
| 12100 | EXCLUDED_IMAGE_UNAVAILABLE | Preflight blank | p63 | SUPER POLISHED FLOOR TILES | 120 × 60 |
| 12200 | EXCLUDED_IMAGE_UNAVAILABLE | Preflight blank | p70 | SUPER POLISHED FLOOR TILES | 120 × 60 |

Reason (all):

> The original catalogue source contains a blank/placeholder image and no valid product crop could be recovered.

Required exclusions **40300** and **60100** are included. No Product or ProductImage records were created for any excluded SKU.

---

## Category Summary

| Category | Products |
|----------|--------:|
| CRACK WALL TILES | 60 |
| GLAZED FLOOR TILES | 108 |
| PORCELAIN RUSTIC FLOOR TILES | 12 |
| RUSTIC FLOOR TILES | 102 |
| RUSTIC STEP TILES | 11 |
| SUPER POLISHED FLOOR TILES | 119 |
| VITRIFIED FLOOR TILES | 16 |
| WALL TILES | 135 |

---

## Subcategory/Size Summary

| Size | Products |
|------|--------:|
| 120 × 60 | 61 |
| 25 × 40 | 82 |
| 25 × 50 | 37 |
| 30 × 60 | 100 |
| 40 × 40 | 119 |
| 60 × 60 | 164 |

---

## SKU Validation

| Check | Count |
|-------|------:|
| Source SKUs | 575 |
| Imported SKUs | 563 |
| Excluded SKUs | 12 |
| Duplicate SKUs | 0 |
| Missing SKUs | 0 |
| Unexpected SKUs | 0 |

Identity: Product.slug = `sku-{lowercase}`; catalogue SKU also stored in `specsJson.sku`.

---

## Image Validation

| Check | Count |
|-------|------:|
| Expected importable images | 563 |
| Successfully imported images | 563 |
| Blank images imported | 0 |
| Mismatched images | 0 |
| Missing images | 0 |

Images stored as deterministic paths: `/uploads/products/catalogue_{sku}.jpg`

---

## Special SKU Verification

| Group | Result |
|-------|--------|
| Suffix SKUs 36359A/B, 36360A/B/C, 36361A/B | PASS — separate products |
| 40509 / 40510 | KEEP_SEPARATE |
| 60333 / 60336 | KEEP_SEPARATE |

---

## Excluded Source Entries

40300 and 60100 were excluded because the source catalogue contains blank/placeholder imagery and valid source crops could not be recovered.

Additional SKUs excluded at import preflight for the same blank/placeholder class: 40500, 25100, 36300, 36332, 36506, 60500, 60535, 60701, 12100, 12200.

---

## Database Verification

| Action | Count |
|--------|------:|
| Products created | 563 |
| Products updated | 0 |
| Categories created | 8 |
| Categories reused | 0 |
| Subcategories created | 15 |
| Subcategories reused | 0 |
| Product images created | 563 |
| Product images updated | 0 |
| Duplicate records detected | 0 |
| Prisma migrations created by this import | 0 |

Conventions:
- Price: `0.00` NGN (not invented from catalogue); `availability = UNAVAILABLE` until priced
- Stock: `0`
- Weight: `null` (not invented)
- Tile size: Prisma `TileSize` enum from approved mapping

---

## Final Status

**IMPORT COMPLETED WITH EXCLUSIONS**

563 catalogue products imported successfully.  
12 SKUs explicitly excluded (blank/unavailable source imagery).
