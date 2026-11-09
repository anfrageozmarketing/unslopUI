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
9. Fill `templates/FLOWS.template.md`, keep the section order, and state what was not checked.

## Rules

- Name real routes, files and statuses. A flow without a screen name is not finished.
- Security flows first: password reset always answers the same way; invite and reset links are single-use and expire; lockout is per account and per IP.
- Every outbound action (mail, webhook, delete) needs: preview, confirmation, history, rate limit.
- Settings that live only in env vars are a finding.
- Do not invent business facts. Mark assumptions as assumptions.

## Files

- `references/flow-catalog.md` - the flow catalog with Must/Should/Could per app type
- `templates/FLOWS.template.md` - the document skeleton
