// Pure flow logic: reads a mermaid flowchart, lays it out left to right, routes the edges. No DOM, no React.

export const NODE_W = 180; const NODE_H = 72; const DEC = 80; const GAP_X = 84; const GAP_Y = 50; const PAD = 44;
export const cleanLabel = (s) => String(s || '').replace(/<br\s*\/?>/gi, ' ').replace(/^["'`]+|["'`]+$/g, '').replace(/\s+/g, ' ').trim();
export function splitSections(md) {
  const pre = []; const secs = []; let cur = null;
  for (const l of md.split('\n')) {
    const m = l.match(/^##\s+(.*)$/);
    if (m) { cur = { title: m[1].trim(), lines: [] }; secs.push(cur); } else (cur ? cur.lines : pre).push(l);
  }
  return { pre: pre.join('\n').replace(/^\s*#\s+.*\n/, ''), secs: secs.map((s) => ({ title: s.title, md: s.lines.join('\n') })) };
}

export function parseFlow(src) {
  const nodes = new Map(); const edges = [];
  const NODE = /^([A-Za-z0-9_]+)(?:\[\[(.*?)\]\]|\(\((.*?)\)\)|\(\[(.*?)\]\)|\[\((.*?)\)\]|\[(.*?)\]|\{(.*?)\}|\((.*?)\)|>(.*?)\])?/;
  const ARROW = /^(?:--\s*([^->|]+?)\s*-->|-\.\s*([^->|]+?)\s*\.->|==\s*([^=>|]+?)\s*==>|-->|---|-\.->|==>)\s*(?:\|([^|]*)\|)?\s*/;
  const SKIP = /^(flowchart|graph|subgraph|end|classDef|class|style|linkStyle|direction|click|%%)/i;
  for (const raw of String(src || '').split('\n')) {
    let rest = raw.trim();
    if (!rest || SKIP.test(rest)) continue;
    let prev = null; let label = null;
    while (rest) {
      const m = rest.match(NODE);
      if (!m) break;
      const id = m[1]; const text = [2, 3, 4, 5, 6, 7, 8, 9].map((i) => m[i]).find((v) => v !== undefined);
      const shape = m[7] !== undefined ? 'decision' : (m[3] !== undefined || m[4] !== undefined) ? 'terminal' : 'step';
      const cur = nodes.get(id) || { id, label: id, shape: 'step', order: nodes.size };
      if (text !== undefined) { cur.label = cleanLabel(text) || id; cur.shape = shape; }
      nodes.set(id, cur);
      if (prev) edges.push({ from: prev, to: id, label });
      rest = rest.slice(m[0].length).trim();
      const am = rest.match(ARROW);
      if (!am) break;
      const l = am[1] ?? am[2] ?? am[3] ?? am[4];
      label = l ? cleanLabel(l) : null;
      rest = rest.slice(am[0].length); prev = id;
    }
  }
  return { nodes: [...nodes.values()], edges };
}

export function layoutFlow(g) {
  const ids = g.nodes.map((n) => n.id);
  const out = new Map(ids.map((i) => [i, []])); const inn = new Map(ids.map((i) => [i, []]));
  for (const e of g.edges) { out.get(e.from).push(e); inn.get(e.to).push(e); }
  const state = new Map(); const back = new Set();
  const dfs = (u) => { state.set(u, 1); for (const e of out.get(u)) { const s = state.get(e.to); if (s === 1) back.add(e); else if (!s) dfs(e.to); } state.set(u, 2); };
  for (const id of ids) if (!state.get(id) && !inn.get(id).length) dfs(id);
  for (const id of ids) if (!state.get(id)) dfs(id);
  const rank = new Map(ids.map((i) => [i, 0]));
  for (let k = 0; k < ids.length; k++) {
    let changed = false;
    for (const e of g.edges) { if (back.has(e)) continue; const r = rank.get(e.from) + 1; if (r > rank.get(e.to)) { rank.set(e.to, r); changed = true; } }
    if (!changed) break;
  }
  const maxRank = Math.max(0, ...rank.values());
  const layers = Array.from({ length: maxRank + 1 }, () => []);
  for (const n of g.nodes) layers[rank.get(n.id)].push(n);
  const pos = new Map(); const idx = new Map();
  layers.forEach((layer, li) => {
    if (li > 0) {
      const bary = (n) => { const p = inn.get(n.id).filter((e) => !back.has(e)).map((e) => idx.get(e.from)).filter((v) => v !== undefined); return p.length ? p.reduce((s, v) => s + v, 0) / p.length : n.order; };
      layer.sort((x, y) => bary(x) - bary(y) || x.order - y.order);
    } else layer.sort((x, y) => x.order - y.order);
    layer.forEach((n, i) => idx.set(n.id, i));
  });
  const slotH = (n) => (n.shape === 'decision' ? DEC : NODE_H);
  const totals = layers.map((l) => l.reduce((s, n) => s + slotH(n), 0) + Math.max(0, l.length - 1) * GAP_Y);
  const tallest = Math.max(NODE_H, ...totals);
  const hasBack = back.size > 0;
  layers.forEach((layer, li) => {
    let y = PAD + (tallest - totals[li]) / 2;
    for (const n of layer) {
      const w = n.shape === 'decision' ? DEC : NODE_W; const hh = slotH(n);
      pos.set(n.id, { x: PAD + li * (NODE_W + GAP_X) + (NODE_W - w) / 2, y, w, h: hh });
      y += hh + GAP_Y;
    }
  });
  const kind = (n) => (!inn.get(n.id).filter((e) => !back.has(e)).length ? 'start' : n.shape === 'decision' || out.get(n.id).length > 1 ? 'router' : !out.get(n.id).length || n.shape === 'terminal' ? 'end' : 'step');
  g.nodes.forEach((n, i) => { n.kind = kind(n); n.n = i + 1; });
  return { pos, back, w: PAD * 2 + maxRank * (NODE_W + GAP_X) + NODE_W, h: PAD * 2 + tallest + (hasBack ? 70 : 0) };
}

export const KIND_LABEL = { start: 'Start', router: 'Weiche', step: 'Schritt', end: 'Ende' };
export function edgePath(a, b, isBack, others) {
  const sx = a.x + a.w; const sy = a.y + a.h / 2; const tx = b.x; const ty = b.y + b.h / 2;
  if (isBack || tx <= sx + 20) { const dy = Math.max(a.y + a.h, b.y + b.h) + 54 - Math.min(sy, ty); return { d: `M${sx} ${sy} C${sx + 90} ${sy + dy} ${tx - 90} ${ty + dy} ${tx} ${ty}`, mx: (sx + tx) / 2, my: Math.max(sy, ty) + dy * 0.75 }; }
  // An edge that skips layers must not run behind the nodes in between: lift it over (or under) them.
  const lo = Math.min(sy, ty) - 6; const hi = Math.max(sy, ty) + 6;
  const hit = (others || []).filter((o) => o !== a && o !== b && o.x + o.w > sx + 8 && o.x < tx - 8 && o.y < hi + 14 && o.y + o.h > lo - 14);
  if (hit.length) {
    const top = Math.min(...hit.map((o) => o.y)) - 34; const bot = Math.max(...hit.map((o) => o.y + o.h)) + 34;
    const up = Math.abs(top - sy) <= Math.abs(bot - sy); const by = up ? top : bot;
    const x1 = Math.max(sx + 40, hit[0].x - 40) ; const x2 = Math.min(tx - 40, Math.max(...hit.map((o) => o.x + o.w)) + 40);
    return { d: `M${sx} ${sy} C${sx + 40} ${sy} ${x1 - 20} ${by} ${x1 + 30} ${by} L${x2 - 30} ${by} C${x2 + 20} ${by} ${tx - 40} ${ty} ${tx} ${ty}`, mx: (x1 + x2) / 2, my: by };
  }
  const dx = Math.max(48, (tx - sx) / 2);
  return { d: `M${sx} ${sy} C${sx + dx} ${sy} ${tx - dx} ${ty} ${tx} ${ty}`, mx: (sx + tx) / 2, my: (sy + ty) / 2 };
}

export function sollChain(title, secs) {
  const s = secs.find((x) => /^soll/i.test(x.title));
  if (!s) return null;
  const md = s.md.trim();
  let items = md.split('\n').map((l) => l.match(/^\s*[-*]\s+(.*\S)/)).filter(Boolean).map((m) => m[1]);
  if (!items.length) items = md.split(/[,;]\s+|\.\s+/);
  const clip = (t) => { const c = cleanLabel(t.replace(/[`*_]/g, '').replace(/\.$/, '')); return c.length > 52 ? `${c.slice(0, 49).trim()}…` : c; };
  items = items.map(clip).filter((t) => t.length > 1).slice(0, 7);
  if (!items.length) return null;
  const nodes = [{ id: 'n0', label: clip(title) || 'Start', shape: 'step', order: 0 }, ...items.map((t, i) => ({ id: `n${i + 1}`, label: t, shape: 'step', order: i + 1 }))];
  return { nodes, edges: nodes.slice(1).map((n, i) => ({ from: nodes[i].id, to: n.id, label: null })) };
}

export function takeMermaid(md) {
  const m = md.match(/```mermaid[ \t]*\r?\n([\s\S]*?)```/);
  return m ? { code: m[1], rest: md.replace(m[0], '') } : { code: null, rest: md };
}
