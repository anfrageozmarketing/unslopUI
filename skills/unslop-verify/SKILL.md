---
name: unslop-verify
description: One-command visual and rendering check of a running web app. Opens the routes in a real browser (Playwright with system Chrome), takes screenshots in light and dark at desktop and phone width, measures typical defects (sideways scroll, clipped text, broken or empty progress bars, overlaps, small tap targets, missing names, console errors) and writes REPORT.md. Use after building or changing UI, or when someone else must verify an app without a special setup.
---

# unslop-verify

Fixes are only done when someone looked at the pixels. This skill makes that one command, for anyone.

## Run

```bash
npm i -D playwright-core          # once; uses the Chrome already on the machine
node <skill-dir>/scripts/verify.mjs --url http://127.0.0.1:3000 --routes "/,/login,/settings" --out verify-out
```

Options: `--widths 1280,360`, `--themes light,dark`, `--auth user:pass` (basic auth for a test login only). Exit code 1 means findings or console errors. Set `CHROME_PATH` if Chrome is not in a standard place.

## What you get

`verify-out/REPORT.md` and one screenshot per route, width and theme. The report lists findings per view: `overflow-x`, `clipped-text`, `progress-thin | progress-empty | progress-over | progress-a11y`, `broken-image`, `badge-not-round`, `badge-big`, `glow`, `inset-highlight`, `plain-loading-text` (a bare "Lädt" or "Loading"), `inner-scroll-x`, `too-busy` (nested boxes, too many type sizes, words or controls in view; see `unslop-simplify`), `edge-touch` (text or control closer than 16 px to the window edge), `hover-noninteractive` (real mouse hover on elements that are not clickable), `hover-no-padding` (hover tone touching the text), `tap-target`, `cursor`, `no-name`, `overlap`, plus console errors. Hover checks run at desktop width; switch off with `--hover off`.

## Then

1. Open the screenshots. The measurements do not see ugly, only broken; judging is yours.
2. Fix each finding in the component, not on the single screen. Re-run until clean.
3. State what was not covered (the report says so) and use test data only, never a production login.

## Playwright MCP or Chrome add-on instead

The same checks apply by hand: see `docs/ui-review.md` section 3b for the list and the order.

## Test functions, not only looks (scenarios)

Pass `--scenarios scenarios.json` (see `scenarios.example.json`). Each scenario is a short click path plus expectations; a failed expectation is a finding in `REPORT.md`.

- Steps: `goto`, `click` (selector or `text=Label`), `fill`, `press`, `reload`, `wait`, `emulate`.
- More steps: `mark` (set a marker on the page), `type`, `clickText`. More expectations: `kept` (the marker survived, so the page did not reload), `noPlainLoading`.
- Expectations: `attr`, `visible`, `hidden`, `text`, `count`, `storage` (localStorage value), `url`, `noOverflow`.

Write one scenario per function the product promises: a setting survives a reload, a created item appears and stays after reload, delete offers Undo, login rejects a wrong password with a readable message, the back button returns to the same list position. Classic flows and screens (`unslop-flows`, `unslop-structure`) give the checklist; each flow that is marked built needs at least one scenario.

Findings from failures go into the brain as `Findings/` notes (`unslop-brain`), with the scenario name as evidence.
