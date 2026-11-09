// Pure editing operations on a flow graph, plus the mermaid writer. No DOM, no React.
import { parseFlow } from './flow.js';

export const cloneGraph = (g) => ({ nodes: g.nodes.map((n) => ({ ...n })), edges: g.edges.map((e) => ({ ...e })) });
const clean = (s, max = 60) => String(s ?? '').replace(/[[\](){}"|<>\r\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanEdge = (s) => clean(s, 30).replace(/[-=.]/g, ' ').replace(/\s+/g, ' ').trim();
export function nextId(g) {
  const used = new Set(g.nodes.map((n) => n.id)); let i = g.nodes.length + 1;
  while (used.has(`n${i}`)) i++;
  return `n${i}`;
}
const mk = (g, label, shape = 'step') => ({ id: nextId(g), label: clean(label) || 'Schritt', shape: shape === 'decision' ? 'decision' : 'step', order: g.nodes.length });

export function addFirst(g, label = 'Start') { const o = cloneGraph(g); o.nodes.push(mk(o, label)); return o; }
// New node after `fromId`, connected from it (optionally with an edge label, for branches of a decision).
export function addAfter(g, fromId, { label = 'Neuer Schritt', shape = 'step', edgeLabel = null } = {}) {
  const o = cloneGraph(g); if (!o.nodes.some((n) => n.id === fromId)) return o;
  const n = mk(o, label, shape); o.nodes.push(n); o.edges.push({ from: fromId, to: n.id, label: edgeLabel ? cleanEdge(edgeLabel) || null : null }); return o;
}
// Splits edge `index`: from -> new -> to. The edge label stays on the first half.
export function insertOnEdge(g, index, { label = 'Neuer Schritt', shape = 'step' } = {}) {
  const o = cloneGraph(g); const e = o.edges[index]; if (!e) return o;
  const n = mk(o, label, shape); o.nodes.push(n);
  o.edges.splice(index, 1, { from: e.from, to: n.id, label: e.label || null }, { from: n.id, to: e.to, label: null }); return o;
}
export function renameNode(g, id, label) { const o = cloneGraph(g); const n = o.nodes.find((x) => x.id === id); if (n) n.label = clean(label) || n.label; return o; }
export function setShape(g, id, shape) { const o = cloneGraph(g); const n = o.nodes.find((x) => x.id === id); if (n) n.shape = shape === 'decision' ? 'decision' : 'step'; return o; }
// Removes a node. A node with exactly one way in and one way out is bridged so the flow stays connected.
export function deleteNode(g, id) {
  const o = cloneGraph(g); const ins = o.edges.filter((e) => e.to === id && e.from !== id); const outs = o.edges.filter((e) => e.from === id && e.to !== id);
  o.nodes = o.nodes.filter((n) => n.id !== id); o.edges = o.edges.filter((e) => e.from !== id && e.to !== id);
  if (ins.length === 1 && outs.length === 1 && ins[0].from !== outs[0].to) o.edges.push({ from: ins[0].from, to: outs[0].to, label: ins[0].label || outs[0].label || null });
  return o;
}
export function connect(g, from, to, label = null) {
  if (from === to || !g.nodes.some((n) => n.id === from) || !g.nodes.some((n) => n.id === to) || g.edges.some((e) => e.from === from && e.to === to)) return g;
  const o = cloneGraph(g); o.edges.push({ from, to, label: label ? cleanEdge(label) || null : null }); return o;
}
export function removeEdge(g, index) { const o = cloneGraph(g); o.edges.splice(index, 1); return o; }
export function setEdgeLabel(g, index, label) { const o = cloneGraph(g); if (o.edges[index]) o.edges[index].label = cleanEdge(label) || null; return o; }

const SHAPES = { step: (l) => `[${l}]`, decision: (l) => `{${l}}`, terminal: (l) => `([${l}])` };
export function serialize(g) {
  const lines = ['flowchart TD'];
  for (const n of g.nodes) lines.push(`  ${n.id}${(SHAPES[n.shape] || SHAPES.step)(clean(n.label) || n.id)}`);
  for (const e of g.edges) lines.push(`  ${e.from}${e.label ? ` -- ${cleanEdge(e.label)} -->` : ' -->'} ${e.to}`);
  return lines.join('\n');
}
// Writes the diagram into the note text: replaces the mermaid block, or inserts one under the first heading.
export function replaceMermaid(body, code) {
  const block = `\`\`\`mermaid\n${code}\n\`\`\``;
  const re = /```mermaid[ \t]*\r?\n[\s\S]*?```/;
  if (re.test(body)) return body.replace(re, () => block);
  const lines = String(body).split('\n'); const i = lines.findIndex((l) => /^#\s+/.test(l));
  if (i < 0) return `${block}\n\n${body}`;
  lines.splice(i + 1, 0, '', block); return lines.join('\n');
}
export const roundTrip = (g) => parseFlow(serialize(g));
