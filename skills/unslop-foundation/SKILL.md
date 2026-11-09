---
name: unslop-foundation
description: Creates the design foundation before any screen is built - a contrast-checked UI palette (generated from one seed colour), type, bold icon style, illustration system, motion language and a Behance/Dribbble-grade quality bar - and a component sheet to approve first. Uses sites like Streamline, Magic UI, Coolors and Pixels Market as inspiration for principles only, never copies assets. Use at the start of any UI build or redesign, before unslop-components, or when an app looks generic and needs its own visual identity.
---

# unslop-foundation

Generic apps look generic because they start from components. Designers start from a **foundation**: palette, type, icon style, illustration system, motion. Then components, then screens. This skill creates that foundation first, so everything after it looks like one author made it.

## Order (do not skip ahead)

1. **Brief** (5 lines): who uses it, the one feeling to evoke (calm, sharp, playful, serious), the product's world (what objects and metaphors belong to it), constraints (brand colour, dark mode, languages).
2. **Palette**: `node scripts/palette.mjs --seed "<hex>" --mood calm|bold|warm|cool --out design/`. Writes `tokens.css`, `palette.json`, `PALETTE.md` (all contrast checks) and `preview.html`. Pick the seed from the brief, not from habit. Exit code 1 means a contrast check failed: change the seed or mood, do not ship it.
3. **Type, icons, illustration, motion**: define each in one short page under `design/`, following `references/icons.md`, `references/illustration.md`, `references/motion.md`. Sans-serif only unless the brief asks otherwise.
4. **Component sheet**: build `design/components.html` (one self-contained page, light and dark) with the product's core components in all states. This is the Dribbble shot: review it before touching a screen. Standard in `references/designer-standard.md`.
5. **Screens** come last (`unslop-components`, `unslop-visual`), built only from tokens and sheet components.

## Inspiration, not imitation

Look at strong work to learn **principles**: how a bold icon set keeps one stroke weight and rounded silhouettes, how spot illustrations stay inside a tiny palette, how animated components use one clear motion idea each, how a palette tool pairs a neutral ramp with one accent. Then make your own.

- Never copy an asset, a code snippet, a layout or a page's text. Never trace an icon or illustration. Never ship a third-party asset in the public skill pack.
- If a product does use a third-party asset, follow its licence and record it in `design/CREDITS.md` (name, source URL, licence, where used). Licence facts and sources are in `references/inspiration.md`; terms change, so check the site.
- Test for imitation: if a person who knows the source would say "that is the X set", redraw it.

## Rules

- One accent, one spark. Everything else is neutral. `spark` is for illustration and motion highlights, not for text.
- Tokens only: no hex, no ad-hoc spacing, radius or duration in components.
- Icons, illustrations and animations carry meaning (state, place, progress). Decoration without information is cut.
- Glass is one deliberate layer over real imagery (see `unslop-visual`), never a base style.
- Every animation respects `prefers-reduced-motion`.
- Say plainly what you could not look at. Screenshots are taken by a browser tool (see `unslop-ui`), judged by the designing agent, not by the capture session.

## Files

- `scripts/palette.mjs` - palette generator (OKLCH, WCAG checks, no dependencies)
- `references/inspiration.md` - sources, what to learn from each, licence facts
- `references/icons.md` - bold icon style spec and how to draw your own set
- `references/illustration.md` - spot illustration and generative image system
- `references/motion.md` - motion tokens and a small pattern library
- `references/designer-standard.md` - the quality bar and the component sheet
