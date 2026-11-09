# UI review of the Command Center (for a local session with Playwright MCP)

Goal: look at the Command Center in a real browser, judge it, fix what is wrong, push to a branch.
Run this in a **local** session (Playwright MCP connected, `browser_navigate` available). Use demo data only.

## 1. Start a local instance (demo data, test login)

```bash
cd skills/unslop-brain/templates/command-center
CC_PASSWORD='testpasswort-123' node hash-password.mjs test      # prints  test=<salt>.<hash>
cp -R ../../../../examples/demo-vault /tmp/demo-vault
VAULT_DIR=/tmp/demo-vault CC_USERS='<the line printed above>' PORT=8090 node server.mjs
```

Open `http://127.0.0.1:8090` with HTTP Basic auth `test` / `testpasswort-123`
(for Playwright use `httpCredentials` in the browser context, never put credentials in the URL: the page's `fetch` calls fail then).
Never use the real server, its URL or its password.

## 2. Screens to look at

Each at **1280x900** and **360x800**, in **light and dark** (`colorScheme`):

| Route | What to judge |
|---|---|
| `#/` | App rows with the strip, one-line summary, no card grid |
| `#/app/Demo-App` (tab Flows) | Route map: lanes, nodes, markers (status), size (priority), legend filter |
| same, tabs Aufmerksamkeit, Befunde, Entscheidungen | Streams and lists, read-first |
| `#/note/Apps%2FDemo-App%2FFlows%2FZugang%2FLogin.md` | **Flow canvas**: nodes, ports, curves, labels, Soll/Luecken, mini route |
| another flow, e.g. `Kernablauf/Analyse starten.md` | bigger diagram with a loop of decisions |
| a decision and a finding note | plain reading page, "Bearbeiten" disclosure |

Interactions: drag the canvas, mouse wheel zoom, buttons `-`, `+`, `Einpassen`, keys `+` `-` `0`, legend chips on the route map,
`+ Neuer Flow` form, `Bearbeiten` disclosure.

## 3. Judge against

- `skills/unslop-components/SKILL.md` (gate): no table / KPI-card / form as main element, status with shape plus colour, read-first.
- `skills/unslop-visual/SKILL.md` (gate): spacing, contrast >= 4.5:1, focus visible, tap targets >= 44 px, no horizontal scroll at 360 px.
- Canvas specifics: labels clipped or overlapping, edge labels colliding with nodes, router captions overlapping the next layer,
  back-edge (loop) routing, fit on load, nodes unreadable at the fitted zoom, canvas too tall/short on a phone.

## 4. Fix

- Edit only `skills/unslop-brain/templates/command-center/public/app.js` and `style.css` (and `server.mjs` only if a bug demands it).
- Keep the CSP intact: no inline scripts, no new external resources.
- Keep `node --test tests/` green; add a test when logic changes (`tests/ui-smoke-runner.mjs` for UI logic).
- Do not touch anything outside this repo.

## 5. Deliver

1. Work on the branch `ui-review`, commit, `git push -u origin ui-review`.
2. Write `docs/ui-review-report.md`: per screen what you saw, what was wrong, what you changed, what is still open. Be honest about what you could not verify.
3. Stop. The maintainer merges and deploys after reading the report.
