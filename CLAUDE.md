# Cloth & Chalk — Project Instructions

## Tailoring Reference

The `tailoring/` folder contains pattern-making formulas and construction rules sourced from books and the user's own practice. **Always read the relevant file before editing any calculation logic.**

- [tailoring/sleeves.md](tailoring/sleeves.md) — cap height, ease, two-piece sleeve construction
- [tailoring/trousers.md](tailoring/trousers.md) — rise, seat, leg opening, waistband
- [tailoring/jacket-body.md](tailoring/jacket-body.md) — armhole, chest ease, shoulder, back/front balance
- [tailoring/shirt.md](tailoring/shirt.md) — yoke, collar, sleeve placket, ease

## Codebase

- Web calculator: `index.html` (single file, deployed to Vercel from `main`)
- Mobile app: `mobile/` (Expo SDK 56, React Native)
- Shared calculation engine: `mobile/shared/calculations/layout.ts` (used by mobile; web has equivalent logic inline in `index.html` — keep them in sync)
