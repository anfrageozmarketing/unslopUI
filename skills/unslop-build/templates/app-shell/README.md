# App shell starter

Extracted from the working Command Center. Copy these files into a project that already loads `tokens.css` (palette) and `spec.css` (sizes):

| File | What it is |
|---|---|
| `shell.css` | Styles: top bar, rail, dark layer 2 with menu and window, workspace overlay (`.ws*`), loading screen and skeletons, dialog sheet, click-to-edit text, new-item animation, edge handle, round count badges |
| `AppShell.jsx` | Generic shell component (`AppShell`, `Window`): top bar, rail with labelled areas, layer 2 with menu column and window |
| `Workspace.jsx` | Generic workspace window (`WorkspaceWindow`): top bar with labelled modes, stage, docked properties, bottom bar, Esc |
| `Loading.jsx` | Boot screen and skeletons (needs HeroUI `Skeleton`; replace the logo icon) |
| `replaceSection.js` | Pure helper for editing one section of a markdown note in place |

Notes
- Status: extracted from a running app; the generic components were written to match its class names and have not been built in a blank project yet. Do a first render and screenshot check with `unslop-verify` before relying on them.
- The shell structure and why it looks like this: `unslop-foundation/references/designer-standard.md` ("App shell pattern", "Editor workspace").
- Rules for every part: `references/pitfalls.md`, `references/spacing.md`.
