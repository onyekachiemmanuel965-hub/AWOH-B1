# AWOH-B Design System — Stage 02

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Primary experience:** Premium light theme (no dark mode in Stage 02)

> Visual identity is independent of AO Solid Base.

Live showcase: `/design-system` in the `web` Next.js app.

---

## Brand feeling

Quality, elegance, architectural sophistication, trust, modern luxury, timeless restraint.

Audience: homeowners, architects, interior designers, contractors, developers.

---

## Color tokens (locked)

| Token | Hex | Role |
|-------|-----|------|
| Primary (Midnight Navy) | `#101A2B` | Brand chrome, headings, primary buttons |
| Primary hover | `#1A2740` | Hover |
| Primary active | `#0C1420` | Active |
| Accent (Champagne Gold) | `#C8A96B` | Sparse accent, focus, eyebrow labels |
| Accent hover | `#B89755` | Accent hover |
| Background (Warm Ivory) | `#F7F3EA` | Page canvas |
| Surface | `#FFFCF7` | Cards / elevated surfaces |
| Surface muted (Soft Sand) | `#E7DED0` | Secondary sections |
| Border | `#D9D0C2` | Hairline borders |
| Text (Deep Graphite) | `#1E2228` | Body text |
| Text muted | `#5C6570` | Secondary text (accessible contrast on ivory) |
| Success / Warning / Error / Info | semantic greens/ambers/reds/blues | Status only |

Gold is an **accent**, not a fill color for large surfaces.

CSS variables live in `web/src/app/globals.css`.

---

## Typography

| Role | Family | Notes |
|------|--------|-------|
| Display / headings | **Cormorant Garamond** | Editorial, architectural serif |
| Body / UI | **Manrope** | Modern sans for nav, forms, buttons, product info |

Hierarchy utilities: `.type-display`, `.type-h1`–`.type-h4`, `.type-body-lg`, `.type-body`, `.type-body-sm`, `.type-caption`, `.type-label`, `.type-button`.

Loaded via `next/font/google` in `layout.tsx` (no extra font packages).

---

## Spacing

4px base scale: `--space-1` (4px) through `--space-24` (96px). Use Tailwind spacing aligned to this rhythm (`gap-2`, `p-4`, `py-12`, etc.).

---

## Radius & shadow

- Radius: `sm` 2px, `md` 4px, `lg` 6px — restrained, architectural
- Shadows: `xs` / `sm` / `md` — subtle only

---

## Motion

- Durations: fast 150ms, base 220ms, slow 320ms
- Utilities: `.motion-fade-in`, `.motion-slide-up`, `.hover-lift`
- `prefers-reduced-motion` respected globally

---

## Component map

| Area | Path |
|------|------|
| UI | `web/src/components/ui/` |
| Layout | `web/src/components/layout/` |
| Navigation | `web/src/components/navigation/` |
| Product | `web/src/components/product/` |
| Feedback | `web/src/components/feedback/` |

---

## Placeholders

- Logo / favicon / OG: `web/public/placeholders/`
- Contact / business data: `[PLACEHOLDER]` in footer — never invented

---

## Dark mode

Deferred as a future enhancement. Primary AWOH-B experience is the light ivory theme.

---

## Out of Stage 02 scope

Homepage marketing composition, catalog, checkout, auth, admin, Paystack, delivery logic — Stage 03+.
