# AWOH-B Catalogue Targeted Visual QA

**Status:** READY FOR TARGETED HUMAN VISUAL REVIEW  
**Generated:** 2026-09-26  
**Database import:** NOT PERFORMED

---

## Reviewer instructions

Determine for each targeted crop:

1. Correct SKU-to-image mapping
2. Correct crop boundary
3. Correct category
4. Correct normalized size
5. No neighboring product contamination
6. No unwanted catalogue text
7. No blank/incorrect crop
8. Correct suffix SKU identity (where applicable)
9. Whether duplicate candidates are actually distinct (identical / similar / mis-mapped)

Do **not** mark anything APPROVED in automation. Record decisions in:

`api/imports/catalogue/crop-human-review-decisions.json`

Allowed decisions later: `APPROVE` · `REJECT` · `REQUIRES_RECROP`  
Current state for every item: **PENDING**

LOW confidence means an automated near-blank mean-sample flag only — do **not** treat LOW as automatically bad.

---

## Counts (from live manifest)

| Group | Count |
|-------|------:|
| MEDIUM | 13 |
| LOW | 23 |
| Suffix SKUs | 7 |
| Duplicate candidates | 4 |
| Recovered | 2 |
| Unique targeted SKUs | 38 |
| Contact sheets | 6 |

Overlapping groups are listed once in the master table; `flags` record all applicable memberships.

---

## Contact sheets

| Group | Path |
|-------|------|
| — | `crop-previews/human-review/medium/medium-contact.jpg` |
| — | `crop-previews/human-review/low/low-contact-part1.jpg` |
| — | `crop-previews/human-review/low/low-contact-part2.jpg` |
| — | `crop-previews/human-review/suffix-skus/suffix-skus-contact.jpg` |
| — | `crop-previews/human-review/possible-duplicates/duplicate-pairs-contact.jpg` |
| — | `crop-previews/human-review/recovered/recovered-contact.jpg` |

Group folders (indexes only — crops not duplicated):

- `api/imports/catalogue/crop-previews/human-review/medium/`
- `api/imports/catalogue/crop-previews/human-review/low/`
- `api/imports/catalogue/crop-previews/human-review/suffix-skus/`
- `api/imports/catalogue/crop-previews/human-review/possible-duplicates/`
- `api/imports/catalogue/crop-previews/human-review/recovered/`

---

## Master review table

| SKU | Category | Size | Page | Confidence | Reason | Review |
|-----|----------|------|------|------------|--------|--------|
| 12118 | SUPER POLISHED FLOOR TILES | 120x60 | 65 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 12156 | SUPER POLISHED FLOOR TILES | 120x60 | 68 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 12159 | SUPER POLISHED FLOOR TILES | 120x60 | 69 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 12501 | PORCELAIN RUSTIC FLOOR TILES | 120x60 | 72 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 25138 | WALL TILES | 25x40 | 26 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 36305 | WALL TILES | 30x60 | 31 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 36327 | WALL TILES | 30x60 | 32 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 36345 | WALL TILES | 30x60 | 33 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 36348 | WALL TILES | 30x60 | 34 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 36359A | WALL TILES | 30x60 | 35 | MEDIUM | Suffix SKU — confirm correct variant image | PENDING |
| 36359B | WALL TILES | 30x60 | 35 | MEDIUM | Suffix SKU — confirm correct variant image | PENDING |
| 36360A | WALL TILES | 30x60 | 35 | MEDIUM | Suffix SKU — confirm correct variant image | PENDING |
| 36360B | WALL TILES | 30x60 | 35 | MEDIUM | Suffix SKU — confirm correct variant image | PENDING |
| 36360C | WALL TILES | 30x60 | 35 | MEDIUM | Suffix SKU — confirm correct variant image | PENDING |
| 36361A | WALL TILES | 30x60 | 35 | MEDIUM | Suffix SKU — confirm correct variant image | PENDING |
| 36361B | WALL TILES | 30x60 | 35 | MEDIUM | Suffix SKU — confirm correct variant image | PENDING |
| 36363 | WALL TILES | 30x60 | 36 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 36515 | RUSTIC FLOOR TILES | 30x60 | 38 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 40300 | GLAZED FLOOR TILES | 40x40 | 15 | MEDIUM | Recovered via fresh PDF reload after initial load timeout | PENDING |
| 40301 | GLAZED FLOOR TILES | 40x40 | 15 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 40339 | GLAZED FLOOR TILES | 40x40 | 17 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 40509 | RUSTIC FLOOR TILES | 40x40 | 9 | HIGH | Possible duplicate fingerprint | PENDING |
| 40510 | RUSTIC FLOOR TILES | 40x40 | 9 | MEDIUM | Same sampled pixel fingerprint as 40509 | PENDING |
| 40514 | RUSTIC FLOOR TILES | 40x40 | 9 | MEDIUM | Loose SKU-to-image spatial match score | PENDING |
| 40517 | RUSTIC FLOOR TILES | 40x40 | 9 | MEDIUM | Loose SKU-to-image spatial match score | PENDING |
| 60100 | SUPER POLISHED FLOOR TILES | 60x60 | 54 | MEDIUM | Recovered via fresh PDF reload after initial load timeout | PENDING |
| 60105 | SUPER POLISHED FLOOR TILES | 60x60 | 54 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 60117 | SUPER POLISHED FLOOR TILES | 60x60 | 55 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 60122 | SUPER POLISHED FLOOR TILES | 60x60 | 55 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 60136 | SUPER POLISHED FLOOR TILES | 60x60 | 56 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 60139 | SUPER POLISHED FLOOR TILES | 60x60 | 56 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 60305 | GLAZED FLOOR TILES | 60x60 | 42 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 60325 | GLAZED FLOOR TILES | 60x60 | 44 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 60330 | GLAZED FLOOR TILES | 60x60 | 44 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 60333 | GLAZED FLOOR TILES | 60x60 | 45 | HIGH | Possible duplicate fingerprint | PENDING |
| 60336 | GLAZED FLOOR TILES | 60x60 | 45 | MEDIUM | Same sampled pixel fingerprint as 60333 | PENDING |
| 60533 | RUSTIC FLOOR TILES | 60x60 | 52 | LOW | Possible blank/near-empty image (mean sample) | PENDING |
| 60536 | RUSTIC FLOOR TILES | 60x60 | 52 | LOW | Possible blank/near-empty image (mean sample) | PENDING |

---

## Decisions file

`api/imports/catalogue/crop-human-review-decisions.json`

## Source manifest

`api/imports/catalogue/catalogue-crop-manifest.json` (unchanged)

## Database safety

| Check | Result |
|-------|--------|
| New products | 0 |
| New categories | 0 |
| New subcategories | 0 |
| ProductImage records | 0 |
| Prisma migrations | 0 |
| Database seed changes | 0 |
