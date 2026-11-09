#!/usr/bin/env node
// Writes a SYNTHETIC vault with realistic volume for UI checks: 3 apps, ~50 flows, long titles, loops, notes without diagrams.
// All names and texts are invented. Usage: node scripts/make-stress-vault.mjs <outDir>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const out = resolve(process.argv[2] || './stress-vault');
const D = '2026-11-09';
const w = (rel, s) => { const p = join(out, rel); mkdirSync(join(p, '..'), { recursive: true }); writeFileSync(p, s); };
const ST = ['missing', 'missing', 'partial', 'exists', 'built', 'na'];
const areas = { Zugang: ['Anmelden', 'Abmelden und Sitzung beenden', 'Passwort zurücksetzen', 'Einladung annehmen', 'Zwei-Faktor einrichten', 'Anmeldung mit Firmenkonto'],
  Onboarding: ['Willkommen und Ziel wählen', 'Erste Analyse mit Beispieldaten starten', 'Checkliste für die erste Woche'],
  Kernablauf: ['Analyse starten', 'Ergebnis prüfen und freigeben', 'Bericht erstellen und per Mail versenden', 'Liste importieren und Dubletten bereinigen', 'Export als Tabelle und als Dokument', 'Wiederholung nach Zeitplan einrichten', 'Änderungen gegenüber der letzten Analyse vergleichen'],
  Einstellungen: ['Profil und Sprache', 'Absender und Signatur', 'Benachrichtigungen', 'Team und Rollen verwalten', 'Schnittstellen und Zugangsschlüssel'],
  System: ['Fehlerseiten', 'Rechtliche Hinweise', 'Datenexport und Konto löschen', 'Protokoll der Änderungen', 'Gesundheitsprüfung und Warteschlange'] };
const diagram = (i) => (i % 3 === 0 ? null : i % 3 === 1
  ? 'flowchart TD\n  A[Start] --> B{Eingabe gültig?}\n  B -- ja --> C[Speichern]\n  B -- nein --> D[Fehler zeigen]\n  D --> A\n  C --> E([Fertig])'
  : 'flowchart LR\n  A[Öffnen] --> B[Prüfen]\n  B --> C{Alles okay?}\n  C -- ja --> D[Weiter]\n  C -- nein --> E[Korrigieren]\n  E --> B\n  D --> F[Abschluss]');
const apps = [['Atlas', 'React + FastAPI', 'https://atlas.example'], ['Beacon', 'Node + SQLite', 'https://beacon.example'], ['Cedar', 'Python', '']];
let n = 0;
for (const [ai, [name, stack, url]] of apps.entries()) {
  w(`Apps/${name}/_App.md`, `---\ntype: app\nname: ${name}\nscore: ${12 + ai * 4}\nstack: ${stack}\nurl: ${url}\nupdated: ${D}\n---\n# ${name}\n`);
  for (const [area, titles] of Object.entries(areas)) {
    titles.forEach((t, k) => {
      if (ai === 2 && k > 1) return; // the third app is small
      n++; const status = ST[(n + ai) % ST.length]; const prio = ['MVP', 'V1', 'V2'][(n + k) % 3]; const d = diagram(n);
      w(`Apps/${name}/Flows/${area}/${t}.md`, `---\ntype: flow\napp: ${name}\narea: ${area}\ntitle: "${t}"\nstatus: ${status}\nprio: ${prio}\nscreens: ["/${area.toLowerCase()}/${k}", "/${area.toLowerCase()}/${k}/detail"]\nendpoints: ["GET /api/${area.toLowerCase()}/${k}", "POST /api/${area.toLowerCase()}/${k}"]\nevidence: ${status === 'built' ? '"Test grün"' : ''}\nreason: ${status === 'na' ? '"Brauchen wir für diese App nicht"' : ''}\nupdated: ${D}\n---\n# ${t}\n\n${d ? `\`\`\`mermaid\n${d}\n\`\`\`\n\n` : ''}## Soll\n\n- Erster Punkt dieses Flows\n- Zweiter Punkt mit längerem Text, der umbrechen muss\n- Dritter Punkt\n\n## Lücken\n\n- Noch offen: ${t}\n`);
    });
  }
  for (let i = 1; i <= 8; i++) w(`Apps/${name}/Findings/Befund ${i} mit einem etwas längeren Titel.md`, `---\ntype: finding\napp: ${name}\nseverity: ${['Blocker', 'Gap', 'Rough', 'Polish'][i % 4]}\nstate: ${i % 5 === 0 ? 'fixed' : 'open'}\nwhere: "src/modul${i}/datei.js"\n---\n# Befund ${i}\n\n**Was:** Beschreibung ${i}.\n`);
  for (let i = 1; i <= 5; i++) w(`Apps/${name}/Entscheidungen/Entscheidung ${i}.md`, `---\ntype: decision\napp: ${name}\nstate: ${i % 3 === 0 ? 'decided' : 'open'}\nquestion: "Soll Variante ${i} oder die ganz andere Lösung mit dem sehr langen Namen gewählt werden?"\nanswer: ${i % 3 === 0 ? '"Variante A"' : ''}\n---\n# Entscheidung ${i}\n`);
}
console.log(`stress vault: ${out} (${n} flows)`);
