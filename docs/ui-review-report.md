# UI-Review des Command Centers (Branch `ui-review`)

Geprüft mit Playwright-MCP gegen die Demo-Vorschau (`scripts/dev-preview.mjs`, nur Demo-Daten).
Die Produktivinstanz wurde nicht angefasst.

## Was geprüft wurde, und was nicht

**Geprüft:**
- Flow-Leinwand `Zugang/Login` bei 1280x900 (hell) und 360x800 (dunkel).
- Flow-Leinwand `Kernablauf/Analyse starten` bei 1280x900 (hell).
- Alle vier Routen (`#/`, `#/app/Demo-App`, beide Flow-Seiten) bei 360 px, hell und dunkel, nur per Skript: kein horizontales Scrollen (`scrollWidth` = 360), Konsole ohne Fehler außer dem Favicon-404, der behoben ist.

**Nicht geprüft (ehrlich):**
- Startseite `#/` und Routenkarte `#/app/Demo-App` wurden nie per Screenshot angesehen, auch nicht die Tabs Aufmerksamkeit, Befunde, Entscheidungen, die Legenden-Chips, `+ Neuer Flow`, die Notizseiten (Entscheidung/Befund) und das Bearbeiten-Ausklappfeld.
- Dunkelmodus bei 1280 px und Hellmodus bei 360 px nur für die Maße oben, nicht visuell.
- Ziehen, Mausrad-Zoom, Tastatur (`+` `-` `0`) und die Buttons wurden nicht bedient; nur das Einpassen beim Laden wurde gesehen.
- Kontrastverhältnisse wurden nicht gemessen.
- Die Prüfpunkte aus `unslop-components` und `unslop-visual` wurden nicht Punkt für Punkt abgehakt.

## Flow-Leinwand

**Gesehen / falsch:**
1. Das Diagramm war in der Leinwand winzig (Einpassen deckelte auf Zoom 1, Leinwand fix 360-620 px hoch); große leere Fläche, Text kaum lesbar.
2. Eine Kante, die eine Ebene überspringt (Login: "Session gültig?" -> Workspace), lief hinter dem Knoten "Login" und der zweiten Weiche durch; ihre "ja"-Beschriftung saß auf der Linie.
3. Handy (360 px): Einpassen verkleinerte auf ca. 0,3, Knoten komplett unlesbar.
4. Zoom-Buttons ca. 30 px hoch, unter dem Tap-Ziel von 44 px.
5. Beschriftungen unter den Weichen (Kreise) und die Kantenbeschriftungen `done`/`failed`/`nein` waren im gesehenen Ausschnitt nicht abgeschnitten und überlappten nicht.

**Geändert** (`public/app.js`, `public/style.css`):
- Einpassen darf bis Zoom 1,5 vergrößern; die Leinwandhöhe richtet sich nach dem Diagramm (300-620 px, max. 80vh).
- Neue Routenführung (`edgePath`): überspringende Kanten werden über bzw. unter die Knoten dazwischen gelegt, Beschriftung wandert mit.
- Schmale Leinwand (< 600 px): Mindestzoom 0,8 beim Einpassen, Start am linken Rand; der Rest wird per Schwenken erreicht.
- Zoom-Buttons mindestens 44x44 px.
- Test in `tests/ui-smoke-runner.mjs`: überspringende Kante wird umgeleitet, benachbarte bleibt eine einfache Kurve.

**Offen:**
- Auf dem Handy sieht man nach dem Laden nur den Anfang des Ablaufs. "Einpassen" bringt ihn nicht ganz ins Bild (Mindestzoom); ein Hinweis zum Schwenken fehlt.
- Schleifen (Rückkanten) und große Diagramme (Analyse starten ist klein) wurden nicht mit einem echten großen Beispiel angesehen; Rückkanten nur im Test, nicht visuell.
- Die Leinwand bleibt im Hellmodus bewusst dunkel (Designentscheidung, nicht geändert).
- Kantenbeschriftungen sitzen als Pillen auf den Linien; bei sehr dichten Diagrammen könnten sie sich weiterhin überlappen.

## Alle Seiten

- Favicon-404 behoben (`<link rel="icon" href="data:,">`, CSP unverändert).
- Kopfzeile bei 360 px: die Brotkrümel werden mitten im Wort abgeschnitten ("Apps / De"). Offen.
- Bei 360 px haben 2 bis 7 Links/Buttons pro Seite eine Höhe unter 32 px (Tap-Ziel < 44 px). Welche genau, nicht untersucht. Offen.

## Prüfung

`node --test tests/`: 16 von 16 grün.
