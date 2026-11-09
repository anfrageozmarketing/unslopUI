# Design plan (template)

Write this to `design/PLAN.md` before building. Keep it to two pages. Change it deliberately, not on the fly.

## 1. Principles
The product's 3-5 design rules. Always include: components first, no borders as separators, interactive editing instead of forms, little text, one primary action per screen, undo instead of confirm.

## 2. Screens
| Screen | Job (one sentence) | Primary action | Signature component | Reference pattern |
|---|---|---|---|---|

Navigation model (rail, bottom bar, both) and how it behaves on phone.

## 3. Component inventory
| Component | Base (library part or custom) | States | Used on | Edit pattern |
|---|---|---|---|---|

Library parts first (HeroUI, ...), custom only where the product's own idea lives.

## 4. Edit patterns
For every editable value: which pattern from `designer-standard.md`. No Save buttons.

## 5. Content rules
Label length, empty states, tone, language (Du/Sie).

## 6. Build order and checkpoints
1. Tokens and theme (borders off, radius, type)
2. Primitives as a gallery inside the app (`#/_components`), checkpoint: screenshots, review
3. Screens, one by one in the order above, checkpoint after each group
4. Deploy only after a checkpoint is accepted

The browser tool only captures screenshots at checkpoints and reports numbers (overflow, console). The designing agent reviews the pictures and decides.
