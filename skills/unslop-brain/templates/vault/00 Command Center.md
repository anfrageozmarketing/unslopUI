---
type: dashboard
---
# Command Center

Visual overview: open the Command Center web app. In Obsidian this page works with the Dataview plugin.

## Offene Entscheidungen

```dataview
TABLE app, question
FROM "Apps"
WHERE type = "decision" AND state = "open"
```

## Flows ohne Umsetzung (MVP zuerst)

```dataview
TABLE app, area, status, prio
FROM "Apps"
WHERE type = "flow" AND (status = "missing" OR status = "partial")
SORT prio ASC
```

## Blocker

```dataview
TABLE app, where
FROM "Apps"
WHERE type = "finding" AND severity = "Blocker" AND state = "open"
```
