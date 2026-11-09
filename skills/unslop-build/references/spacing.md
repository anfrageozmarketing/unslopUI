# Spacing rules

All values are multiples of the grid base (4 px) from `design/SPEC.md`. Use tokens (`p-4`, `gap-6`), never ad-hoc pixels.

## Nothing touches the edge

- **Window and card edges:** no text, control or icon sits closer than 16 px (desktop) or 12 px (phone) to the edge of its container. Window padding is 24-32 px desktop, 16 px phone. Cards and tiles pad 16-24 px.
- **Full-bleed is the exception** and must be intentional: backgrounds, images, canvas stages, the edge bar of the active item, the collapse handle. Mark them `data-edge` so checks skip them.
- **Floating tools** (zoom, nav arrows, toasts) keep 12-16 px from the stage edge.
- **Scrollers** (tabs, filter chips) start at the content padding and scroll under it, they do not stick to the screen edge.
- Tone areas behind text (hover, selected, input fields) extend at least 8-12 px beyond the text on every side.

## Distances by relationship

| Relationship | Space |
|---|---|
| Icon to its label | 8 px |
| Label to its field | 4-8 px |
| Items inside one group (list rows, chips) | 4-8 px between, 12 px padding inside |
| Related controls (button row) | 8-12 px |
| Heading to its content | 8-12 px |
| Group to group | 24-32 px |
| Section to section | 48-72 px |
| Page title block to content | 24-32 px |

Closer means more related. Space between groups is always larger than space inside a group; if two gaps are equal the grouping is lost.

## Rhythm

- One vertical rhythm per screen: pick 2-3 gap sizes from the scale and reuse them.
- Do not centre-align mixed content; align to one left edge and one right edge per column.
- Equal outer margins left and right; equal padding top and bottom inside a card (optical, not mathematical: reduce padding beside large rounded corners).
- Nested radius = outer radius minus the padding between them.

## Phone

- Side margin 16 px, touch targets 44 px with at least 8 px between them, bottom bars reserve their height plus the safe area.

## Check

`unslop-verify` reports `edge-touch` for text or controls closer than 16 px (12 px phone) to the window edge, plus `hover-no-padding`, `tap-target` and `overlap`.
