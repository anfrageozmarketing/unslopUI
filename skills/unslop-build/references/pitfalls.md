# Pitfalls: do these from the start so they never reach review

Every item below was a real defect found in a built UI. Read this list before writing components, then tick it in the gate.

## Shell and navigation
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
- No sideways page scroll at 360 px; scrollers (filters, tabs) are marked and labelled.
- Fixed bottom bars reserve their height; nothing sits behind them.
- Estimate with extremes: 0, 1, 200 items, a 60-character name.

## Verification
Run `unslop-verify` with `scenarios.default.json` (theme persists, no overflow at 360, state survives reload) plus one scenario per function the product promises.
