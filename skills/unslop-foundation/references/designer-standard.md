# Designer standard and the component sheet

Quality bar: "Would a designer post this on Behance or Dribbble as a finished shot, and would it still work as a real product?" Both, not one.

## What strong work has (and generic UI does not)

- **A point of view.** A clear metaphor from the product's world, used consistently (routes, constellations, ledger lines ...).
- **Hierarchy and rhythm.** One focal element per screen, a calm middle, small precise detail. Not five equal boxes.
- **Restraint.** One accent, one spark, neutral rest. One typeface family, 3-4 sizes, weights doing the work.
- **Details.** Consistent radii, 1 px inner highlights on raised layers, optical alignment, tabular numbers, real empty states with an illustration and one action.
- **Considered motion.** One clear idea per component, 120-420 ms, easing from tokens.
- **Own parts.** Components designed for this product's data, not a library's default card/table/dropdown.

## Component sheet (`design/components.html`)

One self-contained page, tokens only, light and dark switchable, that shows each core component:

| Section | Must show |
|---|---|
| Anatomy | The component annotated: parts, spacing, tokens used |
| States | default, hover, focus, active, selected, disabled, loading, empty, error, success |
| Variants | sizes and density, with and without icon |
| Motion | The one animation, replayable, with reduced-motion fallback |
| Context | The component in a small real layout with real-looking data |

Core set for most products: status marker, segmented control, popover menu, command palette, list row with inline edit, quick-add line, toast with undo, empty-state illustration, navigation, hero image/card, one signature component (for example a route map).

## Gate (all true before screens are built)

- The sheet exists and shows every state above for every core component.
- Every colour, space, radius and duration comes from `tokens.css`.
- Contrast: the palette checks pass; text on glass or imagery measured on real pixels.
- The squint test passes: one thing leads.
- Nothing is a recognisable copy of a library component or a third-party asset.
- Screenshots of the sheet (light and dark, 1280 and 360 px) were taken with the capture tool and reviewed by the designing agent.
