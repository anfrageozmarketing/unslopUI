// Pure-logic tests (node --test). The UI itself is verified with screenshots.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFlow, layoutFlow, edgePath, sollChain, takeMermaid, splitSections } from './flow.js';
import { filterPalette, paletteItems, parseHash, nextFlows, areasOf, summaryParts, splitList, safeUrl } from './model.js';

const SAMPLE = `flowchart TD
  A[Seite öffnen] --> B{Session gültig?}
  B -- ja --> W[Workspace]
  B -- nein --> L[Login]
  L --> C{Daten korrekt?}
  C -- ja --> W
  C -- nein --> E[Fehler + Zähler]
  E -- 5 Fehlversuche --> K[Sperre 15 Min]`;

test('parseFlow reads nodes, shapes and labelled edges', () => {
  const g = parseFlow(SAMPLE);
  assert.equal(g.nodes.length, 7); assert.equal(g.edges.length, 7);
  assert.ok(g.edges.some((e) => e.from === 'B' && e.to === 'W' && e.label === 'ja'));
  assert.ok(g.edges.some((e) => e.from === 'E' && e.to === 'K' && e.label === '5 Fehlversuche'));
  assert.equal(g.nodes.find((n) => n.id === 'B').shape, 'decision');
  assert.equal(parseFlow('').nodes.length, 0);
});

test('layoutFlow goes left to right, finite, kinds set, cycles give back edges', () => {
  const g = parseFlow(SAMPLE); const l = layoutFlow(g);
  const x = (id) => l.pos.get(id).x;
  assert.ok(x('A') < x('B') && x('B') < x('L') && x('L') < x('C') && x('C') < x('E') && x('E') < x('K'));
  for (const p of l.pos.values()) assert.ok([p.x, p.y, p.w, p.h].every(Number.isFinite));
  const k = Object.fromEntries(g.nodes.map((n) => [n.id, n.kind]));
  assert.deepEqual([k.A, k.B, k.K], ['start', 'router', 'end']);
  assert.equal(layoutFlow(parseFlow('flowchart LR\n A-->B\n B-->C\n C-->A')).back.size, 1);
});

test('edges that skip a layer are lifted over the nodes in between', () => {
  const g = parseFlow(SAMPLE); const l = layoutFlow(g); const others = [...l.pos.values()];
  const skip = g.edges.find((e) => e.from === 'B' && e.to === 'W');
  const direct = g.edges.find((e) => e.from === 'A' && e.to === 'B');
  const p1 = edgePath(l.pos.get(skip.from), l.pos.get(skip.to), false, others);
  const p2 = edgePath(l.pos.get(direct.from), l.pos.get(direct.to), false, others);
  assert.match(p1.d, /L/); assert.ok(!/L/.test(p2.d));
});

test('sollChain, takeMermaid, splitSections', () => {
  const sc = sollChain('Login', [{ title: 'Soll', md: 'E-Mail + Passwort, generische Fehlermeldung, Rate-Limit pro IP und Konto.' }]);
  assert.equal(sc.nodes.length, 4); assert.equal(sc.edges.length, 3);
  assert.equal(sollChain('X', [{ title: 'Lücken', md: 'a' }]), null);
  const t = takeMermaid('# T\n\n```mermaid\nflowchart TD\n A-->B\n```\n\n## Soll\n- x');
  assert.match(t.code, /A-->B/); assert.ok(!t.rest.includes('mermaid'));
  const s = splitSections('# Titel\n\nintro\n\n## Soll\n\n- a\n\n## Lücken\n\n- b');
  assert.deepEqual(s.secs.map((x) => x.title), ['Soll', 'Lücken']); assert.ok(!s.pre.includes('# Titel'));
});

const APPS = [{ name: 'Demo', total: 2, coverage: 0.25, flows: [{ path: 'f1.md', title: 'Login', area: 'Zugang', status: 'missing', prio: 'MVP' }, { path: 'f2.md', title: 'Export', area: 'Kernablauf', status: 'built', prio: 'V2' }],
  findings: [{ path: 'b.md', title: 'API offen', severity: 'Blocker', state: 'open' }], decisions: [{ path: 'd.md', title: 'Login-Art', question: 'Eigener Login?', state: 'open' }] }];

test('model helpers', () => {
  assert.deepEqual(areasOf(APPS[0]), ['Zugang', 'Kernablauf']);
  assert.equal(nextFlows(APPS[0]).length, 1);
  assert.deepEqual(summaryParts(APPS[0]), ['2 Flows, 25 % abgedeckt', '1 offene Blocker', '1 offene Entscheidungen']);
  assert.deepEqual(splitList(' a, b ,,c'), ['a', 'b', 'c']);
  assert.equal(safeUrl('javascript:alert(1)'), null); assert.match(safeUrl('https://x.example'), /^https:/);
  assert.deepEqual(parseHash('#/flows/Demo%20App'), { name: 'flows', app: 'Demo App' });
  assert.deepEqual(parseHash('#/app/Demo%20App'), { name: 'flows', app: 'Demo App' });
  assert.deepEqual(parseHash('#/findings/X'), { name: 'findings', app: 'X' });
  assert.deepEqual(parseHash('#/decisions'), { name: 'decisions', app: null });
  assert.deepEqual(parseHash('#/_components'), { name: 'gallery', app: null });
  assert.deepEqual(parseHash('#/workspace/Apps%2FD%2FFlows%2FA%2Fx.md'), { name: 'workspace', path: 'Apps/D/Flows/A/x.md', app: 'D', kind: 'flows' });
  assert.deepEqual(parseHash(''), { name: 'apps', app: null });
  assert.equal(parseHash('#/note/Apps%2FDemo%2FFlows%2Fa.md').app, 'Demo');
  assert.equal(parseHash('#/note/%E0%A4%A').name, 'apps');
});

test('command palette search ranks prefix before substring and covers all kinds', () => {
  const items = paletteItems(APPS);
  assert.equal(items.length, 5);
  assert.deepEqual(new Set(items.map((i) => i.kind)), new Set(['App', 'Flow', 'Befund', 'Entscheidung']));
  assert.equal(filterPalette(items, 'log')[0].label, 'Login');
  assert.ok(filterPalette(items, 'eigener').some((i) => i.kind === 'Entscheidung'));
  assert.equal(filterPalette(items, 'zzzz').length, 0);
  assert.equal(filterPalette(items, '').length, 5);
});
