# AWOH-B Catalogue Recrop Validation — 40300 and 60100

**RECROP VALIDATION STATUS: READY FOR HUMAN REVIEW**  
**Generated:** 2026-09-27

---

## 1. Scope

This validation covers ONLY:

- `40300`
- `60100`

No catalogue import was performed.

---

## 2. Previous QA Result

| SKU | Previous | Reason |
|-----|----------|--------|
| 40300 | REQUIRES_RECROP | previous crop pixel range = **0** |
| 60100 | REQUIRES_RECROP | previous crop pixel range = **0** |

Blank originals preserved as `*.blank-backup.jpg`.

---

## 3. Replacement Crop Details

### 40300

| Field | Value |
|-------|-------|
| SKU | 40300 |
| Source PDF page | 15 (catalogue printed page 11) |
| Replacement crop path | `crop-previews/40x40/glazed-floor-tiles/40300.jpg` |
| Image dimensions | 459×459 |
| Pixel range | **1** (prev 0) |
| Distinct grey levels | 2 |
| Visual validation | FAIL — solid light-grey fill; no tile texture |
| SKU association | PASS — label `40300` directly under top-left grid cell on rendered page |
| Method | `pdftoppm` @ 300 DPI + PDF region crop (embedded XObject is blank indexed placeholder) |
| Final decision | **REQUIRES_RECROP** |

### 60100

| Field | Value |
|-------|-------|
| SKU | 60100 |
| Source PDF page | 54 (catalogue printed page 60) |
| Replacement crop path | `crop-previews/60x60/super-polished-floor-tiles/60100.jpg` |
| Image dimensions | 576×576 |
| Pixel range | **1** (prev 0) |
| Distinct grey levels | 2 |
| Visual validation | FAIL — solid light-grey fill; no tile texture |
| SKU association | PASS — label `60100` directly under top-left grid cell on rendered page |
| Method | `pdftoppm` @ 300 DPI + PDF region crop (embedded XObject is blank indexed placeholder) |
| Final decision | **REQUIRES_RECROP** |

---

## 4. Validation Results

| SKU | Decision |
|-----|----------|
| 40300 | **REQUIRES_RECROP** |
| 60100 | **REQUIRES_RECROP** |

### Why not APPROVE

Source-PDF evidence (`pdfimages -list`):

- Page 15 slot for 40300 → indexed image **~413 bytes** (blank placeholder)
- Page 54 slot for 60100 → indexed image **~638 bytes** (blank placeholder)
- Sibling products on the same pages are real CMYK JPEGs with high pixel variance

Page-render crops at the correct SKU locations still show **solid light grey** faces (range 1/1 from JPEG quantization only). That does **not** meet the non-blank / actual-image-information bar for APPROVE.

pdf.js page.render crashes (native access violation) on these pages; Poppler `pdftoppm` was used instead.

---

## 5. Scope Protection

| Check | Result |
|-------|--------|
| Other SKU decisions changed | **0** |
| Catalogue products imported | **0** |
| Database changes | **0** |
| Prisma migrations | **0** |
| Taxonomy changes | **0** |

---

## 6. Final Status

**RECROP VALIDATION STATUS: READY FOR HUMAN REVIEW**

Do **not** authorize catalogue import automatically.

Updated targeted totals:

```
APPROVE: 36
REQUIRES_RECROP: 2
REJECT: 0
TOTAL: 38
```

Human may later decide whether the solid-grey catalogue face is acceptable as product art, or whether external photography is required.
