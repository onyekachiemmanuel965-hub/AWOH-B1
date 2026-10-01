# AWOH-B Catalogue Crop QA Index

**Status:** READY FOR HUMAN VISUAL REVIEW — no database import performed  
**Generated:** 2026-09-26  
**Source PDF:** `api/imports/catalogue/AWOH-B-TILE-CATALOGUE.pdf` (74 pages)

---

## Summary counts

| Metric | Count |
|--------|------:|
| Total products processed (SKU candidates) | 575 |
| Total crops generated | 575 |
| HIGH confidence | 539 |
| MEDIUM confidence | 13 |
| LOW confidence | 23 |
| NOT_FOUND (product images) | 0 |
| Unresolved review entries | 2 (header-only pages 59 & 74) |
| Contact sheets | 23 |
| Possible duplicate image pairs | 2 |

---

## Category × size matrix

| Category | Size | SKU Count | Crops Generated | High | Medium | Low | Not Found |
|----------|------|----------:|----------------:|-----:|-------:|----:|----------:|
| CRACK WALL TILES | 25x50 | 37 | 37 | 37 | 0 | 0 | 0 |
| CRACK WALL TILES | 30x60 | 23 | 23 | 23 | 0 | 0 | 0 |
| GLAZED FLOOR TILES | 40x40 | 45 | 45 | 42 | 1 | 2 | 0 |
| GLAZED FLOOR TILES | 60x60 | 64 | 64 | 60 | 1 | 3 | 0 |
| PORCELAIN RUSTIC FLOOR TILES | 120x60 | 12 | 12 | 11 | 0 | 1 | 0 |
| RUSTIC FLOOR TILES | 30x60 | 14 | 14 | 13 | 0 | 1 | 0 |
| RUSTIC FLOOR TILES | 40x40 | 63 | 63 | 60 | 3 | 0 | 0 |
| RUSTIC FLOOR TILES | 60x60 | 29 | 29 | 27 | 0 | 2 | 0 |
| RUSTIC STEP TILES | 30x60 | 11 | 11 | 11 | 0 | 0 | 0 |
| SUPER POLISHED FLOOR TILES | 120x60 | 51 | 51 | 48 | 0 | 3 | 0 |
| SUPER POLISHED FLOOR TILES | 60x60 | 72 | 72 | 66 | 1 | 5 | 0 |
| VITRIFIED FLOOR TILES | 40x40 | 13 | 13 | 13 | 0 | 0 | 0 |
| VITRIFIED FLOOR TILES | 60x60 | 3 | 3 | 3 | 0 | 0 | 0 |
| WALL TILES | 25x40 | 83 | 83 | 82 | 0 | 1 | 0 |
| WALL TILES | 30x60 | 55 | 55 | 43 | 7 | 5 | 0 |

**Taxonomy note:** WALL TILES and CRACK WALL TILES remain separate categories.

---

## Crops requiring human review

### MEDIUM (13)

| SKU | Reason |
|-----|--------|
| 36359A, 36359B, 36360A, 36360B, 36360C, 36361A, 36361B | Suffix SKU — confirm correct variant image (page 35) |
| 40300 | Recovered after PDF object load timeout (page 15) |
| 60100 | Recovered after PDF object load timeout (page 54) |
| 40514, 40517 | Loose SKU-to-image spatial match score |
| 40510 | Possible duplicate fingerprint vs 40509 |
| 60336 | Possible duplicate fingerprint vs 60333 |

### LOW (23)

Flagged by automated near-blank mean-sample check. Images exist on disk; confirm they are not washed-out / wrong crops:

`40301`, `40339`, `25138`, `36305`, `36327`, `36345`, `36348`, `36363`, `36515`, `60305`, `60325`, `60330`, `60533`, `60536`, `60105`, `60117`, `60122`, `60136`, `60139`, `12118`, `12156`, `12159`, `12501`

### Header-only pages (not missing products)

| Page | Classification |
|------|----------------|
| 59 | HEADER_ONLY / NO_PRODUCT_SKUS — SUPER POLISHED FLOOR TILES 600×600MM |
| 74 | HEADER_ONLY / NO_PRODUCT_SKUS — PORCELAIN RUSTIC FLOOR TILES 600×1200MM |

---

## Suffix SKU cases (page 35)

| SKU | Crop file | Confidence |
|-----|-----------|------------|
| 36359A | `crop-previews/30x60/wall-tiles/36359A.jpg` | MEDIUM |
| 36359B | `crop-previews/30x60/wall-tiles/36359B.jpg` | MEDIUM |
| 36360A | `crop-previews/30x60/wall-tiles/36360A.jpg` | MEDIUM |
| 36360B | `crop-previews/30x60/wall-tiles/36360B.jpg` | MEDIUM |
| 36360C | `crop-previews/30x60/wall-tiles/36360C.jpg` | MEDIUM |
| 36361A | `crop-previews/30x60/wall-tiles/36361A.jpg` | MEDIUM |
| 36361B | `crop-previews/30x60/wall-tiles/36361B.jpg` | MEDIUM |

Not merged into base SKUs 36359 / 36360 / 36361.

---

## Duplicate / conflict findings

| SKU | Finding |
|-----|---------|
| 40510 ↔ 40509 | Same sampled pixel fingerprint — possibleDuplicate: true |
| 60336 ↔ 60333 | Same sampled pixel fingerprint — possibleDuplicate: true |

Do **not** auto-merge. Human review decides whether catalogue imagery is intentionally identical.

No filename collisions. No SKU represented more than once in the crop manifest.

---

## Missing-image findings

- Product SKU crops missing: **0** (all 575 dry-run SKUs have a crop file)
- Unresolved file entries: header-only pages 59 and 74 only

---

## Contact-sheet locations

Directory: `api/imports/catalogue/crop-previews/contact-sheets/`

Filename convention: `{category-slug}__{normalizedSize}[-partN].jpg`

- `crack-wall-tiles__25x50.jpg`
- `crack-wall-tiles__30x60.jpg`
- `glazed-floor-tiles__40x40.jpg` (+ `-part2`)
- `glazed-floor-tiles__60x60.jpg` (+ `-part2`)
- `porcelain-rustic-floor-tiles__120x60.jpg`
- `rustic-floor-tiles__30x60.jpg`
- `rustic-floor-tiles__40x40.jpg` (+ `-part2`)
- `rustic-floor-tiles__60x60.jpg`
- `rustic-step-tiles__30x60.jpg`
- `super-polished-floor-tiles__120x60.jpg` (+ `-part2`)
- `super-polished-floor-tiles__60x60.jpg` (+ `-part2`)
- `vitrified-floor-tiles__40x40.jpg`
- `vitrified-floor-tiles__60x60.jpg`
- `wall-tiles__25x40.jpg` (+ `-part2`, `-part3`)
- `wall-tiles__30x60.jpg` (+ `-part2`)

---

## Artifact paths

| Artifact | Path |
|----------|------|
| Crop manifest | `api/imports/catalogue/catalogue-crop-manifest.json` |
| Unresolved | `api/imports/catalogue/crop-unresolved-products.json` |
| Crop previews | `api/imports/catalogue/crop-previews/{size}/{category-slug}/{SKU}.jpg` |
| Dry-run manifest (unchanged) | `api/imports/catalogue/catalogue-dry-run-manifest.json` |
| Review doc | `docs/00_MASTER/CATALOGUE_CROP_REVIEW.md` |

---

## Database safety

| Check | Result |
|-------|--------|
| New products | 0 |
| New categories / subcategories | 0 |
| ProductImage records | 0 |
| Prisma migrations | 0 |
| Database seed changes | 0 |
