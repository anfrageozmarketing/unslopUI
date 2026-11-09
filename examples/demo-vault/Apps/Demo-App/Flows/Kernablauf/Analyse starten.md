---
type: flow
app: Demo-App
area: Kernablauf
title: Analyse starten
status: exists
prio: MVP
screens: ["/"]
endpoints: ["POST /api/analyze", "GET /api/events"]
evidence: 
updated: 2026-11-09
---
# Analyse starten

```mermaid
flowchart TD
  S[Domain eingeben] --> Q[queued]
  Q --> R{Ergebnis}
  R -- done --> D[Stellen anzeigen]
  R -- failed --> F[Fehler + Erneut versuchen]
```

## Soll

- Deep-Link auf eine Analyse fehlt
