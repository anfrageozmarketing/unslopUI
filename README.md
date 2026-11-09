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
| `unslop-layout` | Scales for space, type and radius with a rhythm, reflow across phone, tablet band and desktop, labelled navigation, collapsible panels, full-screen workspaces |
| `unslop-build` | Builds flows, UI elements and screens on HeroUI, Tailwind and shadcn patterns from a spec defined first (colours, type, spacing, sizes), with element map, screen recipes and a gate |
| `unslop-verify` | One command: screenshots in light/dark at desktop and phone width, measured rendering defects, and click-path scenarios (for example "dark mode survives reload") in a REPORT.md |
| `unslop-element` | Takes one element out of an app and rebuilds it completely (diagnose, three directions, tokens-only rebuild, all-states sheet, verify) |
| `unslop-human` | Measured contrast (with a checker script), focus and keyboard, states, affordances, reduced motion, 200 percent zoom |
| `unslop-copy` | Specific, calm copy; German rules and a German slop-phrase list |
| `unslop-foundation` | Starts every UI build: contrast-checked palette from one seed colour (`scripts/palette.mjs`), bold icon style, illustration and motion language, a designer-grade component sheet; inspiration from Streamline, Magic UI, Coolors and others for principles only, never copied |
| `unslop-components` | Picks a signature component per screen from the shape of the data; bans the default table / KPI-card / form look |
| `unslop-visual` | Last-layer visual gate: tokens, quiet chrome, one focal element, mobile |
| `unslop-brain` | Sets up a **private** Obsidian vault (one note per flow) and a self-hosted **Command Center** web app that shows all apps, flows, status and open decisions |

Order matters: **inventory → audit → flows → structure → states → copy → foundation → components → visuals → verify**.

The browser tool only **captures** screenshots (`docs/capture-screens.md`); judging and editing stay with the designing agent.

## Let the AI look at the UI (recommended)

Reading code is not seeing the screen. Give the AI a browser once, so it can open the app, take screenshots and check phone and desktop widths itself:

```
claude mcp add playwright --scope user -- npx @playwright/mcp@latest
```

`--scope user` makes it available in every project, not only the folder where you ran the command. Check with `claude mcp list` (`playwright ... Connected`).

**Where the session runs matters.** A stdio MCP starts on the machine that runs the session. In a **local** session (your laptop) Playwright works with its browser. In an **SSH/remote** session the desktop app hands the entry over from your laptop, and this hand-off can break (symptom: `ENOENT ... posix_spawn 'stdio'`, no `playwright` tools); the server also has no screen and usually no Playwright browser (`npx playwright install chromium`). So for UI work use a local session, and let it work on a clone of the repo; deploy to the server afterwards.

**Server session instead:** put the server into a project file `/root/.mcp.json` (or the project folder's `.mcp.json`; approve it when the session asks) and use the Chrome that is already installed, headless:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest", "--headless", "--no-sandbox", "--isolated",
               "--browser", "chrome", "--executable-path", "/usr/bin/google-chrome",
               "--viewport-size", "1280x900"]
    }
  }
}
```

`--no-sandbox` is needed when running as root. Start a **new** session in that folder afterwards (MCP servers load at session start). Verified on a Linux server: 25 tools, `browser_navigate` and `browser_take_screenshot` work.

The skills (`unslop-ui`, `unslop-components`, `unslop-visual`, `unslop-brain`) tell the AI to use it for the verify step. Without it, the AI can only say what it did not check.

## Install

As a Claude Code plugin:

```
/plugin marketplace add anfrageozmarketing/unslopUI
/plugin install unslopui@unslopui
```

Or copy `skills/*` into `~/.claude/skills/` (or `.claude/skills/` in a project).

## Private brain + Command Center

The skills are public and generic. Your real flows, findings and decisions are not. `unslop-brain` ships the schema, vault templates and a dependency-free Command Center app (Node, no build). You scaffold it **on your own server**, outside this repo:

```
scripts/new-brain.sh /docker/app-brain
```

The app is fail-closed (no users, no start), uses hashed passwords, rate-limits logins, writes only whitelisted frontmatter fields and is meant to sit behind TLS and an IP allow-list. See [`deploy.md`](skills/unslop-brain/references/deploy.md). A runnable demo vault is in `examples/demo-vault`.

## Use

> "Check the app and build all flows we need, including what is missing." → `unslop-ui` / `unslop-flows`

`scripts/inventory.sh <app-dir>` lists routes, endpoints, auth hints, env vars, tables, the biggest files and state coverage. It seeds the audit.

`scripts/validate.sh` checks every skill's frontmatter. `node --test tests/` tests the Command Center (auth, API, write-back, path safety).

## Example

[`examples/jobfinder-flows.md`](examples/jobfinder-flows.md) is real output of `unslop-flows` (German): a single-page job-discovery app with no identity, analyzed into roles, screens, flows, settings, data model, API additions and an MVP/V1/V2 plan.

## Credits

The layout, human-friendliness and human-copywriting rules were written with the team's antislop skill set as a reference. They are rewritten in our own words and adapted to our products.

Visual craft for AI-looking UI is the focus of the separate **unslop** skill by Damir Sokolovsky ([@heydamir](https://x.com/heydamir), CC BY 4.0). unslopUI does not copy it; `unslop-visual` is a checklist that can hand off to it. The structure, flows, states and German copy layers here are original.

## License

MIT
