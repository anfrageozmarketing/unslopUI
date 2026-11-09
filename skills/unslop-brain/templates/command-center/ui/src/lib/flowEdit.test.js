import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFlow } from './flow.js';
import { addAfter, addFirst, connect, deleteNode, insertOnEdge, removeEdge, renameNode, replaceMermaid, roundTrip, serialize, setEdgeLabel, setShape } from './flowEdit.js';

const SAMPLE = 'flowchart TD\n  A[Seite öffnen] --> B{Session gültig?}\n  B -- ja --> W[Workspace]\n  B -- nein --> L[Login]\n  L --> W';
const shape = (g) => ({ n: g.nodes.map((x) => [x.id, x.label, x.shape]), e: g.edges.map((x) => [x.from, x.to, x.label || null]) });

test('serialize and parse are inverse', () => {
  const g = parseFlow(SAMPLE); assert.deepEqual(shape(roundTrip(g)), shape(g));
  assert.match(serialize(g), /B -- ja --> W/);
});
test('add, insert, rename, shape, edge label', () => {
  let g = parseFlow(SAMPLE);
  g = addAfter(g, 'W', { label: 'Danach', edgeLabel: 'fertig' }); assert.equal(g.nodes.length, 5); assert.ok(g.edges.some((e) => e.from === 'W' && e.label === 'fertig'));
  const i = g.edges.findIndex((e) => e.from === 'L' && e.to === 'W');
  g = insertOnEdge(g, i, { label: 'Mittelschritt' }); assert.ok(g.edges.some((e) => e.from === 'L') && !g.edges.some((e) => e.from === 'L' && e.to === 'W'));
  g = renameNode(g, 'A', 'Start [x] {y}'); assert.equal(g.nodes[0].label, 'Start x y');
  g = setShape(g, 'L', 'decision'); assert.equal(g.nodes.find((n) => n.id === 'L').shape, 'decision');
  g = setEdgeLabel(g, 0, 'a-b > c'); assert.ok(!/[->]/.test(g.edges[0].label));
  assert.deepEqual(shape(roundTrip(g)).e.map((x) => [x[0], x[1]]), shape(g).e.map((x) => [x[0], x[1]]));
});
test('delete bridges a simple chain and removes branches cleanly', () => {
  let g = parseFlow('flowchart TD\n A[a] --> B[b]\n B --> C[c]');
  g = deleteNode(g, 'B'); assert.deepEqual(shape(g).e, [['A', 'C', null]]);
  const h = deleteNode(parseFlow(SAMPLE), 'B'); assert.ok(!h.edges.some((e) => e.from === 'B' || e.to === 'B'));
});
test('connect refuses self loops, duplicates, unknown nodes', () => {
  const g = parseFlow(SAMPLE);
  assert.equal(connect(g, 'A', 'A'), g); assert.equal(connect(g, 'A', 'B'), g); assert.equal(connect(g, 'A', 'zz'), g);
  assert.equal(connect(g, 'A', 'W').edges.length, g.edges.length + 1);
  assert.equal(removeEdge(g, 0).edges.length, g.edges.length - 1);
});
test('ids stay unique and labels are never empty', () => {
  let g = addFirst({ nodes: [], edges: [] }, '   '); g = addAfter(g, g.nodes[0].id, { label: '' }); g = addAfter(g, g.nodes[0].id, {});
  assert.equal(new Set(g.nodes.map((n) => n.id)).size, 3); assert.ok(g.nodes.every((n) => n.label.length > 0));
});
test('replaceMermaid replaces, inserts under the title, or prepends', () => {
  assert.match(replaceMermaid('# T\n\n```mermaid\nflowchart TD\n A-->B\n```\n\n## Soll', 'flowchart TD\n  X --> Y'), /X --> Y[\s\S]*## Soll/);
  const ins = replaceMermaid('# Titel\n\n## Soll\n- a', 'flowchart TD\n  A[x]'); assert.match(ins, /^# Titel\n\n```mermaid/);
  assert.match(replaceMermaid('kein titel', 'flowchart TD\n A[x]'), /^```mermaid/);
  const withDollar = replaceMermaid('```mermaid\nold\n```', 'flowchart TD\n  A[$& $1]'); assert.match(withDollar, /\$& \$1/);
});
