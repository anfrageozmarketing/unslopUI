---
type: flow
app: Demo-App
area: Kernablauf
title: Bericht senden
status: partial
prio: MVP
screens: ["/"]
endpoints: ["POST /api/companies/{id}/report/draft", "POST /api/companies/{id}/report/{rid}/send"]
evidence: 
updated: 2026-11-09
---
# Bericht senden

```mermaid
flowchart TD
  A[Entwurf] --> B[Text prüfen] --> C[Empfänger] --> D{Bestätigen}
  D -- ja --> E[Versand]
```

## Soll

- Testversand und Versandhistorie fehlen
