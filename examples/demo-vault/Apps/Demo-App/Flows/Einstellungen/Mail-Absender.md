---
type: flow
app: Demo-App
area: Einstellungen
title: Mail-Absender
status: missing
prio: V1
screens: ["/settings/mail"]
endpoints: ["GET/PUT /api/settings/mail"]
evidence: 
updated: 2026-11-09
---
# Mail-Absender

```mermaid
flowchart LR
  A[Settings] --> B[Absender + Signatur] --> C[Testversand]
```

## Soll

- Heute nur als Umgebungsvariable
