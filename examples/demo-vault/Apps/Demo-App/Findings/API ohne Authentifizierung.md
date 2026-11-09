---
type: finding
app: Demo-App
severity: Blocker
state: open
where: backend/app/main.py
---
# API ohne Authentifizierung

**Was:** Alle `/api/*`-Routen sind ohne Anmeldung erreichbar.
**Warum es zählt:** Jeder kann Berichte per Mail auslösen.
**Kleinster Fix:** Login und Session, bis dahin Zugangsschutz am Proxy.
