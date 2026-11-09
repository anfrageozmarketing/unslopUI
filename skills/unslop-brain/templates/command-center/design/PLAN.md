# Command Center: Designplan

Gilt, bis er bewusst geändert wird. Reihenfolge: Komponenten, dann Screens, dann Feinschliff. Aufnahmen nur an den Prüfpunkten unten.

## 1. Regeln
1. **Komponenten zuerst.** Jeder Bereich wird erst aus Bausteinen gedacht, die wir in der Galerie (`#/_components`) prüfen. Ein Screen ist eine Komposition aus diesen Bausteinen.
2. **Keine Trennlinien.** Gruppen trennen Abstand und Flächenton (Fläche gegen Hintergrund). Keine Rahmen um Gruppen, keine Linien zwischen Zeilen. Ausnahmen: Fokusring, echte Tabelle.
3. **Direkt bearbeiten.** Wert antippen und ändern, am Ort des Werts. Kein Formular mit Feldern und Speichern. Jede Änderung sofort, mit Rückgängig.
4. **Wenig Text.** Kurze Namen (höchstens zwei Wörter), keine Hilfesätze, leere Zustände sind ein Bild und ein Verb.
5. **Eine Hauptaktion pro Screen.**
6. **Menschlich und interaktiv.** Hover, Druck, Fokus und Erfolg sind sichtbar, Ziele mindestens 44 px, klare Sprache.
7. **Kontrast durch Ebenen:** Shell, Fenster, angehobene Teile. Keine Linien.
8. **Eigene Teile nur dort, wo die Idee des Produkts liegt** (Streckenplan, Leinwand, Streifen, App-Bild). Alles andere kommt aus HeroUI.

## 2. Shell und Screens

**Shell** (Muster: `unslop-foundation/references/designer-standard.md`, App-Shell):
- **Leiste** links (64 px): App-Icon oben. Darunter ein Knopf je Bereich: Apps, Flows, Fokus, Befunde, Entscheidungen. Unten: Suche, Hell/Dunkel, Aktualisieren. Aktiv: angehobene Kachel mit weichem Schatten und vollem Icon, dazu eine dünne Akzentlinie ganz am Rand. Inaktiv: graues Icon.
- **Kontextspalte** (240 px): Titel des Bereichs, darunter die Apps als Unterordner (mit Streifen; bei Flows aufklappbar in Bereiche). Unten: Statusinfo (Vault, letzte Sicherung, Abdeckung).
- **Fenster**: abgerundeter Container (24 px) mit Abstand zum Rand, darin der Inhalt des Bereichs. Dunkel: Fenster deutlich heller als die Shell. Hell: Fenster weiß auf hellgrauer Shell.
- **Handy:** Leiste wird untere Leiste, Kontextspalte wird eine Titelzeile mit App-Wechsel, Fenster randlos mit runden oberen Ecken.

| Bereich (Leiste) | Kontextspalte | Fenster zeigt | Hauptaktion | Leitbaustein |
|---|---|---|---|---|
| Apps | Apps | Kacheln aller Apps | App öffnen | AppKarte (Bild, Streifen, eine Zahl) |
| Flows | Apps und deren Bereiche | Streckenplan der gewählten App | Flow anlegen | Streckenplan |
| Fokus | Apps | Blocker, offene Entscheidungen, als Nächstes | Eintrag öffnen | Fokusliste |
| Befunde | Apps | Befunde der App | Befund anlegen | Zeile mit Direktaktionen |
| Entscheidungen | Apps | Fragen der App | Antworten | Frage als Überschrift, Antwort inline |
| Flow (aus Flows) | wie Flows | Leinwand und Eigenschaftenliste | Status ändern | Leinwand |
| Notiz | wie Befunde/Entscheidungen | Eigenschaftenliste und Text | Status ändern | Eigenschaftenliste |
| Suche | | Palette über der Shell (Strg+K) | Springen | Palette |

Adressen: `#/apps`, `#/flows/<App>`, `#/focus/<App>`, `#/findings/<App>`, `#/decisions/<App>`, `#/note/<Pfad>`, `#/_components`.

## 3. Vorschau und Workspace

Jeder Bereich hat zwei Ebenen. **Vorschau:** visuell auf einen Blick, kein Listen- oder Tabellenlook. **Workspace:** Klick auf ein Element öffnet einen Arbeitsmodus. Das Fenster wächst (Kontextspalte klappt weg), eine schmale Werkzeugleiste aus Glas schwebt am Rand, Bearbeiten geschieht visuell, Autospeichern mit Rückgängig, Ausgang über Zurück-Knopf und Esc, Eigenschaften des gewählten Objekts in einem schwebenden Panel.

| Bereich | Vorschau | Workspace | Visuelles Bearbeiten |
|---|---|---|---|
| Apps | AppKarte: Bild der App, Streifen, eine Zahl | Streckenplan der App | |
| Flows | **Landkarte der Bereiche:** je Bereich (Zugang, Onboarding ...) eine Region mit Fortschrittsring und seinen Flows als Punkte, MVP größer | **Flow-Workspace:** eine Leinwand je Flow | Schritt hinzufügen (Plus am Ende und an Kanten), Weiche setzen, Knoten umbenennen und löschen, Knoten über die Ports verbinden, Kanten beschriften, Status per Klick. Die Anordnung bleibt automatisch; gespeichert wird als Mermaid |
| Fokus | Stapel aus Aufmerksamkeitskarten, Blocker mit roter Kante | **Triage-Workspace:** Spalten Jetzt, Später, Erledigt | Karten ziehen |
| Befunde | **Schwere-Landschaft:** Spalten Blocker, Gap, Rough, Polish, Höhe nach Anzahl, Karten im Stapel | **Board:** Spalten Offen, Behoben, Nicht beheben, Reihen nach Schwere | Karte auf eine Spalte ziehen setzt den Status; Karte anklicken öffnet das Panel |
| Entscheidungen | **Gabelkarten:** Frage groß, Optionen als Chips, offen oder entschieden | **Entscheidungs-Workspace:** Optionen als Karten nebeneinander mit kurzem Pro und Contra | Karte wählen setzt die Antwort |

Grenze, ehrlich: Mermaid kennt keine Koordinaten. Knoten werden deshalb nicht frei verschoben, sondern automatisch angeordnet. Visuell bearbeitet wird die Struktur.

## 4. Bausteine
| Baustein | Basis | Bearbeiten |
|---|---|---|
| StatusSchalter | HeroUI Popover + ListBox, eigener Marker | Marker antippen, Auswahl |
| PrioSegment | HeroUI ToggleButtonGroup | in place |
| Filterchips | HeroUI ToggleButtonGroup | in place |
| Eigenschaftenzeile (Name links, Wert rechts) | eigen | Wert bearbeiten, Autospeichern |
| InlineText | HeroUI Input | Klick, Enter speichert, Esc bricht ab |
| TokenFeld (Screens, Endpoints) | HeroUI Chip + Input | Tippen, Enter fügt hinzu, x entfernt |
| Schnellanlegen | eigen + HeroUI Input | eine Zeile am Listenende |
| Zeile (flach, ohne Linie) | eigen | Aktionen bei Hover, auf Touch sichtbar |
| Leiste, Kontextspalte, Fenster (Shell) | eigen mit Tailwind | |
| Tabs | entfallen (die Leiste trägt die Bereiche) | |
| Streckenplan, Leinwand, Streifen, App-Bild | eigen | |
| Leerer Zustand | Illustration + HeroUI Button | |
| Hinweis mit Rückgängig | HeroUI Toast | |
| Palette | HeroUI Modal + SearchField | |
| Texteditor | HeroUI Modal, Vorschau daneben | Text nur auf Wunsch |

## 5. Bearbeitungsmuster
Status: Popover. Priorität: Segment. Titel, Nachweis, Antwort, Begründung: InlineText. Screens, Endpoints: TokenFeld. Entscheidung entschieden oder offen: Segment. Befund Schwere: Popover. Archivieren: sofort, Hinweis mit Rückgängig, kein Dialog. Anlegen: Zeile am Listenende.

## 6. Inhalt
Beschriftungen kurz. Keine Hilfetexte außer bei Fehlern. Deutsch, Du. Leere Zustände: Bild, ein Verb ("Flow anlegen").

## 7. Reihenfolge und Prüfpunkte
1. **P0 Theme und Shell:** Tokens (neu: `--shell`, `--window`), Rahmen aus (`--border-width: 0`), Radius, Schrift, Leiste, Kontextspalte, Fenster.
2. **P1 Galerie:** alle Bausteine in allen Zuständen unter `#/_components`, hell und dunkel, 1280 und 360 px.
3. **P2 Vorschau:** Apps, Flows (Landkarte der Bereiche), Fokus, Befunde, Entscheidungen als visuelle Vorschau. Erster Stand auf dem Server.
4. **P3 Flow-Workspace:** visuelles Bearbeiten der Abläufe.
5. **P4 Board- und Entscheidungs-Workspace, Suche, Feinschliff.**
6. **Deploy** nach P2 (erster vollständiger Stand) und dann je Prüfpunkt.

An jedem Prüfpunkt: Aufnahmen durch das Browserwerkzeug (nur Bilder und Zahlen zu Überlauf und Konsole), Durchsicht und Entscheidung durch die gestaltende Sitzung, die wichtigsten Bilder gehen an dich.
