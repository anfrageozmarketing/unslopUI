---
name: unslop-structure
description: Fixes the information architecture of an app that grew as one page - route map, navigation, deep links per entity, list scaling (search, filter, pagination), settings layout and server-side permissions. Use when an app is a single giant component, has no URLs for its objects, or has settings and roles bolted on.
---

# unslop-structure

## Checks and fixes

1. **Route map.** Every noun gets a URL: list, detail, create. A user must be able to paste a link to one analysis, order, report or person. Add routes before adding features.
2. **Navigation.** At most 5 primary items. The core loop is the home. Settings, help and account sit in one place. Name items after what the user does, not after tables.
3. **Lists.** Search, filter by status and owner, sort, pagination or infinite scroll with a count. Never fetch details for every row on each refresh; list endpoints return what the row needs, detail is fetched on open.
4. **Detail pages.** One page per entity with status, history, actions. Destructive actions are last and separate.
5. **Settings layout.** Group by who it affects: Profile (me), Team (we), Integrations (outside), Defaults (how the product behaves), Data (export, delete). Env-only knobs that users should own move here.
6. **Permissions.** Define roles in one table. Enforce in the API; the UI only reflects it. Add `owner_id`/`team_id` to user data before the first second user arrives.
7. **Component size.** Split the monolith along routes first, then along reusable parts. Do not refactor for its own sake; split when a route needs it.
8. **Real-time.** Keep live updates but mark connection loss visibly and reconcile on reconnect.

## Output

A route table (existing / new), a navigation sketch, the role matrix, and the list of API changes (filters, pagination, ownership), each with the file it touches.
