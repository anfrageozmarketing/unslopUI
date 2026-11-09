---
name: unslop-element
description: Takes one UI element (a card, bar, badge, form, list, empty state, nav item) out of an app and rebuilds it completely - more modern, more visual, fully stateful - without touching the rest. Isolates it, captures it, defines its job and data, proposes distinct directions, rebuilds it from tokens with HeroUI/Tailwind, shows it on an element sheet in every state, and verifies it in the app. Use when the user points at one thing ("this bar looks broken", "make this card way better") or when an audit names a weak element.
---

# unslop-element

One element, treated like a product of its own. Everything around it stays as it is.

## Steps

1. **Isolate.** Find the component and every place it is used (`grep` the name and class). Note props, data, states, tokens used. Take a "before" capture of just that element: `node unslop-verify/scripts/verify.mjs --url <app> --routes "<route>" --selector "<css selector>" --out before`.
2. **Define the job.** One sentence: what does the person decide or see here, and from what data? Real values and ranges: 0, 1, typical, maximum, very long, error, loading, empty. Which classic element is it (`unslop-components/references/classic-elements.md`)?
3. **Diagnose.** What is wrong in the pixels (alignment to the container padding, contrast, hierarchy, state missing, text too long, too many borders)? Fix defects first, then raise the level.
4. **Three directions, not one.** Sketch each in two lines, from the product's own data (`unslop-build` "crazy screens": data as picture, layered background, inversion, oversized figure, spatial layout, motion with meaning). Pick one, say why. Imitating a named product is not a direction.
5. **Rebuild** in place from tokens only (`tokens.css`, `spec.css`): HeroUI part first, Tailwind for layout, no arbitrary values, no hex. Tone and space instead of borders; focus by tone, ring only for keyboard; labelled; accessible name and values; reduced motion.
6. **Element sheet.** Render the element alone in all states (default, hover, focus, active, disabled, loading, empty, error, partial, full) at 360 and 1280, light and dark, with the extreme data values. This is the Dribbble shot for one part.
7. **Verify in the app** (`unslop-verify`, same selector). Compare before and after, run the measurements, add a scenario if the element does something. Fix, repeat.
8. **Report**: before/after images, the chosen direction and why, the states covered, what was not checked. Update `design/` (component sheet, DESIGN.md) so the element is the pattern from now on.

## Rules

- Scope stays on the one element and its direct states; changes to other parts are findings, not edits.
- Data truth: bars show real proportions, badges real counts, nothing decorative that lies.
- A rebuilt element must be better with the plain, no-motion, 360 px version too.
