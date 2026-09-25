# AWOH-B Design System — Stage 02

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Implementation:** `web/` Next.js app  
**Showcase:** `/design-system`

See also: `web/docs/DESIGN_SYSTEM.md` (same content for engineers working in `web/`).

> Visual identity is independent of AO Solid Base.

---

## Brand feeling

Quality, elegance, architectural sophistication, trust, modern luxury, timeless restraint.

---

## Locked color tokens

| Token | Hex |
|-------|-----|
| Primary | `#101A2B` |
| Accent | `#C8A96B` |
| Background | `#F7F3EA` |
| Soft Sand | `#E7DED0` |
| Text | `#1E2228` |
| Muted text | `#5C6570` |

Semantic tokens: primary/hover/active, accent, background, surface, surface-muted, border, text, text-muted, success, warning, error, info, focus.

Gold is accent-only — not a dominant fill.

---

## Typography

- **Display:** Cormorant Garamond (serif)
- **UI/Body:** Manrope (sans)

Utilities: display, h1–h4, body-lg, body, body-sm, caption, label, button.

---

## Spacing / radius / shadow / motion

- Spacing: 4px base scale via CSS variables + Tailwind
- Radius: 2–6px (restrained)
- Shadows: subtle xs/sm/md
- Motion: fast/base/slow; respects `prefers-reduced-motion`
- Dark mode: deferred

---

## Components delivered

Buttons, inputs, select, textarea, checkbox, radio, switch, search, quantity, badges, card, product-card foundation, header/footer foundations, modal, toast, alert, skeleton, loading, empty/error, layout primitives, brand mark placeholder.

---

## Stage boundary

Stage 03 homepage and later commerce features are **not** implemented.
