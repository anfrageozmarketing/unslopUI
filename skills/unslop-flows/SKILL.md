---
name: unslop-flows
description: Derives every user flow an app needs (login, password reset, invite, onboarding, core loop, settings, team, notifications, export, deletion, legal, errors, admin), compares it with what exists, and writes a FLOWS.md with mermaid diagrams, missing features, data model and API additions, priorities and open decisions. Use when asked to "build all flows", "what features are missing", or to plan login, onboarding or settings for an existing app.
---

# unslop-flows

Turns an existing codebase into a flows document that a team can build from.

## Procedure

1. **Inventory** what exists (see `unslop-ui`). Read the real code, do not guess from the README.
2. **Classify the app**: internal tool, B2B SaaS, consumer app. Pick the column in `references/flow-catalog.md` (Must / Should / Could).
3. **Map existing flows** as they really work, including their gaps. Draw the core loop as a mermaid flowchart with the real status names from the code.
4. **Compare with the catalog.** For every catalog flow: exists / partial / missing. Partial and missing become entries.
5. **Write each missing flow** as: trigger → steps → outcomes → edge cases → security notes. Use a mermaid diagram when there are branches.
6. **Derive the build list**: new screens (route map), data model additions, API additions, settings fields.
7. **Prioritize** into MVP / V1 / V2. MVP is whatever blocks safe use by a second person.
8. **List open decisions** that change the plan (tenancy, auth route, legal basis for outbound mail, database, support channel, relation to sibling systems). Do not decide them silently.
9. **Output.** If a private brain exists (see `unslop-brain`), write one note per flow into `Apps/<app>/Flows/<area>/` with the frontmatter from `unslop-brain/references/schema.md`, plus `Findings/` and `Entscheidungen/` notes. Otherwise fill `templates/FLOWS.template.md` as a single document. Keep the section order and state what was not checked.
10. **Never** write a real app's flows into the public skill pack repo.

## Gap check on request (existing apps)

Run this only when the user asks ("check the base flows", "what is missing compared to what we usually build"). Never run it silently.

1. Read the app's vault notes (or `_Overview.md`) and classify the app (internal tool, B2B SaaS, consumer app) and its **scale** (one user, one team, many tenants).
2. Walk `references/flow-catalog.md` for that column. For each catalog flow decide: **fits**, **does not fit**, or **unsure**.
3. Flows that do not fit get **no proposal**. Examples: roles and invites for a one-person tool, billing for an internal app, sign-up for a closed team. If it matters for the record, write the flow as a note with `status: na` and a one-line `reason` so it is not proposed again.
4. Flows that fit and are missing are **proposed**, not created: show the short list with the reason for each, and create notes (`status: missing`) only for the ones the user picks.
5. Existing flows already marked `na` stay untouched. Do not re-propose them.
6. When the user corrects a judgement ("we do not need that"), record it as `na` with a reason. Over time the reasons become the team's own rules for what a base set looks like.

## Rules

- Every flow note carries a mermaid `flowchart` of its steps and decisions (nodes = steps, `{}` = decisions, labelled edges). The Command Center draws it as a node canvas; without it only a chain derived from `Soll` is shown.
- Name real routes, files and statuses. A flow without a screen name is not finished.
- Security flows first: password reset always answers the same way; invite and reset links are single-use and expire; lockout is per account and per IP.
- Every outbound action (mail, webhook, delete) needs: preview, confirmation, history, rate limit.
- Settings that live only in env vars are a finding.
- Do not invent business facts. Mark assumptions as assumptions.
- Not every catalog flow applies. `na` with a reason is a valid, countable answer and is excluded from coverage.

## Files

- `references/flow-catalog.md` - the flow catalog with Must/Should/Could per app type
- `templates/FLOWS.template.md` - the document skeleton
