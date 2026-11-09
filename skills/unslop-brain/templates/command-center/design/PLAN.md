# Command Center: Designplan

Gilt, bis er bewusst geändert wird. Reihenfolge: Komponenten, dann Screens, dann Feinschliff. Aufnahmen nur an den Prüfpunkten unten.

## 1. Regeln
1. **Komponenten zuerst.** Jeder Bereich wird erst aus Bausteinen gedacht, die wir in der Galerie (`#/_components`) prüfen. Ein Screen ist eine Komposition aus diesen Bausteinen.
2. **Keine Trennlinien.** Gruppen trennen Abstand und Flächenton (Fläche gegen Hintergrund). Keine Rahmen um Gruppen, keine Linien zwischen Zeilen. Ausnahmen: Fokusring, echte Tabelle.
3. **Direkt bearbeiten.** Wert antippen und ändern, am Ort des Werts. Kein Formular mit Feldern und Speichern. Jede Änderung sofort, mit Rückgängig.
4. **Wenig Text.** Kurze Namen (höchstens zwei Wörter), keine Hilfesätze, leere Zustände sind ein Bild und ein Verb.
5. **Eine Hauptaktion pro Screen.**
6. **Eigene Teile nur dort, wo die Idee des Produkts liegt** (Streckenplan, Leinwand, Streifen, App-Bild). Alles andere kommt aus HeroUI.

## 2. Screens
| Screen | Aufgabe | Hauptaktion | Leitbaustein |
|---|---|---|---|
| Apps | Sehen, welche App Aufmerksamkeit braucht | App öffnen | AppKarte (Bild, Streifen, eine Zahl) |
| App: Flows | Den Ablauf der App überblicken | Flow anlegen | Streckenplan |
| App: Fokus | Das Wichtigste zuerst | Eintrag öffnen | Fokusliste |
| App: Befunde | Probleme pflegen | Befund anlegen | Zeile mit Direktaktionen |
| App: Entscheidungen | Fragen beantworten | Antworten | Frage als Überschrift, Antwort inline |
| Flow | Einen Flow verstehen und pflegen | Status ändern | Leinwand und Eigenschaftenliste |
| Notiz (Befund, Entscheidung) | Eintrag lesen und pflegen | Status ändern | Eigenschaftenliste und Text |
| Suche | Überallhin springen | Springen | Palette (Strg+K) |

Navigation: Desktop linke Leiste mit App-Kacheln (Bild, Statusring). Handy untere Leiste: Apps, Suchen, Aktualisieren; App-Wechsel über die Kacheln oben.

## 3. Bausteine
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
| Tabs | HeroUI Tabs (ohne Rahmen) | |
| Streckenplan, Leinwand, Streifen, App-Bild | eigen | |
| Leerer Zustand | Illustration + HeroUI Button | |
| Hinweis mit Rückgängig | HeroUI Toast | |
| Palette | HeroUI Modal + SearchField | |
| Texteditor | HeroUI Modal, Vorschau daneben | Text nur auf Wunsch |

## 4. Bearbeitungsmuster
Status: Popover. Priorität: Segment. Titel, Nachweis, Antwort, Begründung: InlineText. Screens, Endpoints: TokenFeld. Entscheidung entschieden oder offen: Segment. Befund Schwere: Popover. Archivieren: sofort, Hinweis mit Rückgängig, kein Dialog. Anlegen: Zeile am Listenende.

## 5. Inhalt
Beschriftungen kurz. Keine Hilfetexte außer bei Fehlern. Deutsch, Du. Leere Zustände: Bild, ein Verb ("Flow anlegen").

## 6. Reihenfolge und Prüfpunkte
1. **P0 Theme:** Tokens, Rahmen aus (`--border-width: 0`), Radius, Schrift.
2. **P1 Galerie:** alle Bausteine in allen Zuständen unter `#/_components`, hell und dunkel, 1280 und 360 px. Aufnahmen, Durchsicht, Korrektur.
3. **P2 Apps und App (Flows, Fokus).**
4. **P3 Flow und Notiz.**
5. **P4 Befunde, Entscheidungen, Suche.**
6. **Deploy** erst, wenn P4 abgenommen ist.

An jedem Prüfpunkt: Aufnahmen durch das Browserwerkzeug (nur Bilder und Zahlen zu Überlauf und Konsole), Durchsicht und Entscheidung durch die gestaltende Sitzung, die wichtigsten Bilder gehen an dich.
