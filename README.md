# unslopUI

Skill pack for AI coding agents (Claude Code format) that turns **vibecoded, AI-looking apps into complete, deliberate products**.

Most "unslop" tools fix the surface: glow, gradients, emoji. AI-built apps are also *incomplete*: one giant page, no login, no onboarding, no settings, no empty or error states, raw backend errors in the UI. unslopUI fixes the product first and the surface last.

## Skills

| Skill | Job |
|---|---|
| `unslop-ui` | Entry point. Runs all layers in order |
| `unslop-audit` | Scores the app 0-32, lists "AI-structure tells", ranks findings |
| `unslop-flows` | Builds the flows doc: login, reset, invite, onboarding, core loop, settings, export, legal, errors |
| `unslop-structure` | Route map, navigation, deep links, list scaling, settings layout, permissions |
| `unslop-states` | Empty, loading, partial, error, offline, no-permission, limit |
| `unslop-copy` | Specific, calm copy; German rules and a German slop-phrase list |
| `unslop-visual` | Last-layer visual gate: tokens, quiet chrome, one focal element, mobile |

Order matters: **inventory → audit → flows → structure → states → copy → visuals → verify**.

## Install

As a Claude Code plugin:

```
/plugin marketplace add anfrageozmarketing/unslopUI
/plugin install unslopui@unslopui
```

Or copy `skills/*` into `~/.claude/skills/` (or `.claude/skills/` in a project).

## Use

> "Check the app and build all flows we need, including what is missing." → `unslop-ui` / `unslop-flows`

`scripts/inventory.sh <app-dir>` lists routes, endpoints, auth hints, env vars, tables, the biggest files and state coverage. It seeds the audit.

`scripts/validate.sh` checks every skill's frontmatter.

## Example

[`examples/jobfinder-flows.md`](examples/jobfinder-flows.md) is real output of `unslop-flows` (German): a single-page job-discovery app with no identity, analyzed into roles, screens, flows, settings, data model, API additions and an MVP/V1/V2 plan.

## Credits

Visual craft for AI-looking UI is the focus of the separate **unslop** skill by Damir Sokolovsky ([@heydamir](https://x.com/heydamir), CC BY 4.0). unslopUI does not copy it; `unslop-visual` is a checklist that can hand off to it. The structure, flows, states and German copy layers here are original.

## License

MIT
