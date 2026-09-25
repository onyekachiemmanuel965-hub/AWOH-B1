# Design Direction — Premium UI/UX

**Project:** AWOH-B THE GREAT TILES VENTURE  
**Stage note:** Initial direction in Stage 01. Typography system and component library finalized in **Stage 02**.

> **Do not copy the AO Solid Base visual identity.** AWOH-B must have its own brand system.

---

## 1. Brand feeling

The storefront should feel:

- Premium
- Architectural
- Elegant
- Modern
- Sophisticated
- Trustworthy
- Minimal but visually rich

Inspired by high-end materials showrooms — calm confidence, strong photography, restrained ornament.

---

## 2. Color direction

| Token | Direction | Role |
|-------|-----------|------|
| **Primary** | Deep Midnight Navy | Brand authority, headers, key UI chrome |
| **Accent** | Champagne Gold | Sparse emphasis, CTAs borders/underline accents — not cheap glitter |
| **Background** | Warm Ivory | Page canvas |
| **Secondary** | Soft Sand / muted neutrals | Sections, dividers, subtle surfaces |
| **Text** | Deep Graphite | Body and readable hierarchy |

Exact hex values and typography are locked in Stage 02 — see `DESIGN_SYSTEM.md`.

---

## 3. Visual rules

### Use

- Strong typography hierarchy
- Large high-quality product imagery
- Generous whitespace
- Elegant borders / hairline rules used sparingly
- Refined hover states
- Subtle motion (2–3 intentional motions on marketing surfaces)
- Premium spacing rhythm
- High-quality responsive layouts

### Avoid

- Generic template appearance
- Excessive gradients
- Cheap-looking gold effects / metallic noise
- Excessive shadows
- Overly rounded cards everywhere
- Cluttered interfaces
- Excessive animations
- Visually noisy dashboards
- Default “AI slop” looks (generic purple gradients, cream+terracotta clichés, broadsheet pastiche) — AWOH-B sticks to **navy / champagne / ivory / sand / graphite**

### Cards

Default: no decorative cards. Cards only when they clearly contain interaction. Hero: no cards.

---

## 4. Storefront information architecture (eventual)

- Premium hero
- Brand introduction
- Product categories / subcategories (dynamic CMS hierarchy)
- Featured products
- Catalog, search/filter
- Product detail + gallery
- Cart, checkout
- Customer account / order history / status
- Contact / support (placeholders until provided)
- Footer

Homepage first viewport: brand-forward, one composition — not a dashboard. Hero budget: brand, one headline, one short supporting sentence, one CTA group, one dominant visual plane.

---

## 5. Admin UX direction

- Practical and fast
- Clear tables/forms
- Same brand tokens with denser layout
- No ornamental clutter
- Internal fields clearly separated from customer preview concepts

---

## 6. Responsive & mobile

Must work properly on:

- Mobile
- Tablet
- Laptop
- Desktop
- Large desktop

Mobile is first-class: touch targets, readable type, non-hover-dependent primary actions, performant images.

---

## 7. Accessibility baseline

- Keyboard access for primary flows
- Adequate contrast for text on ivory/navy
- Visible focus states (refined, not default browser ugly-only)
- Meaningful alt text for product images

Validated more thoroughly in Stages 02 and 09.

---

## 8. Motion

- Subtle, purposeful
- Prefer entrance/hierarchy cues over continuous decoration
- Respect reduced-motion preferences

---

## 9. PWA-ready

Where practical (Stage 09): installability/manifest/offline shell for browse — not a blocker for core commerce correctness.

---

## 10. Stage 02 handoff

Stage 02 must produce:

- Locked color tokens (hex/CSS variables)
- Typography scale and font choices (expressive, non-default stacks)
- Spacing scale
- Component primitives (button, input, nav, etc.)
- Storefront and admin layout shells
- Asset requirements list for logo/photography still marked placeholder until client delivers
