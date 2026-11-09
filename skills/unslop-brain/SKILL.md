---
name: unslop-brain
description: Sets up a private "brain" (an Obsidian-compatible markdown vault with one note per flow, screen, finding and decision) plus a self-hosted Command Center web app that shows all apps, flows, status and open decisions visually. Use when the user wants one central overview of the flows of one or many apps, wants Obsidian as the knowledge base, or asks for a command center on their own server. The skill ships only generic templates; the real vault and the running app stay private.
---

# unslop-brain

Two parts, always kept apart:

| Part | Where it lives | Public? |
|---|---|---|
| **This skill** - schema, templates, command-center scaffold, deploy guide | the skill pack repo | yes, generic only |
| **The brain** (vault) and the **running Command Center** | the user's own server and a **private** repo | never |

Never write real app details (paths, hosts, customers, keys, internal findings) into the skill pack repo. The `examples/demo-vault` is the only content allowed there.

## Procedure

1. **Decide the location with the user**: server path for the vault (default `/docker/app-brain/vault`) and for the Command Center (`/docker/app-brain/command-center`). Confirm that the git remote for the vault, if any, is a private repo.
2. **Scaffold**: run `scripts/new-brain.sh <target-dir>`. It copies `templates/vault` and `templates/command-center` into the target and creates `.env` from `.env.example` without secrets.
3. **Fill the vault** using the other skills:
   - `unslop-audit` writes `Apps/<app>/_App.md` (score) and `Findings/*.md`.
   - `unslop-flows` writes one `Flows/<area>/<flow>.md` per flow (see `references/schema.md`), and `Entscheidungen/*.md` for open decisions.
   - Any later skill or build step updates `status` on the same notes. Set `built` only after a test, gate or manual check passed, and write the evidence in the note.
4. **Create users** for the Command Center (`node hash-password.mjs <name>`) and put the output in `.env` as `CC_USERS`. The app refuses to start without users.
5. **Deploy privately** following `references/deploy.md`: bind to localhost or put it behind the reverse proxy with TLS and, if possible, an IP allow-list. Do not publish ports.
6. **Connect every app** (mandatory, otherwise nobody knows the brain exists): run `scripts/connect-app.sh <app-dir> <app-name> --vault <vault> --url <command-center-url>`. It writes a marked block into the app's `CLAUDE.md` telling every AI session where the notes are, to read them before work, and to update `status`, `evidence` and findings after work. Re-run it after moving the vault; it replaces only its own block. If the app lives in a public repo, check that the block contains no private hostnames before committing.
7. **Verify**: open the app, check that an unauthenticated request gets 401, the overview shows the apps, a flow note renders its diagram, and changing a status writes back to the markdown file.

## Rules

- The vault is the source of truth. The app reads it and may write only the whitelisted fields (`status`, `prio`, `state`, `severity`).
- One flow = one note. Keep notes short; link with `[[wikilinks]]` for screens, endpoints and decisions.
- Never put secrets into notes. Reference where a secret lives, not its value.
- Do not deploy, open ports, or change DNS or proxy config without the user's go-ahead.
- Keep the vault Obsidian-compatible (plain markdown, YAML frontmatter, mermaid code blocks).

## Files

- `scripts/connect-app.sh` - the pointer that makes AI sessions use the brain
- `references/schema.md` - note types, fields, allowed values, folder layout
- `references/deploy.md` - private deployment, access control, backups
- `templates/vault/` - empty vault skeleton and note templates
- `templates/command-center/` - dependency-free Node app (server + static UI)
