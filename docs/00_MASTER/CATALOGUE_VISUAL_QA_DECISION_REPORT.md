# AWOH-B Catalogue Visual QA Decision Report

**Status:** READY FOR HUMAN APPROVAL  
**Finalized:** 2026-09-27  
**CATALOGUE IMPORT STATUS: PENDING HUMAN APPROVAL**

---

## 1. Scope

| Item | Value |
|------|-------|
| Source PDF | `api/imports/catalogue/AWOH-B-TILE-CATALOGUE.pdf` |
| Total catalogue SKUs (dry-run) | 575 |
| Targeted QA population | 38 unique SKUs |
| Exact targeted population | **38** |
| Purpose | Final visual QA classification before any catalogue import |
| Database / import changes | **None performed** |

Evidence reviewed:
- Contact sheets under `api/imports/catalogue/crop-previews/human-review/`
- Individual crop files where needed (recovered blanks, duplicate pairs, suffixes, LOW samples)
- Pixel-variance measurement for recovered SKUs and duplicate pairs
- `catalogue-crop-manifest.json` / `crop-human-review-decisions.json`

---

## 2. Final Decision Summary

```
APPROVE: 36
REQUIRES_RECROP: 2
REJECT: 0

TOTAL: 38
```

---

## 3. Complete SKU Decision Table

| # | SKU | Category | Size | Source Page | QA Group | Decision | Reason | Notes |
|---|-----|----------|------|-------------|----------|----------|--------|-------|
| 1 | 12118 | SUPER POLISHED FLOOR TILES | 120x60 | 65 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 2 | 12156 | SUPER POLISHED FLOOR TILES | 120x60 | 68 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 3 | 12159 | SUPER POLISHED FLOOR TILES | 120x60 | 69 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 4 | 12501 | PORCELAIN RUSTIC FLOOR TILES | 120x60 | 72 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 5 | 25138 | WALL TILES | 25x40 | 26 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 6 | 36305 | WALL TILES | 30x60 | 31 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 7 | 36327 | WALL TILES | 30x60 | 32 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 8 | 36345 | WALL TILES | 30x60 | 33 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 9 | 36348 | WALL TILES | 30x60 | 34 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 10 | 36359A | WALL TILES | 30x60 | 35 | MEDIUM+SUFFIX | APPROVE | Distinct suffix SKU product image; crop usable; keep separate. | Keep separate suffix product |
| 11 | 36359B | WALL TILES | 30x60 | 35 | MEDIUM+SUFFIX | APPROVE | Distinct suffix SKU product image; crop usable; keep separate. | Keep separate suffix product |
| 12 | 36360A | WALL TILES | 30x60 | 35 | MEDIUM+SUFFIX | APPROVE | Distinct suffix SKU product image; crop usable; keep separate. | Keep separate suffix product |
| 13 | 36360B | WALL TILES | 30x60 | 35 | MEDIUM+SUFFIX | APPROVE | Distinct suffix SKU product image; crop usable; keep separate. | Keep separate suffix product |
| 14 | 36360C | WALL TILES | 30x60 | 35 | MEDIUM+SUFFIX | APPROVE | Distinct suffix SKU product image; crop usable; keep separate. | Keep separate suffix product |
| 15 | 36361A | WALL TILES | 30x60 | 35 | MEDIUM+SUFFIX | APPROVE | Distinct suffix SKU product image; crop usable; keep separate. | Keep separate suffix product |
| 16 | 36361B | WALL TILES | 30x60 | 35 | MEDIUM+SUFFIX | APPROVE | Distinct suffix SKU product image; crop usable; keep separate. | Keep separate suffix product |
| 17 | 36363 | WALL TILES | 30x60 | 36 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 18 | 36515 | RUSTIC FLOOR TILES | 30x60 | 38 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 19 | 40300 | GLAZED FLOOR TILES | 40x40 | 15 | MEDIUM+RECOVERED | REQUIRES_RECROP | Pixel-variance range 0 / blank crop (uniform fill). REQUIRES_RECROP. |  |
| 20 | 40301 | GLAZED FLOOR TILES | 40x40 | 15 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 21 | 40339 | GLAZED FLOOR TILES | 40x40 | 17 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 22 | 40509 | RUSTIC FLOOR TILES | 40x40 | 9 | POSSIBLE_DUPLICATE | APPROVE | Usable product crop; KEEP_SEPARATE from pair partner despite identical/similar pixels. | KEEP_SEPARATE |
| 23 | 40510 | RUSTIC FLOOR TILES | 40x40 | 9 | MEDIUM+POSSIBLE_DUPLICATE | APPROVE | Usable product crop; KEEP_SEPARATE from pair partner despite identical/similar pixels. | KEEP_SEPARATE |
| 24 | 40514 | RUSTIC FLOOR TILES | 40x40 | 9 | MEDIUM | APPROVE | Clear product crop; framing acceptable despite loose spatial-match flag. |  |
| 25 | 40517 | RUSTIC FLOOR TILES | 40x40 | 9 | MEDIUM | APPROVE | Clear product crop; framing acceptable despite loose spatial-match flag. |  |
| 26 | 60100 | SUPER POLISHED FLOOR TILES | 60x60 | 54 | MEDIUM+RECOVERED | REQUIRES_RECROP | Pixel-variance range 0 / blank crop (uniform fill). REQUIRES_RECROP. |  |
| 27 | 60105 | SUPER POLISHED FLOOR TILES | 60x60 | 54 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 28 | 60117 | SUPER POLISHED FLOOR TILES | 60x60 | 55 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 29 | 60122 | SUPER POLISHED FLOOR TILES | 60x60 | 55 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 30 | 60136 | SUPER POLISHED FLOOR TILES | 60x60 | 56 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 31 | 60139 | SUPER POLISHED FLOOR TILES | 60x60 | 56 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 32 | 60305 | GLAZED FLOOR TILES | 60x60 | 42 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 33 | 60325 | GLAZED FLOOR TILES | 60x60 | 44 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 34 | 60330 | GLAZED FLOOR TILES | 60x60 | 44 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 35 | 60333 | GLAZED FLOOR TILES | 60x60 | 45 | POSSIBLE_DUPLICATE | APPROVE | Usable product crop; KEEP_SEPARATE from pair partner despite identical/similar pixels. | KEEP_SEPARATE |
| 36 | 60336 | GLAZED FLOOR TILES | 60x60 | 45 | MEDIUM+POSSIBLE_DUPLICATE | APPROVE | Usable product crop; KEEP_SEPARATE from pair partner despite identical/similar pixels. | KEEP_SEPARATE |
| 37 | 60533 | RUSTIC FLOOR TILES | 60x60 | 52 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |
| 38 | 60536 | RUSTIC FLOOR TILES | 60x60 | 52 | LOW | APPROVE | Sparse white/cream marble product visible; near-blank auto-flag only; crop usable. |  |

---

## 4. Mandatory Fixed Decisions

| SKU / Pair | Decision | Reason |
|------------|----------|--------|
| **40300** | REQUIRES_RECROP | Pixel-variance range **0** / blank crop |
| **60100** | REQUIRES_RECROP | Pixel-variance range **0** / blank crop |
| **40509** | APPROVE / KEEP_SEPARATE | Usable crop; do not merge with 40510 |
| **40510** | APPROVE / KEEP_SEPARATE | Usable crop; do not merge with 40509 |
| **60333** | APPROVE / KEEP_SEPARATE | Usable crop; do not merge with 60336 |
| **60336** | APPROVE / KEEP_SEPARATE | Usable crop; do not merge with 60333 |

No independent visual defect found on the four duplicate-pair SKUs beyond shared catalogue artwork. Relationship remains **KEEP_SEPARATE**.

---

## 5. Suffix SKU Review

| SKU | Decision | Notes |
|-----|----------|-------|
| 36359A | APPROVE | Independent suffix product; crop usable |
| 36359B | APPROVE | Independent suffix product; crop usable |
| 36360A | APPROVE | Independent suffix product; crop usable |
| 36360B | APPROVE | Independent suffix product; crop usable |
| 36360C | APPROVE | Independent suffix product; crop usable |
| 36361A | APPROVE | Independent suffix product; crop usable |
| 36361B | APPROVE | Independent suffix product; crop usable |

All seven remain separate catalogue products (not collapsed to 36359 / 36360 / 36361).

---

## 6. Recrop Queue

| SKU | Source Page | Reason | Expected recovery action |
|-----|------------:|--------|--------------------------|
| 40300 | 15 | Pixel-variance range 0 / blank crop (uniform fill). REQUIRES_RECROP. | Re-extract from PDF page 15; verify non-blank; re-QA |
| 60100 | 54 | Pixel-variance range 0 / blank crop (uniform fill). REQUIRES_RECROP. | Re-extract from PDF page 54; verify non-blank; re-QA |

---

## 7. Rejected Queue

REJECT: **0**

No SKUs classified REJECT.

---

## 8. Duplicate/Similarity Findings

| Pair | Relationship | Decision |
|------|--------------|----------|
| 40509 / 40510 | **KEEP_SEPARATE** | Both APPROVE |
| 60333 / 60336 | **KEEP_SEPARATE** | Both APPROVE |

Pixel fingerprints may match, but catalogue SKU identity is authoritative. Visual similarity does **not** merge products.

---

## 9. QA Limitations

| Evidence type | What was used |
|---------------|---------------|
| Visual evidence | Six targeted contact sheets + full-resolution crops for blanks/duplicates/suffixes/sample LOWs |
| Automated evidence | Prior cropConfidence flags; pixel-variance script confirming blanks (40300/60100) and identical stats for dup pairs |
| Source-PDF evidence | Page/SKU association from dry-run + crop manifests; blank recrops deferred (not re-extracted in this pass) |
| Classification judgment | Final APPROVE / REQUIRES_RECROP / REJECT per stated rules |

Limitations:
- This pass did **not** re-render PDF pages for non-targeted SKUs (out of scope).
- Blank recovered crops were classified from measured pixel evidence; replacement crops were **not** generated here.
- Duplicate pairs kept separate without merging; import still requires human approval.

---

## 10. Import Readiness

**CATALOGUE IMPORT STATUS: PENDING HUMAN APPROVAL**

The final report must be reviewed and approved before import.

Do **not** begin import. Do **not** start Stage 10. Do **not** create products or ProductImage records.

Gate remaining before import eligibility:
1. Human approval of this 38-SKU decision report
2. Successful recrop + re-QA of `40300` and `60100`

---

## Safety confirmation

| Check | Result |
|-------|--------|
| Database changes | 0 |
| Prisma migrations | 0 |
| Seed changes | 0 |
| Original crop files overwritten | No |
| Catalogue import | Not started |
| Taxonomy changes | None |
