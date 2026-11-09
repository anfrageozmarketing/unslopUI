---
name: unslop-ui
description: Entry point for turning a vibecoded, AI-generated app into a complete, deliberate product. Runs the layers in order - inventory, audit, flows, structure, states, copy, visuals, verify - and delegates to the other unslop skills. Use when the user asks to unslop, polish, complete or review an app as a whole ("check the app", "what flows are missing", "make this not look AI-made"), not just one screen.
---

# unslop-ui

AI-built apps fail in two ways. They **look** generic (glow, gradients, emoji labels), and they are **incomplete**: one page does everything, there is no login, no onboarding, no settings, no empty or error states, and the copy leaks backend messages. Fixing only the look produces a pretty demo. This pack fixes the product first and the surface second.

## Rules

- Keep the product. Do not remove features or reorder the core loop. Additions are proposals until the user approves them.
- Evidence over opinion. Every finding names a file, route or endpoint.
- Findings that carry risk (no auth, external mail without rate limit, deletes without ownership) come first, whatever their size.
- Ask at most one question, and only when the answer changes the plan (single- or multi-tenant, own login or central login).

## Run order

1. **Inventory.** Run `scripts/inventory.sh <app-dir>` if available, otherwise list routes, screens, API endpoints, env vars and tables by hand. Open the app if it can run. Write down: who uses it, what the core loop is, what it sends outside (mail, webhooks).
2. **Audit.** Use `unslop-audit`. Score the app and list findings by severity.
3. **Flows.** Use `unslop-flows`. Produce the flows document (`FLOWS.md`) from the template: existing flows, missing flows, priorities, open decisions.
4. **Structure.** Use `unslop-structure` for screen map, navigation, deep links, settings layout, permissions.
5. **States.** Use `unslop-states` so every screen has empty, loading, error, partial, offline, no-permission and limit states.
6. **Copy.** Use `unslop-copy`. Replace slop phrases and raw backend errors. German copy rules are included.
7. **Components, then visuals.** Use `unslop-components` first: pick a signature component per screen from the shape of the data, no default table/KPI-card/form look. Then `unslop-visual` last. If the separate `unslop` skill by Damir Sokolovsky (CC BY 4.0) is installed, hand the visual craft pass to it and keep this skill's checklist as the gate.
8. **Brain.** Update statuses in the vault (`unslop-brain`). `built` needs evidence.
9. **Verify.** Build, run tests, then **look at the screens**: open them with the Playwright MCP (`claude mcp add playwright npx @playwright/mcp@latest`, see below), take screenshots at 360 px and 1280 px, in light and dark mode, and judge what you see against the `unslop-components` and `unslop-visual` gates. Re-run the audit and report the score change.

### Seeing the UI

Use the Playwright MCP tools to navigate to the running app, take screenshots and read the page. If the MCP is not installed, tell the user the one-line command above and say plainly that the visual result was **not checked**. Never claim a UI "looks good" from code alone. For apps behind a login, ask the user for a test account or a way in; never guess credentials.

## Output

If the user runs a private brain (`unslop-brain`), write audit, flows, findings and decisions into the vault so the Command Center shows them; never into the public skill repo. Otherwise deliver, in this order: the audit (score + findings), `FLOWS.md`, then the changes made or proposed with file references. Say plainly what was not checked.

## Stop conditions

Stop and ask before: adding authentication to a running production system, changing the data model of live data, sending any real mail, or deleting anything.
