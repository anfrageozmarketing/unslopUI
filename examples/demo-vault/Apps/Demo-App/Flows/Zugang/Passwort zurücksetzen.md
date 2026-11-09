---
type: flow
app: Demo-App
area: Zugang
title: Passwort zurücksetzen
status: missing
prio: MVP
screens: ["/forgot", "/reset/:token"]
endpoints: ["POST /api/auth/forgot", "POST /api/auth/reset"]
evidence: 
updated: 2026-11-09
---
# Passwort zurücksetzen

```mermaid
flowchart TD
  A[E-Mail eingeben] --> B[Immer gleiche Antwort]
  B --> C[Mail mit Einmal-Link]
  C --> D[Neues Passwort]
  D --> E[Eingeloggt, andere Sessions beendet]
```

## Soll

- Link 60 Minuten gültig, einmal nutzbar
