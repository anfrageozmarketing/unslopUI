# Motion language

Motion explains change, confirms an action, or draws attention to one thing. If it does none of these, remove it.

## Tokens (generated into `tokens.css`)

`--dur-1: 120ms` (hover, press), `--dur-2: 220ms` (state change, popover), `--dur-3: 420ms` (enter, route draw). Easing `--ease-out` for entering things, `--ease-in-out` for moving things. Under `prefers-reduced-motion` the durations become 0.

## Rules

- Animate `transform` and `opacity`. Avoid animating layout.
- One motion idea per component. Never two competing animations in view.
- Enter slower than exit. Stagger lists by 30-40 ms, cap at 8 items.
- No infinite loops on idle content. A loop is allowed only for real activity (loading, a live process) and stops when done.
- Provide a static end state that carries the full meaning without the animation.

## Pattern library (write your own versions, tokens only)

| Pattern | Use | Idea |
|---|---|---|
| Status pop | A status changes | The marker scales 0.8 to 1 with `--ease-out`, then the label cross-fades |
| Route draw | A flow or line appears | `stroke-dasharray` equal to path length, `stroke-dashoffset` from full to 0 over `--dur-3` |
| Beam | An active connection | A short bright segment travels along the line once per event, not forever |
| Count settle | A number that matters changes | The digit rolls to the new value once, tabular figures |
| Skeleton | Loading | Shapes in the final layout, a slow low-contrast sweep, stops when data arrives |
| Stagger in | Lists, lanes | Items rise 8 px and fade in, 30-40 ms apart |
| Press | Buttons | Scale 0.97 on press, back on release |
| Undo toast | After a destructive or optimistic change | Slides in, stays 6 s, exposes Undo |

## Check

- Turn on reduced motion: is everything still understandable?
- Record a short clip or take a frame sequence: is there exactly one thing moving at a time?
