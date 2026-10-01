# AWOH-B Catalogue Crop Review

**Status:** READY FOR HUMAN VISUAL REVIEW  
**Generated:** 2026-09-26

---

## Source

| Item | Value |
|------|-------|
| PDF | `api/imports/catalogue/AWOH-B-TILE-CATALOGUE.pdf` |
| Page count | 74 |
| Pages with product SKUs | 68 |
| Header-only pages | 59, 74 |
| Dry-run reference | `api/imports/catalogue/catalogue-dry-run-manifest.json` (not rewritten) |

Extraction method: embedded PDF image XObjects via `pdfjs-dist` + `@napi-rs/canvas` JPEG encode. Spatial match of drawn image CTM rectangles to SKU text below each tile.

---

## Products

| Metric | Count |
|--------|------:|
| Catalogue SKU candidates processed | 575 |
| Unique SKUs | 575 |

---

## Crops

| Metric | Count |
|--------|------:|
| Crops generated | 575 |
| Output root | `api/imports/catalogue/crop-previews/` |

Organization: `{normalizedSize}/{category-slug}/{SKU}.jpg`  
Six size folders: `40x40`, `60x60`, `25x40`, `25x50`, `30x60`, `120x60`.

Geometry preserved from catalogue art (no forced square stretch). Landscape/portrait orientation of rectangular tiles accepted as printed in the PDF.

---

## Confidence

| Level | Count | Notes |
|-------|------:|-------|
| HIGH | 539 | Clear SKU↔image association and crop bounds |
| MEDIUM | 13 | Suffix variants, loose spatial match, possible duplicates, or recovery reload |
| LOW | 23 | Automated near-blank mean-sample flag — visual confirm required |
| NOT_FOUND (product) | 0 | All SKUs cropped |

---

## Category Mapping

Approved taxonomy preserved. WALL TILES and CRACK WALL TILES were **not** merged.

| Category | Sizes present in crops |
|----------|------------------------|
| VITRIFIED FLOOR TILES | 40×40, 60×60 |
| RUSTIC FLOOR TILES | 40×40, 30×60, 60×60 |
| GLAZED FLOOR TILES | 40×40, 60×60 |
| CRACK WALL TILES | 25×50, 30×60 |
| WALL TILES | 25×40, 30×60 |
| RUSTIC STEP TILES | 30×60 |
| SUPER POLISHED FLOOR TILES | 60×60, 120×60 |
| PORCELAIN RUSTIC FLOOR TILES | 120×60 |

---

## Size Mapping

| Catalogue / mm | Normalized folder |
|----------------|-------------------|
| 400 × 400 mm | 40x40 |
| 600 × 600 mm | 60x60 |
| 250 × 400 mm | 25x40 |
| 250 × 500 mm | 25x50 |
| 300 × 600 mm | 30x60 |
| 600 × 1200 mm | 120x60 |

These are physical tile dimensions, not pixel targets. Crop aspect ratios follow catalogue artwork.

---

## Suffix SKUs

Page 35 — each treated as an independent product; not merged.

| SKU | Status | Confidence | Crop |
|-----|--------|------------|------|
| 36359A | Cropped | MEDIUM | `crop-previews/30x60/wall-tiles/36359A.jpg` |
| 36359B | Cropped | MEDIUM | `crop-previews/30x60/wall-tiles/36359B.jpg` |
| 36360A | Cropped | MEDIUM | `crop-previews/30x60/wall-tiles/36360A.jpg` |
| 36360B | Cropped | MEDIUM | `crop-previews/30x60/wall-tiles/36360B.jpg` |
| 36360C | Cropped | MEDIUM | `crop-previews/30x60/wall-tiles/36360C.jpg` |
| 36361A | Cropped | MEDIUM | `crop-previews/30x60/wall-tiles/36361A.jpg` |
| 36361B | Cropped | MEDIUM | `crop-previews/30x60/wall-tiles/36361B.jpg` |

Human review should confirm each suffix maps to the correct visual swatch on page 35.

---

## Header-only Pages

| Page | Result |
|------|--------|
| 59 | HEADER_ONLY / NO_PRODUCT_SKUS — SUPER POLISHED FLOOR TILES 600×600MM section divider. No fake products created. |
| 74 | HEADER_ONLY / NO_PRODUCT_SKUS — PORCELAIN RUSTIC FLOOR TILES 600×1200MM section divider. No fake products created. |

Recorded in `crop-unresolved-products.json` with `visualReviewStatus: HEADER_ONLY`.

---

## Duplicate/Conflict Findings

| Pair | Action taken |
|------|--------------|
| 40509 / 40510 | Flagged `possibleDuplicate: true` — not merged |
| 60333 / 60336 | Flagged `possibleDuplicate: true` — not merged |

No SKU identity conflicts. Dry-run unique SKU set unchanged.

---

## Missing/Unresolved Crops

- Missing product crops: **none** (575/575)
- Unresolved review list: header pages 59 and 74 only
- Path: `api/imports/catalogue/crop-unresolved-products.json`

Technical note: SKUs `40300` and `60100` initially timed out loading embedded objects during the long PDF walk; both were recovered via a fresh PDF document pass and marked MEDIUM.

---

## Visual QA

Contact sheets generated per category × normalized size (chunked at 40 tiles per sheet).

Each cell shows: crop thumbnail, SKU, size, source page, confidence label.

Location: `api/imports/catalogue/crop-previews/contact-sheets/` (23 JPEG sheets).

Index detail: `docs/00_MASTER/CATALOGUE_CROP_QA_INDEX.md`

---

## Database Safety

**NO DATABASE IMPORT PERFORMED**

| Check | Result |
|-------|--------|
| New products | 0 |
| New categories | 0 |
| New subcategories | 0 |
| ProductImage records | 0 |
| Prisma migrations | 0 |
| Database seed changes | 0 |
| Existing Product tile-size implementation | unchanged |
| Dry-run manifest | unchanged |

---

## Human Review Required

Before any database import stage:

1. Spot-check HIGH crops via contact sheets (sample per category/size).
2. Visually confirm all 7 page-35 suffix SKU crops.
3. Inspect MEDIUM loose-match SKUs `40514`, `40517`.
4. Decide on possible-duplicate pairs `40509/40510` and `60333/60336`.
5. Inspect all 23 LOW near-blank flags.
6. Confirm pages 59 and 74 are header-only (no products expected).
7. Approve crop boundaries / categories / sizes before import authorization.

**Do not treat successful crop generation as import permission.**
