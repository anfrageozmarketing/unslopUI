---
name: unslop-build
description: Builds an app's flows, UI elements and screens on HeroUI, Tailwind and shadcn patterns from a spec that is defined first - colours, typography, spacing, control sizes, radii. Takes the classic flow, element and screen catalogs, maps each to components and compositions, and ends in a gate. Use when the user wants an app, screen set, component set or redesign built (not only audited), or says "build the screens", "create the UI elements", "make crazy screens".
---

# unslop-build

Audit skills find what is wrong. This skill **builds**. The rule that makes the result look designed: **everything is defined before anything is drawn**, and every component and screen uses only those definitions.

## Order (no skipping)

0. **Discovery**: ask what the app or feature must do (`references/discovery.md`, at most eight questions, including where the account area lives), then `node scripts/scope.mjs brief.json --out design/SCOPE.md` decides which flows, screens, UI elements and design-system settings are in. The user confirms the scope before anything is built.
1. **Define the spec** (nothing built yet)
   - Colours: `unslop-foundation/scripts/palette.mjs` writes `tokens.css` (checked contrast, light and dark).
   - Sizes: `node scripts/spec.mjs --out design --base 4 --ratio 1.2 --density comfortable --font "<font>"` writes `spec.css` (Tailwind v4 `@theme` + HeroUI variable mapping), `SPEC.md`, `spec.json`: spacing multiples, type scale, control heights, radii, breakpoints, 44 px tap target.
   - Typography: choose the font from the brief (`unslop-foundation`), sans-serif, 4 sizes per screen at most, weight carries hierarchy.
   - Record both in `design/DESIGN.md`. Import `tokens.css` and `spec.css` once in the app's global CSS. No hex, no ad-hoc px in components.
2. **Flows**: `unslop-flows` with `unslop-flows/references/classic-flows.md`. Output: the list of flows that fit, each as a mermaid diagram with its screens.
3. **Elements** (read `references/pitfalls.md` first): pick from `unslop-components/references/classic-elements.md`, map to the stack with `references/element-map.md` (HeroUI component first, shadcn pattern when HeroUI has none, own part only for the signature component). Build each once with all states; show them on a component sheet before screens.
4. **Screens** (read `references/pitfalls.md` first, it lists the defects to avoid from the start): for every screen of every flow take its type from `unslop-structure/references/classic-screens.md` and its composition from `references/screen-recipes.md`. Give each screen one primary action and one signature idea (see "crazy screens" below).
5. **Simplify** (`unslop-simplify`): run the element test on every screen, remove what does not earn its place.
6. **Gate** (`references/gate.md`): run before reporting done; fix, then re-check. Verify rendering and functions with `unslop-verify` (screenshots, measurements, click-path scenarios).

## Stack rules

- HeroUI components first, styled through its CSS variables (mapped in `spec.css`), Tailwind utilities for layout. shadcn patterns only where HeroUI lacks the part (command palette, data table, resizable panels). One system, not both for the same job.
- Utility classes use the spacing scale (`p-3`, `gap-4`), the type tokens (`text-sm`) and colour roles (`bg-surface`, `text-ink-muted`). Arbitrary values (`p-[13px]`, `text-[#444]`) are defects.
- No borders as separators: tone and space instead (`--border-width: 0`).
- Cursor pointer on every interactive element (set in `spec.css`), focus ring visible, reduced motion respected.
- Language of the UI is fixed once (Du/Sie, see `unslop-copy`); text short, no invented facts.

## Crazy screens (distinct, still usable)

A screen is memorable through **one** idea, not decoration on everything. Choose one per screen from the product's own data:

- **Data as picture:** progress as a path, status as a landscape, choices as side-by-side cards, parts of a whole as regions.
- **Layered background:** five to seven real objects (flows, files, people) floating behind the main one at low contrast.
- **Inversion:** the most important element flips tone.
- **Oversized type or number:** one value at display size, everything else quiet.
- **Spatial layout:** canvas, board or timeline instead of a list.
- **Motion with meaning:** one animation that shows cause and effect.

Limits: one idea per screen, tokens only, contrast checked, the plain version must still work at 360 px and with reduced motion. Imitating a named product's screen is not an idea.

## Output of a run

- `design/` with tokens, spec, DESIGN.md and the component sheet
- the flows (mermaid) per app, screens per flow, one note per screen with its type, primary action and signature idea
- built components and screens in the project's code
- the gate result with what was not checked

## References

- `references/discovery.md` - the questions and how they decide the scope
- `scripts/scope.mjs` - brief to SCOPE.md (flows, screens, elements, design settings)
- `scripts/spec.mjs` - size spec generator
- `references/element-map.md` - classic element to HeroUI / shadcn / Tailwind
- `references/screen-recipes.md` - classic screen type to composition
- `references/spacing.md` - spacing rules: nothing at the edge, distances by relationship, rhythm
- `references/pitfalls.md` - known defects to avoid while building
- `references/gate.md` - checks before done
