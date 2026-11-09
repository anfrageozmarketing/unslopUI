---
type: flow
app: Demo-App
area: System
title: Fehlerseiten
status: built
prio: V1
screens: ["/404", "/403"]
endpoints: []
evidence: Playwright-Test e2e_ui: 404 und 403 rendern in der App-Shell
updated: 2026-11-09
---
# Fehlerseiten

```mermaid
flowchart LR
  A[Unbekannte URL] --> B[404-Seite] --> C[Zurück zur Startseite]
```

## Soll

- Offline-Seite folgt
