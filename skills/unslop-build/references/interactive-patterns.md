# Interactive patterns: when a canvas, node editor, board or timeline makes sense

The product should not stop at lists and forms. When the data has a shape that people naturally **arrange, connect, schedule, order, place or split**, the right interface is an interactive editor. This page tells the agent how to recognise the shape and which editor to build. Run `scripts/suggest-editors.mjs` over the code, schema or notes to get evidence-backed suggestions, then decide with the user.

## Recognise by what people do with the thing

| The user... | Data signals (field and word hints) | Editor | Minimum feature set |
|---|---|---|---|
| connects steps, decides branches, designs a process | `next`, `from/to`, `source/target`, `edges`, `steps`, `workflow`, `pipeline`, `condition`, `trigger`, `automation`, flows with branches | **Node editor** (canvas of nodes and edges) | pan and zoom, add node, drag to connect, rename in place, branch labels, loop-back edges, fit view, undo, properties panel, auto layout |
| places objects freely in 2D | `x`, `y`, `position`, `left/top`, `layout`, `canvas`, `board`, mind map, floor plan, poster | **Canvas / whiteboard** | select, move, resize, snap, layers list, align, zoom, undo, export |
| moves items between states | `status`, `stage`, `column`, `state` enum, pipeline of cards, kanban | **Board** (columns with cards) | drag between columns, add card at top, WIP count, filter, quick edit, dialog for detail |
| plans things over time | `start`, `end`, `due`, `duration`, `schedule`, `deadline`, `milestone`, `calendar` | **Timeline / Gantt / calendar** | drag to move and resize, today marker, zoom level, dependencies, conflict hint |
| structures a hierarchy | `parent`, `children`, `tree`, `outline`, `category`, `folder`, nested sections | **Tree / outline editor** | indent and outdent, drag to reorder, expand and collapse, inline rename, keyboard |
| orders a list | `order`, `rank`, `priority`, `position` as integer, playlists, steps | **Reorderable list** | drag handle, keyboard move, instant save, undo |
| splits a whole | `percent`, `budget`, `allocation`, `weight`, shares that sum to 100 | **Proportional editor** | stacked bar or treemap, drag edges, locked remainder, live sum |
| sets rules with conditions | `rule`, `if/then`, `filter`, `segment`, `condition`, `trigger` | **Rule builder** | sentence-style rows (when, and, then), add/remove, live preview of matches, test button |
| picks among options with trade-offs | `option`, `plan`, `variant`, `decision`, comparison | **Compare view** | cards side by side, difference highlighting, pick in place, note per option |
| relates things many-to-many | `tags`, `links`, `relations`, `members`, matrix of A x B | **Matrix or relation map** | grid with toggles, row and column filters, bulk set, network view for exploration |
| places things on a map or floor | `lat`, `lng`, `geo`, `address`, `zone`, `route` | **Map editor** | pin, draw area, cluster, list synced with map |
| designs a page or layout | `blocks`, `sections`, `template`, `layout`, `widgets`, `grid` | **Layout builder** | block palette, drop zones, reorder, inline text, responsive preview |
| edits tabular data in bulk | many rows of the same shape, import, export | **Inline-editable table** | click to edit cell, paste from sheet, column types, sort/filter, bulk actions |
| reviews many items fast | queue of items needing a verdict | **Triage view** | keyboard-driven next/accept/reject, shortcuts shown, undo |

If none of the signals fire, a list with click-to-edit rows is the right answer. Do not add an editor for show.

## Decide (three questions)

1. **Is the structure the value?** (relations, order, time, position, proportion). If yes, an editor that shows that structure beats a form that hides it.
2. **Does the user change it often?** Rare edits: a detail dialog. Frequent or exploratory edits: a workspace.
3. **Is there a risk in being wrong?** (a broken process, a double booking, a wrong total). The editor should show the error live (conflict, dead end, sum not 100).

Two yes answers: build the editor. One: offer it as a later step. Zero: list or form.

## Build order for any editor

1. **Preview first**: the same data drawn read-only inside the overview (route map, board snapshot, mini timeline).
2. **Workspace**: `templates/app-shell/Workspace.jsx` frame with the editor as the stage and the properties panel docked.
3. **Direct manipulation**: act on the object itself (drag, click text, drop on a column); no pencil icons, no Edit buttons. Hover and selection by tone, the edge cases (empty, one item, 200 items) designed.
4. **Safety**: autosave, Undo, validation shown live, a labelled way out (Schließen, Esc).
5. **Text mode** as a second view of the same data where it exists (diagram code, markdown, table), so power users and AI agents can edit it as text too.
6. **Keyboard**: arrows to move selection, Enter to rename, Delete, Ctrl Z, `+`/`-` zoom, `0` fit.
7. **Verify**: scenarios for the main manipulations (`unslop-verify`): add, connect or move, reload keeps it, undo works.

## Examples from this project

- **Flows** (steps with branches and loops) became a node editor: nodes and edges, drag from the exit to connect, rename in place, mode switch Ablauf | Text where Text is the mermaid source.
- **Findings** (severity, state) are a list now; a board by severity would be the next step.
- **Decisions** (options, answer) are a list with a detail dialog; a compare view would fit when options are written down.

## Do not

- Do not build an editor where a table is the truth (invoices, logs).
- Do not hide basic edits behind the editor: a title is still edited in place everywhere.
- Do not ship an editor without undo, fit-to-view and a text or list fallback for small screens.
