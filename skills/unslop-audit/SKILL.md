---
name: unslop-audit
description: Scores an app 0-32 across eight dimensions (identity, onboarding, core loop, settings, states, structure, copy, visuals), lists "AI-structure tells" with file evidence, and writes a prioritized report. Use first on any "check the app", "review this product", or "what is missing" request, and again after changes to show the score change.
---

# unslop-audit

## Procedure

1. Gather evidence from code and, if possible, the running app: routes, components, API endpoints, DB tables, env vars, compose/proxy config.
2. Score each dimension 0-4 using the rubric below. A score needs a reason with a file or route.
3. List tells from `Structure tells`. One line each, with location.
4. Rank findings: **Blocker** (security, data loss, legal, external side effects) → **Gap** (a whole flow missing) → **Rough** (inconsistent or unfinished) → **Polish**.
5. Write the report from the template at the bottom.

## Rubric (0 = absent, 2 = works but thin, 4 = deliberate)

| Dimension | 4 means |
|---|---|
| Identity & access | Login, logout, reset, invite, roles enforced in the backend, ownership on data, rate limits |
| Onboarding | First run explains the loop, collects what the product needs, ends in a first success |
| Core loop | Start, progress, result, retry, cancel, export all exist and are linkable |
| Settings | Profile, team, notifications, integrations, data export and deletion; nothing important lives only in env vars |
| States | Every screen has empty, loading, error, partial, offline, no-permission, limit |
| Structure | Real routes, deep links per entity, pagination, filters, consistent navigation |
| Copy | Specific, human, no raw errors, no slop phrases, one voice |
| Visuals | Tokens for space/color/type, quiet chrome, one deliberate focal element, mobile works |

Total /32. Under 12: prototype. 12-20: usable internally. 21-27: shippable. 28+: deliberate.

## Structure tells (AI-built apps)

- One component of 800+ lines renders the whole product; no router.
- Auth only in a proxy config or commented out; API open.
- Confirm texts that say "for all users" or data without an owner.
- Settings exist only as env vars or not at all.
- UI refetches every item on every refresh (N+1 on the client).
- "Coming soon", placeholder pages, dead buttons, lorem ipsum, seed data shown as real.
- Support is promised in error texts but no contact exists.
- Statuses with no explanation; the same state named three ways.
- No 404/403/500 page; SPA fallback serves the shell for every path.
- Outbound mail or webhooks with no preview, test send, history, rate limit or opt-out.
- Dashboards of vanity cards with no action behind them.

## Report template

```
# Audit: <app> - <date>
Score: <n>/32  (<band>)
## Blockers
- <finding> - <file/route> - <why it matters> - <smallest fix>
## Gaps
## Rough
## Polish
## Scores
| Dimension | Score | Reason |
## Not checked
```
