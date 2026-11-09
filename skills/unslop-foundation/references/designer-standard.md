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

Reference: a slim light icon rail, a dark rounded menu panel, a light rounded content window (the menu panel is an inversion on purpose).

1. **Rail** (about 104 px) sits directly on the shell ground, no box: the product icon on top, then one labelled app-like button per area (icon above label). Unselected: muted icon and label, no tile. Selected: an **inverted tile** (dark tile, light icon and label) with a soft shadow, inset about 14 px from the edge, plus a 4 px accent bar exactly at the outer edge. Utilities (search, theme, reload) at the bottom, labelled.
2. **Menu column** (about 264 px) is its **own rounded panel** (radius 28 px) in a deep tone from the palette (`--menu`), light text. Colour roles are re-scoped inside the panel (`--ink`, `--ink-muted`, `--surface-2`, `--accent-text`) so every component adapts. Title of the area, sub-folders (apps) as rows with a soft light tile when selected, status info at the bottom. It collapses with a small handle on the window edge.
3. **Window**: the working surface, rounded (28 px), light, clearly lighter than the shell and the menu panel. Content scrolls inside it; the header carries title and the one primary action.

Gaps between rail, menu panel and window are 12 px; the three read as rail, one dark panel and one light panel, not as equal boxes. In dark mode the menu panel is a deep green-black, slightly different from the window.

On a phone: the rail becomes a bottom bar, the menu column a title row with a switcher, the window runs edge to edge with rounded top corners.

## Tile pattern, layered backgrounds, inversion

Three patterns seen in current product design, written as our own rules:

- **Tile**: an outer container in a light gray tone (surface-2) with a large radius (24-28), an **inset preview** of the real object with a smaller radius inside it, and the **caption below the tile** (small icon or avatar, name, one-line subtitle). No border. On hover a round arrow button appears at the tile edge. Use it for apps, flows, documents, anything that has a picture.
- **Layered background**: supplementary elements are integrated behind and around the main object instead of sitting in separate boxes: floating chips or stickers on soft curved tracks, scattered small cards with soft shadows, a faint radial glow or pattern at low contrast. Rules: the elements are **real data** (the flows, findings, statuses of the thing shown), not stock decoration; at most five to seven; they stay below the text in contrast; one pattern per screen; static unless motion carries meaning.
- **Inversion**: one emphasised element flips the tone (a dark tile in a light interface, a light one in a dark interface) to mark the most important or most urgent thing. One or two per screen.

## Workspace window (full-screen editing mode)

A workspace is a large rounded window laid over the dimmed app (small margin on desktop, edge to edge on a phone), not a new page. Reference pattern from a shipped product's viewer, written in our own words:

- **Top bar**: on the left the title with its context ("Login in Demo-App") and the context's small icon; in the middle a **labelled mode switch** (for example Ablauf | Text); on the right the status chip, undo, share link and a **Close** button (also Esc).
- **Stage**: the editing surface gets all remaining space. Previous and next arrows at the left and right edge move to the neighbouring item without leaving the workspace.
- **Bottom bar**: a position counter ("3 von 7 in Zugang") on the left, the primary actions as text buttons in the middle (for example Schritt hinzufügen, Einpassen), a labelled **Eigenschaften** button on the right that opens or closes the properties panel.
- **Properties panel**: slides over the stage from the right, collapsible, never a form page.
- Everything has a text label. Icon-only controls are limited to close, zoom and arrows, and carry tooltips and names.
- Autosave with an unobtrusive "Gespeichert" indicator and Undo; leaving never loses work.

## Focus, create actions and badges

- **Focus without a border on pointer use.** Clicking a field or card changes its tone (lighter or whiter surface, soft lift shadow, accent colour on the icon), not an outline. A ring is shown only for keyboard focus (`:focus-visible`), 2 px offset, and never inside composite fields that already change tone. Never `outline: none` without this replacement.
- **Create sits at the top.** "New finding", "New flow", "New decision" is the first element of its list, directly under the title, not at the bottom. Newly created items appear at the top of the list with a short highlight. The add line stays compact; extra fields appear on request.
- **Badges are small and round.** Count badges on icons: a perfect circle (17 px, no horizontal padding), 10 px bold figures, "9+" above nine, placed beside the icon corner with a ring in the background colour, never covering the icon. Show a count only when it asks for action (open blockers, open decisions), say whose count it is in the tooltip and aria-label ("6 offene Blocker, alle Apps"), and cap at 99+.

## Editor workspace (work areas with tools, structure, properties)

For areas where people build something (flows, boards, decisions), the workspace is a full editor, not a viewer. Layout from a shipped animation editor, in our own words:

- **Top tool strip**: back arrow, then one tool per object type to add (step, decision, note), the file name with a menu in the middle, share, zoom and the one primary action (Export or Save) on the right. Tools have labels or tooltips.
- **Left structure panel**: the outline of the object as a tree (Scene > steps). The selected row is a solid accent tile. Clicking a row selects it on the stage and vice versa.
- **Stage**: the canvas in a quiet tone, the object centred with room around it.
- **Right properties panel**: a mode switch at the top (Design | Ablauf), the selected object's name with a menu, then its editable properties and the main action as a full-width button. An optional helper card with an illustration offers a smart action (for example "Beschreibung erzeugen").
- **Bottom strip**: the sequence of the object (timeline, path of steps, history) with a play or run control and a position marker. For flows: the walk-through of the path from start to end.
- **Home of an area** (before the workspace): a small left menu (Entwürfe, Vorlagen, Bereich, Ordner anlegen, Einstellungen, Papierkorb), a big title, two coloured primary actions at the top ("Neu anlegen", "Importieren") and a grid of tiles with a preview and caption (name, last edited). A dashed tile with a plus adds the next item.
- A round help button sits bottom right in every workspace.

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
| Short text (title, evidence, answer) | Click the text itself (no pencil icon or Edit button), it turns into an input, Enter saves, Esc cancels |
| Paragraphs and sections | Click the rendered text, it becomes an auto-growing text area in place, saves on leaving, Esc cancels, Undo |
| List of strings (screens, endpoints, tags) | Token field: chips with a remove mark, type and press Enter to add |
| Yes / no | Switch |
| Long text | Open an editor in a sheet or modal with live preview; the text stays rendered otherwise |
| Create | One line at the end of the list, type and Enter; extra fields appear only on request |
| Delete or archive | Do it, show a toast with Undo; no confirm dialog |
| Several fields of one object | A property list: label left, value right, every value editable in place, autosave |

Pick the lightest pattern that works. A labelled input with a Save button is not a pattern, it is a fallback.

## Waiting states (never a bare "Loading")

- **First load:** a loading screen that looks like the app (shell silhouette in skeletons) with one brand animation and a specific line. It hands over to the real screen without layout jump.
- **Inside views:** skeletons in the shape of the content (rows, cards, diagram block).
- **Actions:** optimistic change at once; the control shows its own progress; long jobs show real progress and the current step.
- **No page reloads** after actions. A failure rolls back and says what happened and what to do.

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
