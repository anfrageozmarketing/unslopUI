# Pitfalls: do these from the start so they never reach review

Every item below was a real defect found in a built UI. Read this list before writing components, then tick it in the gate.

## Shell and navigation
- The shell is two panels: ONE sidebar (rail and menu column merged, same tone and radius as the window) and the window. Never a separate third box.
- Rail buttons carry a visible label; icon-only menus are not understood. Labels fit their width ("Entscheide", not a clipped long word).
- Active item: raised tile **inset** from the rail edge (about 14 px), never touching it, plus a 4 px accent bar exactly at the outer edge.
- Collapse control sits on the edge of the work window (small handle), not inside the content or the page header. Closed state keeps the same handle to reopen. State survives a reload.
- Side panels (properties, details) dock next to the stage on wide screens and refit the content; they never cover it. Overlay only on phones.

## Badges, counts, bars
- Count badges are perfect circles (equal width and height), 16-17 px, 10 px figures, "9+" above nine, beside the icon not on it, with a ring in the background colour. Label says whose count it is.
- Progress bars: fixed height (8-10 px), track at least 3:1 against its surround, fill absolutely positioned inside, minimum visible fill above 0, clamped to 100 %, aligned to the same left and right edges as the text above and below, `role="progressbar"` with values.
- Info cards reset inherited row padding so bars and text share one column.

## Focus and interaction
- Click and tap change tone (lighter surface, soft lift, accent icon); a ring only for keyboard focus, never inside fields that already change tone.
- Create actions ("New X") are the first element of their list, under the title. New items appear at the top.
- Every clickable element has a pointer cursor; controls are at least 44 px on phones.

## State that must survive a reload
- Theme (light or dark), collapsed panels, last selected tab or filter, unsent drafts: stored (localStorage in try/catch), applied before first paint through an external script (a strict CSP blocks inline scripts).

## Text
- Long words get soft hyphens or `hyphens: auto` with `lang` set; nothing overlaps its neighbour at 360 px.
- Sentence case, no em dashes, no invented numbers, buttons are verbs.

## Layout
- Nothing sits at the edge of its window or card (16 px, phone 12 px); see `spacing.md`.
- No sideways page scroll at 360 px; scrollers (filters, tabs) are marked and labelled.
- Fixed bottom bars reserve their height; nothing sits behind them.
- Estimate with extremes: 0, 1, 200 items, a 60-character name.

## No page reloads, no bare "Loading"
- The app is one page: no full reload after any action, no form post that navigates, no refetch that blanks the screen. A change shows at once (optimistic update), the server confirms in the background, a failure rolls back with a plain message, Undo instead of confirm.
- Waiting is designed. Never a lone "Lädt ..." or spinner. First load: a loading screen in the shape of the real app (rail, list, window silhouette) with a short, specific line ("Deine Apps werden geladen") and one meaningful animation. Inside a view: skeletons in the shape of the content. Actions: the control itself shows progress; long jobs show real progress and what is happening. Skeletons keep the final layout so nothing jumps when data arrives.
- A loading state always ends in content, empty or an error with a retry.

## Edit where it is
- Text is edited by clicking it: no pencil, no "Edit" button first. The text turns into an input (short) or an auto-growing text area (long), tone change instead of a border, saves on leaving or Enter, Esc cancels, Undo after saving. Links inside the text stay links.
- Dialogs for editing are the fallback for long structured content only.

## Search and dialogs
- A command palette or dialog is wide enough for its content (about 720 px, 92 % of the screen on phones), never scrolls sideways, truncates long labels with an ellipsis, and has no focus border: the field changes tone instead.
- No element ever shows a horizontal scrollbar except a marked, labelled scroller (tabs, filter chips).

## Hover and selection
- Hover tone only on things that can be clicked. Static rows, info cards and labels do not react. A row with several controls reveals its actions on hover but keeps its background.
- A hover background never touches the text: at least 8-12 px padding inside the toned area, the same padding at rest so nothing jumps.
- Selected means a flat tone plus the edge bar. No glow, no light outer shadow, no light inset edge; in dark mode a soft dark shadow is the only allowed depth.

## Verification
Run `unslop-verify` with `scenarios.default.json` (theme persists, no overflow at 360, state survives reload) plus one scenario per function the product promises.
