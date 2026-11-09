# Inspiration sources (principles only)

Checked 2026-11-09 from the sites' public pages. Terms change: verify before relying on this. **Nothing from these sources is shipped in this repository.**

| Source | What it is | Learn this (principle) | Licence facts that matter |
|---|---|---|---|
| Streamline "Ultimate Bold" free icons (streamlinehq.com/icons/ultimate-bold-free) | About 1,000 bold, rounded icons on a 24 px grid, single colour with transparent cut-outs | One stroke weight and one corner logic across the whole set; cut-outs instead of outlines for punch; usage note ("used for ...") next to every icon; pair heavy icons with a suitable text weight | CC BY 4.0, attribution required (credit Streamline plus link), commercial use allowed, per-project limit about 50 icons, may not be turned into a user-facing asset library |
| Streamline free illustrations (streamlinehq.com/illustrations/free) | About 350 spot illustrations in themed families and sets | Themed sets that share a drawing system; one drawing can be reskinned (colour, duotone, line) by swapping a palette | Free licence: attribution required, per-project limit about 25 illustrations, some sets are CC BY and others are not open source: check the set |
| Magic UI (magicui.design) | 150+ free, open-source animated React/Tailwind components, plus paid templates | Each component has exactly one motion idea (a beam, a ticker, a marquee, a shimmer); motion explains or rewards, it is not ambient noise; components are copy-paste, so identity must come from your tokens | Open source per its homepage, licence not stated there: read the repository before copying code. Treat it as reference, write your own |
| Pixels Market (pixels.market) | Marketplace for illustration and icon packs, colours adjustable in the browser | Categories led by a cover image; colour recolouring as a feature: one drawing, many palettes | Free items are personal, non-commercial only: not usable in a business product. Paid tiers allow client work but forbid resale or redistribution |
| Coolors (coolors.co) | Palette generator, contrast checker, palette visualizer | Palette thinking: a ramp of neutrals plus one accent; test text pairs for contrast, preview the palette on real components | Palettes may be used in your own products. Do not sell, compile or redistribute them, do not use them to train AI |
| HeroUI `DESIGN.md` (heroui.com/react/DESIGN.md) | A design-system contract written for coding agents: frontmatter, then fixed sections (setup, direction, colour roles with light/dark/purpose, type, layout, shapes, elevation, components, interaction, do/don't, sources) | A design system is easiest for an agent to follow as one short file with role tokens in a table, explicit do/don't lists and a stated source of truth. We adopt the **structure**, with our own text, tokens and rules (`DESIGN.md` from `palette.mjs`) | Fetched 2026-11-09 for reading only, not stored in this repository. Licence of the file not checked: do not copy its text or its colour values |
| RareUI (rareui.com) | Component/design resource (unverified) | Could not be read when checked (blocked): nothing learned | Unknown: do not rely on any claim about it |

| Mobbin (mobbin.com) | Library of real app screens and flows from shipped products | How real products solve the same job: navigation shapes, list rows, in-place editing, empty states, onboarding, command palettes; flows as screen sequences | Screenshots belong to the product makers and to Mobbin: look, learn the pattern, never copy a screen, never save or redistribute images. Plan: pick 3 relevant patterns per screen, write the pattern in your own words into `design/PLAN.md` |

## How to use a source

1. Name what you want to learn in one sentence ("one motion idea per component").
2. Write the rule in your own words into `design/`.
3. Build it from your tokens. Do not keep the reference open while drawing or coding the final asset.
4. If you did take an asset, add it to `design/CREDITS.md` with licence and attribution text, and honour the per-project limits.

## What is overused (treat as slop unless it carries meaning)

Moving gradient borders, particle fields, shimmer on every surface, bento grids of equal tiles, glowing orbs, marquee logo walls, number tickers with no number that matters.
