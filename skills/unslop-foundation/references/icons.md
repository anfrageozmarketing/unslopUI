# Icons

Goal: icons that people recognise at once, that carry one consistent weight, and that suit the product.

## Choose the source on purpose

| Source | Use when | Notes |
|---|---|---|
| **A licensed library** (for example Phosphor, MIT, with Bold and Duotone weights) | Default for apps. Familiar metaphors, complete coverage, consistent weight | Pick one library and one weight for the whole product. Record the licence in `design/CREDITS.md`. A thin-stroke default (the most common AI-site look) is a tell: choose the weight deliberately, bold or duotone for a confident product |
| **Own set** | The product has its own objects that no library draws well (a route, a constellation) | 3-5 signature icons own-drawn, the rest from the library, in the same weight |

If people say they do not like the icons, switch the source instead of tweaking: drawn sets are the riskiest to get right.

## Own drawing spec (when you draw)

Goal: a small set (20-40 icons) that is recognisably yours, bold and friendly, readable at 16 px and striking at 48 px.

## Spec (write the project's values into `design/icons.md`)

- **Grid:** 24 x 24, 2 px safe margin. Optical balance beats mathematical centring.
- **Stroke:** one weight for the whole set, 2.5-3 px at 24 px. Round caps and joins. No thin details inside.
- **Corner logic:** one radius family (for example 2, 4, 6). Rectangles share the same corner radius.
- **Fill logic, pick one and keep it:**
  - *Bold line*: stroke only.
  - *Duotone*: stroke plus one offset filled shape in `--accent-soft` (shifted 2 px, as if printed slightly off). This is the "designer" look.
  - *Solid with cut-outs*: filled silhouette with transparent knock-outs.
- **Colour:** `currentColor` for the stroke, one token for the soft fill. Never hard-coded hex.
- **Metaphors from the product's world**, not generic office icons: a route for flows, a key for access, a flag for onboarding. Draw 3-5 signature icons first, then the utility ones.
- **One idea per icon.** If it needs a caption to be understood, simplify it.

## Where icons go

Structure: areas, tabs, primary actions, empty states. Not on every row, not next to every label. One icon per decision the user makes.

## Build and check

- Hand-write the SVGs as path data in one `icon(name)` function (inline SVG, no network).
- Make a sheet with every icon at 16, 24 and 48 px, light and dark. Squint test: do all icons weigh the same?
- Accessibility: decorative icons `aria-hidden="true"`; icon-only buttons carry an `aria-label`.
- Do not trace or lightly modify third-party icons (see `inspiration.md`).
