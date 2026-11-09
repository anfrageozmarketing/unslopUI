# Designer standard and the component sheet

Quality bar: "Would a designer post this on Behance or Dribbble as a finished shot, and would it still work as a real product?" Both, not one.

## What strong work has (and generic UI does not)

- **A point of view.** A clear metaphor from the product's world, used consistently (routes, constellations, ledger lines ...).
- **Hierarchy and rhythm.** One focal element per screen, a calm middle, small precise detail. Not five equal boxes.
- **Restraint.** One accent, one spark, neutral rest. One typeface family, 3-4 sizes, weights doing the work.
- **Details.** Consistent radii, 1 px inner highlights on raised layers, optical alignment, tabular numbers, real empty states with an illustration and one action.
- **Considered motion.** One clear idea per component, 120-420 ms, easing from tokens.
- **Own parts.** Components designed for this product's data, not a library's default card/table/dropdown.

## App shell pattern (desktop apps and tools)

Three layers, no separator lines:

1. **Rail** (about 64 px): the product icon on top, then one app-like button per area. Unselected: muted icon. Selected: a raised tile (surface-2) with a soft drop shadow and the full-contrast icon, plus a thin accent bar at the outer edge as the active mark. Utilities (search, theme, refresh) at the bottom.
2. **Context column** (about 240 px): title of the area, then its sub-folders (list of items to switch between), compact status info at the bottom (for example sync or usage). Same tone as the rail, so the two read as one shell.
3. **Window**: the working surface as a rounded container (radius 24 px) with a margin to the shell edge. It is clearly lighter than the shell in dark mode and whiter in light mode. Content scrolls inside it; its header carries title and the one primary action.

On a phone: the rail becomes a bottom bar, the context column a title row with a switcher, the window runs edge to edge with rounded top corners.

## Preview and workspace (two levels per area)

Every area has a **preview** and a **workspace**.

- **Preview**: what the area looks like at a glance, drawn visually from its data (a map of regions, a landscape of stacks, cards with a picture), never a list or a table. Hover and focus show a hint; one click opens the workspace.
- **Workspace**: a focused mode where the window grows (the context column folds away), a slim floating tool strip (glass) holds the tools, and the editing itself is visual: move, connect, add, drop onto a column, pick a card. Autosave with Undo, a clear way out (back button and Esc), the properties of the selected object in a floating panel instead of a form page.
- Choose the visual form from the data: sequence → canvas, status by category → board, choices → cards side by side, parts of a whole → regions.
- The workspace never shows less than the preview did, and its edits show up in the preview immediately.

## Edit patterns (use these instead of forms)

| Value | Pattern |
|---|---|
| Status or any small fixed set | Tap the marker, small popover with the options, keyboard arrows and Enter |
| 2-4 exclusive options (priority, view) | Segmented control in place |
| Short text (title, evidence, answer) | Click the text, it turns into an input, Enter saves, Esc cancels |
| List of strings (screens, endpoints, tags) | Token field: chips with a remove mark, type and press Enter to add |
| Yes / no | Switch |
| Long text | Open an editor in a sheet or modal with live preview; the text stays rendered otherwise |
| Create | One line at the end of the list, type and Enter; extra fields appear only on request |
| Delete or archive | Do it, show a toast with Undo; no confirm dialog |
| Several fields of one object | A property list: label left, value right, every value editable in place, autosave |

Pick the lightest pattern that works. A labelled input with a Save button is not a pattern, it is a fallback.

## No borders as separators

Groups are separated by space and by surface tone. Rows have no hairlines between them; a hover or selected state uses a tonal background. Cards do not need an outline: tone plus space plus (rarely) a soft shadow. Remove default component borders through tokens (for example HeroUI `--border-width: 0`) instead of overriding each component.

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
