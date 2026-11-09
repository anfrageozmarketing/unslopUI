---
name: Command Center design contract
seed: "#1f5c4d"
mood: calm
modes:
  - light
  - dark
tokens: tokens.css
generated-by: unslop-foundation/scripts/palette.mjs
---

# Command Center design contract

Read this file before building or changing any UI of Command Center. It is the visual contract for people and coding agents. `tokens.css` is the source of truth; if this file and `tokens.css` disagree, follow `tokens.css`.

## Setup

Import `tokens.css` once, at the top of the stylesheet. Light is the default. Dark follows the system (`prefers-color-scheme`) unless `data-theme="light"` or `data-theme="dark"` is set on `<html>`.

```css
@import "./tokens.css";
body { background: var(--bg); color: var(--ink); font-family: var(--font-sans); }
```

## Design direction

- Mood: calm. Fill in the product's one-line feeling and its world (objects, metaphors) here when the brief is written.
- One accent (`--accent`) for primary actions and focus. One spark (`--spark`) for illustration and motion highlights. Everything else is neutral.
- Hierarchy comes from content order, spacing, type weight and surface level before borders, shadows or colour.
- Status colours (`--ok`, `--warn`, `--bad`, `--info`) carry meaning only, always with a shape or label, never colour alone.
- Read first, edit one step deeper. Prefer direct manipulation over dropdowns and form grids.

## Colors

Use the role tokens, never raw hex. Both modes use the same token names; CSS resolves the value. Do not branch component code by theme.

| Purpose | Token | Light | Dark |
| --- | --- | --- | --- |
| Page background | `--bg` | `#eef5f3` | `#101513` |
| App shell: rail and context column | `--shell` | `#dfe9e5` | `#050a08` |
| Cards and raised containers | `--surface` | `#f9fefc` | `#191d1b` |
| The working window inside the shell | `--window` | `#f9fefc` | `#191d1b` |
| Nested or lower-emphasis regions | `--surface-2` | `#e4ece9` | `#222826` |
| Borders and quiet dividers | `--line` | `#cfd6d4` | `#333a37` |
| Primary text | `--ink` | `#222826` | `#d8e0dd` |
| Supporting text and secondary icons | `--ink-muted` | `#5b6260` | `#9fa6a4` |
| Fills: primary actions, selected states, focus | `--accent` | `#2c6053` | `#7cb1a1` |
| Accent used as text or thin lines | `--accent-text` | `#275b4d` | `#548879` |
| Text and icons on an accent fill | `--on-accent` | `#ffffff` | `#101513` |
| Soft accent backgrounds, hover and selected rows | `--accent-soft` | `#daede7` | `#1c2a26` |
| Illustration and motion highlights only, never text | `--spark` | `#d99b6c` | `#e6a879` |
| Positive outcome (text, marker) | `--ok` | `#007835` | `#5dc879` |
| Background for ok | `--ok-soft` | `#d9f3dd` | `#172c1c` |
| Caution (text, marker) | `--warn` | `#845a00` | `#e1a01d` |
| Background for warn | `--warn-soft` | `#fae9ce` | `#31240e` |
| Error or destructive (text, marker) | `--bad` | `#a83630` | `#ff8579` |
| Background for bad | `--bad-soft` | `#ffe4e0` | `#381f1c` |
| Neutral information (text, marker) | `--info` | `#0068a6` | `#59b6ff` |
| Background for info | `--info-soft` | `#dbeeff` | `#152839` |

Neutral ramp `--n-50` to `--n-950` and accent ramp `--a-50` to `--a-950` exist for illustration and fine tuning. Text pairs are contrast-checked in `PALETTE.md` (ink 7:1, muted and status text 4.5:1).

## Typography

- Sans-serif only: `--font-sans`; mono (`--font-mono`) for code, ids and paths.
- Headings bold to heavy with slightly negative letter spacing; body regular with a comfortable line height; 55-75 characters per line.
- Tabular numbers for counters, scores and aligned numbers. Sentence case. Avoid all-caps labels except for short conventions.

## Layout and spacing

Spacing scale: `--space-1` 4px, `--space-2` 8px, `--space-3` 12px, `--space-4` 16px, `--space-5` 24px, `--space-6` 32px, `--space-7` 48px, `--space-8` 72px. Use only these. Group related things with space before adding lines. Do not double parent and child padding.

## Shapes

`--radius-s` 6px, `--radius-m` 12px, `--radius-l` 20px, `--radius-pill` 999px. Nested surfaces use a visibly smaller radius than their parent.

## Elevation and glass

- `--shadow-1` for raised content, `--shadow-2` for floating layers (menus, popovers, dialogs).
- Glass (`backdrop-filter` blur with a translucent `--surface`) is one deliberate layer over real imagery, never a base style, never glass on glass. Check contrast on the blurred pixels.

## Motion

`--dur-1` 120ms (hover, press), `--dur-2` 220ms (state change), `--dur-3` 420ms (enter, route draw). Easing `--ease-out` for entering, `--ease-in-out` for moving. One motion idea per component. Animate `transform` and `opacity`. Reduced motion sets the durations to 0.

## Icons and illustration

Own bold icon set (24px grid, one stroke weight, round caps), see `icons.md` if present. Illustrations use ink, accent, spark, accent-soft and paper only, see `illustration.md` if present. Never use third-party assets without an entry in `CREDITS.md`.

## Components

Core components and their states live in `components.html` if present. Build new components from tokens and from those parts. Every interactive element has a visible focus ring (2px, accent), a target of at least 44px on touch, and an accessible name.

## Do

- Use tokens for every colour, space, radius and duration.
- Keep one primary action per context.
- Show active, selected, loading, empty, error and disabled states.
- Respect reduced motion; keep keyboard access and visible focus.

## Don't

- Don't hardcode colours, shadows, radii or spacing.
- Don't use colour alone to show state.
- Don't make static content look interactive.
- Don't separate with borders or hairlines: use space and surface tone. No outlined boxes around every group.
- Don't edit through a grid of labelled form fields with a Save button: edit in place (tap a status, click a text, type and Enter), with Undo.
- Don't explain with paragraphs: short labels, empty states with one picture and one verb.
- Don't use rows of KPI cards, uniform card grids, or tables with controls in cells as the main element.
- Don't add serif fonts, gradient text, glow, emoji as icons, or purple-blue mesh backgrounds.

## Source of truth

`tokens.css` (values), `palette.json` (roles and contrast results), `PALETTE.md` (readable table), `preview.html` (swatches).
