---
name: unslop-visual
description: Final-layer visual pass for AI-looking UI - tokens for space, color and type, quiet chrome, one deliberate focal element, real icons, mobile layout, reduced motion. Gate checklist that runs after structure, states and copy are done. Use when the screen shows glows, purple gradients, gradient text, glass cards, uppercase tracked labels or uneven spacing.
---

# unslop-visual

Visual craft comes last: a polished shell around a missing login is still slop. For a full visual redesign workflow, the separate `unslop` skill by Damir Sokolovsky (CC BY 4.0, heydamir.design/unslop) goes deeper; this skill is the checklist and gate, not a copy of it.

## Order of work

1. **Space.** One scale (4/8/12/16/24/32/48). Replace ad-hoc values. Group by proximity before adding borders.
2. **Color.** Tinted neutrals plus one accent. State colors (success, warning, danger) only for state. Check contrast ≥ 4.5:1 for text.
3. **Type.** Two families at most, a modular scale, line length 55-75 characters, tabular numbers in tables.
4. **Icons.** One set, one stroke weight, no emoji as icons.
5. **Chrome.** Remove glows, blurred blobs, gradient text, stacked shadows, pulse animations, glass-on-glass. Borders 1px, radius from a short scale.
6. **Focal element.** One thing per screen carries richness (a real chart, an object, a product image). Everything else stays quiet.
7. **Layout.** Align to a grid, consistent page padding, 16px side gutter on phones, no horizontal scroll at 360px.
8. **Motion.** Only motion that explains change (enter, reorder, progress). Honor `prefers-reduced-motion`.
9. **Tokens.** Put every decision above into CSS variables or the theme file so the next screen inherits it.

## Gate (all must be true)

- No gradient text, no emoji labels, no "New ✨" badges.
- Spacing, radius and font sizes come from tokens only.
- Contrast passes; focus states are visible; tap targets ≥ 44px.
- Phone (360px) and desktop (1280px) screenshots both look intentional.
- Dark mode, if offered, is designed, not inverted.
