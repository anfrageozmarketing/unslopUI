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

---

# Runde 2: Neugestaltung (Branch `ui-review`)

Auftrag der Hauptsitzung: Bold Icons, Glasmorphismus, mehr Bildsprache, interaktivere und minimalistischere Tabellen/Formulare, keine Serifen. API, Datenmodell und CSP sind unverändert (`server.mjs` nicht angefasst).
Screenshots (nur lokal, nicht im Repo): `/tmp/claude-0/-root/b2f0a340-d41f-49f7-95b0-8cb8f4055229/scratchpad/r1` bis `r5` (r1 nach dem ersten Umbau, r2 Popover/Palette, r3 Befunde/Undo/Schnell-Anlegen/Handy, r4 alle Tabs hell/dunkel 1280 und 360, r5 Startseite).

## Was gebaut wurde

- **Schrift:** nur serifenlos (System-Sans, Gewichte 750-800 in Überschriften, Zeichenabstand -0.02 bis -0.035em, tabellarische Ziffern). `--serif`/Georgia komplett entfernt. Keine eigene Schrift, daher keine CSP-Änderung.
- **Bold Icons:** eigenes Set in `app.js` (`ICONS`, `icon(name)`), 24-px-Raster, Strich 2.6, runde Enden. Eingesetzt als Struktur: Bereiche (Zugang Schlüssel, Onboarding Flagge, Kernablauf Route, Einstellungen Regler, System Server), Tabs, Aktionen (Suchen, Aktualisieren, Anlegen, Bearbeiten, Archivieren, Rückgängig, Zoom, Einpassen). Statusmarker bleiben die bisherigen CSS-Formen (Form plus Farbe), keine SVG-Icons.
- **Bildsprache:** `artSvg(app)` erzeugt deterministisch aus dem App-Namen ein Sternbild der Flows (Streckenlinien pro Bereich, Punkte nach Status und Priorität). In das Markup gehen nur Zahlen und weiß-gelistete Statusnamen. Verwendet als App-Kopf, Hintergrund der Startseiten-Zeilen, Seitenhintergrund hinter der Seitenleiste und Hintergrund des Bearbeiten-Bereichs. Die Flow-Leinwand ist weiter dunkel, aber ohne Violett-Verlauf: Raster, Vignette, Tiefe, Knoten in Teal/Bernstein/Orange, kein Glow.
- **Glas (eine Ebene):** Seitenleiste, schwebende Leinwand-Steuerung, Popover, Befehlspalette, Bearbeiten-Bereich. `backdrop-filter: blur(16px) saturate(1.4)` mit `-webkit-`, 1-px-Kante, Innenglanz, Fallback auf deckende Fläche. Kein Glas auf Glas, kein Glow, kein Verlaufstext. Regel in `skills/unslop-visual/SKILL.md` ("When glass is allowed").
- **Direktmanipulation:**
  - Statusmarker anklicken öffnet ein Glas-Popover mit den 5 Status (Pfeile, Enter, Esc; `role=listbox`). Gilt in der Flow-Seite und in "Als Nächstes bauen".
  - Priorität und Zustände (Befund/Entscheidung) als segmentierter Schalter, Schwere im Befund-Popover. Kein `<select>` mehr in der App-Ansicht und im Bearbeiten-Bereich.
  - Inline-Bearbeiten per Klick (Enter speichert, Esc bricht ab). Änderungen sind optimistisch, danach erscheint ein Hinweis mit "Rückgängig".
  - Neu anlegen als einzeilige Eingabe am Listenende, "Mehr" klappt die weiteren Felder auf. Die Formulare für Flow, Befund und Entscheidung sind weg.
  - Befehlspalette (Strg/Cmd+K, auch Knopf "Suchen" und `/`): Apps, Flows, Befunde, Entscheidungen, Aktionen (neu anlegen in der aktuellen App, aktualisieren). `role=dialog` mit Combobox/Listbox.
  - Tastatur: j/k springt durch Zeilen, Enter folgt dem Link. Zeilenaktionen (Behoben/Wieder öffnen) erscheinen erst bei Hover/Fokus, auf Touch immer.
  - Echte Tabellen gibt es nicht mehr (die Daten sind keine Tabellen), also auch keine sortierbaren Spaltenköpfe.

## Pro Screen

- **Startseite:** gesehen 1280 hell und 360 dunkel (r5), zuvor beide Größen und Schemata (r1, r4). Zeilen mit eigenem Bild, ein Eintrag in den Demo-Daten. Offen: bei nur einer App wirkt die Seite unter der Zeile leer; mit mehreren Apps nicht geprüft.
- **App-Ansicht Flows:** Kopf mit Bild, Tabs mit Icons, Routenkarte mit Bereichs-Icons, Schnell-Anlegen am Ende (r4). Behoben in Runde 1 des Umbaus: Hintergrundbild lief hinter die Routenkarte (Maske nun nur bis ca. 430 px), Knotenbeschriftung brach mitten im Wort ("zurücksetze n").
- **Aufmerksamkeit, Befunde, Entscheidungen:** Listen ohne Karten, Statusmarker/Schwere als Schalter, Zeilenaktion, Schnell-Anlegen. Per Skript bedient: j-Fokus, Schwere ändern, Rückgängig, Anlegen, Inline-Bearbeiten, alles ohne Fehler.
- **Flow-Leinwand:** neue dunkle Fläche, Steuerung als Glas mit Icons (44 px). Handy: lesbarer Mindestzoom wie in Runde 1.
- **Notizseite:** Bearbeiten-Bereich als Glas mit Bild; er klappte nach jeder Änderung zu, jetzt bleibt der Zustand erhalten (behoben).
- **Kopfzeile 360 px:** Brotkrümel werden dort ausgeblendet (waren unlesbar abgeschnitten).

## Prüfungen

- `node --test tests/`: 16 von 16 grün. Neu im Smoke-Runner: Seed-Bild (deterministisch, unterscheidet Apps, enthält keinen Text aus Daten), Palette (Filter, Aktionen nur in einer App), Icon-Set, kein `<select>`, Schnell-Anlegen in allen Tabs, Hero vorhanden.
- Kein horizontales Scrollen bei 360 px (Startseite, App, Flow), keine Konsolenfehler.
- Kontrast: gerechnet, nicht pixelgemessen. Text auf Glas 9 bis 12:1, Muted-Text im ungünstigsten Fall (stärkste Bildlinie darunter) 5,0 bis 5,5:1 nach dem Dichterstellen des Glases (vorher 4,2 bis 4,3:1).

## Offen / nicht geprüft

- Dunkel 1280 für Startseite und Notizseite sowie hell 360 für einige Tabs nur teilweise angesehen (alle Routen per Skript ohne Fehler, aber nicht jedes Bild einzeln beurteilt).
- Kontrast wurde nicht mit einem Messwerkzeug an echten Pixeln geprüft, nur gerechnet.
- Tastaturpfad im Popover (Pfeile/Esc) und Palette per Skript geprüft; Screenreader nicht.
- Status "Gebaut" ohne Nachweis fragt weiter per `confirm()`-Dialog; bei anderen Fehlern kommt nur ein Hinweis.
- Mobil überlagert das Bildmuster im App-Kopf teils den Text "Score" (abgeschwächt, nicht ganz weg).
- Sortierbare Tabellenköpfe entfallen, weil es keine echten Tabellen gibt.
- Mit vielen Apps oder sehr vielen Flows nicht getestet (Seed-Bild, Palette mit mehr als 40 Treffern).

---

# Runde 3: kräftigere Bildsprache, sichtbares Glas, größere Leinwand-Knoten

Screenshots (nur lokal): `/tmp/claude-0/-root/b2f0a340-d41f-49f7-95b0-8cb8f4055229/scratchpad/` in `s1` (erster Stand Runde 3), `s2` (gescrollt, Leinwand), `s3` (alle Seiten, 28 Seiten-Bilder plus je Tab, Popover, Palette; hell/dunkel, 1280 und 360), `s4` (nach den Korrekturen), `c1` (Kontrastmessung). Getestet mit einem Temp-Vault mit 3 Apps (`PREVIEW_VAULT=.../scratchpad/vault3`; `dev-preview.mjs` kennt jetzt diese Variable, `examples/demo-vault` blieb unverändert).

## 1. Bildsprache

- **Gesehen / falsch:** Haarlinien und kleine graue Punkte, wirkten wie zufällige Kreise.
- **Geändert:** `artSvg` komponiert jetzt große flache Flächen (Kreise und gedrehte Pillen) in Statusfarben (Deckkraft 0,24), dicke Routenlinien pro Bereich (9 px, Farbe = häufigster Status des Bereichs) und große Knoten. Jeder Bereich hat eine eigene Form (Zugang Quadrat, Onboarding Dreieck, Kernablauf Kreis, Einstellungen Raute, System Sechseck); Größe nach Priorität, Status: leer/gefüllt/halb. Weiter deterministisch aus dem App-Namen, nur Zahlen und weiß-gelistete Namen im Markup (Test).
- **Eingesetzt:** App-Kopf (Hero, Text links frei, Bild rechts), Startseite als Zeilen mit großem Bild rechts (mindestens 220 px hoch, auch mit einer App nicht leer), Seitenhintergrund hinter der Seitenleiste (mit Farbflächen am linken Rand), Bearbeiten-Feld. Handy: Bild als Streifen am unteren Rand der Karte, damit kein Text darüber liegt. "Score" steht nun links in der Zusammenfassung des Kopfs, nicht mehr im Bild.

## 2. Glas

- **Gesehen / falsch:** In Hell kaum erkennbar, weil nichts dahinter lag.
- **Geändert:** Die Farbflächen aus 1) liegen unter Seitenleiste, Bearbeiten-Feld, Popover und Palette (Hell und Dunkel); auf der Leinwand liegen harte, flache Farbfelder (Teal, Orange) unter der Steuerung. Weiter nur eine Ebene.
- **Im Screenshot geprüft:** Seitenleiste (s1, s3), Bearbeiten-Feld (s4 `finding-1280-light`), Popover auf der Leinwand (s3 `popover-1280-dark`), Palette (s3 `palette-1280-light`). Zuvor lag die Maske des Hintergrunds 90 px über die Seitenleiste hinaus (senkrechtes Band neben der Leiste); jetzt endet sie an der Kante.

## 3. Leinwand

- **Gesehen / falsch:** Knotenschrift beim Einpassen ca. 9 px, Diagramm klein in der Mitte.
- **Geändert:** Knoten 180x72 (Weiche 80), Schrift 17 px, Kantenbeschriftung 16 px, Weichen-Beschriftung 15 px, Abstände 84 px und kleinerer Rand, damit der Ablauf die Fläche füllt.
- **Gemessen bei 1280 px (Login):** Zoom 0,73, Knotenschrift 12,4 px, Kantenbeschriftung 11,7 px (nach Anhebung auf 16 px; vor der Anhebung 10,9 px gemessen). Handy: Mindestzoom 0,8, also Knotenschrift ca. 13,6 px (gerechnet, nicht gemessen).
- **Bedient und geprüft:** Zoom +/− (Buttons), Verschieben per Maus, Mausrad-Zoom, Tasten `+` `-` `0`, Einpassen-Button: Transformationen ändern sich jeweils wie erwartet, Einpassen stellt den Ausgangszustand wieder her, keine Fehler.

## 4. Offene Punkte aus Runde 2, erledigt

- **Jede Seite einzeln angesehen:** Startseite, App (Flows), Aufmerksamkeit, Befunde, Entscheidungen, Notizseiten Flow/Befund/Entscheidung (Bearbeiten-Feld offen), Popover, Palette, hell und dunkel bei 1280 und 360 (s3). Stichproben bewusst beurteilt: Startseite 360 hell, App 360 dunkel, Befund 1280 hell, Login 1280 dunkel, Popover/Palette 1280. Die übrigen Bilder per Skript auf Fehler und Seitwärtsscrollen geprüft (28 Kombinationen: keine Konsolenfehler, `scrollWidth` = Viewportbreite), aber nicht alle einzeln beurteilt.
- **Mehrere Apps:** Startseite, Seitenleiste (Blocker-Marker, Striche pro App) und Palette (Apps, Flows, Befunde aus allen drei) mit 3 Apps angesehen. Mit sehr vielen Apps nicht getestet.
- **Tap-Ziele bei 360 px (unter 44 px gefunden und behoben):** Marke "Command Center" (20 px hoch), Schalter MVP/V1/V2 (40 px), Zustandsschalter Befund/Entscheidung und Schwere (40 px), Eingabefeld Schnell-Anlegen/Bereich (39 px), Zeilenlinks in "Als Nächstes bauen" (40 px). Nach der Korrektur kein erneuter Gesamtscan, nur die Änderungen in CSS (siehe Offen).
- **Seitenleiste beim Scrollen:** bleibt sichtbar (Oberkante 57 px, Unterkante = Viewport-Unterkante bei Scroll 125 von 125 px); die Lücke im vollen Seiten-Screenshot war ein Artefakt von `fullPage`.
- **Kontrast an echten Pixeln:** Textfarbe aus dem Browser, Hintergrund aus den freien Randzeilen über und unter dem Text im Screenshot, schlechtester Pixel. 32 Textproben (Seitenleiste, Zusammenfassung, Karten, Bearbeiten-Feld, Popover, Palette; hell und dunkel): niedrigster Wert 5,1:1. Nicht messbar mit dieser Methode (Überschriften und der Rahmen des aktiven Tabs füllen das Textband): `h1`, Tab, Zeilen-`h2`.

## Offen / nicht geprüft

- Nach den Tap-Ziel-Korrekturen und der Handy-Maske kein vollständiger zweiter Scan; nur die Bereiche aus den Screenshots (s4) wurden erneut gesehen.
- Kontrast der Statusfarben als Linien und Marker im Bild wurde nicht gemessen (kein Text); Marker bleiben zusätzlich über die Form lesbar.
- Handy-Knotenschrift auf der Leinwand gerechnet (0,8 x 17 px), nicht gemessen.
- Palette und Seed-Bild mit sehr vielen Apps oder mehr als 40 Treffern nicht getestet.
- Screenreader nicht geprüft.
