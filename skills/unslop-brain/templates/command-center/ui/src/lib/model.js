// Derived views of the vault index (pure functions, no DOM).
import { AREA_ORDER, PRIOS } from './constants.js';

export const pct = (x) => (x == null ? '–' : `${Math.round(x * 100)} %`);
export const noteHref = (n) => `#/note/${encodeURIComponent(n.path)}`;
export const appHref = (name) => `#/flows/${encodeURIComponent(name)}`;
export const safeUrl = (u) => { try { const x = new URL(String(u)); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : null; } catch { return null; } };
export const splitList = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean);
export const blockersOf = (a) => a.findings.filter((f) => f.severity === 'Blocker' && f.state === 'open');
export const openDecisionsOf = (a) => a.decisions.filter((d) => d.state === 'open');
export function areasOf(a) {
  return [...new Set(a.flows.map((f) => f.area))].sort((x, y) => (AREA_ORDER.indexOf(x) + 1 || 99) - (AREA_ORDER.indexOf(y) + 1 || 99) || x.localeCompare(y));
}
export const byPrio = (x, y) => PRIOS.indexOf(x.prio) - PRIOS.indexOf(y.prio) || String(x.title).localeCompare(String(y.title));
export function nextFlows(a, n = 6) {
  return a.flows.filter((f) => f.status === 'missing' || f.status === 'partial').sort(byPrio).slice(0, n);
}
export function summaryParts(a) {
  const parts = [`${a.total} Flows, ${pct(a.coverage)} abgedeckt`];
  const bl = blockersOf(a).length; const dc = openDecisionsOf(a).length;
  if (bl) parts.push(`${bl} offene Blocker`);
  if (dc) parts.push(`${dc} offene Entscheidungen`);
  return parts;
}
// Entries for the command palette: apps, flows, findings, decisions.
export function paletteItems(apps, currentApp) {
  const items = [];
  for (const a of apps) {
    items.push({ id: `app:${a.name}`, kind: 'App', label: a.name, hint: `${a.total} Flows`, href: appHref(a.name), icon: 'grid' });
    for (const f of a.flows) items.push({ id: `f:${f.path}`, kind: 'Flow', label: f.title, hint: a.name, href: noteHref(f), icon: 'route' });
    for (const f of a.findings) items.push({ id: `b:${f.path}`, kind: 'Befund', label: f.title, hint: a.name, href: noteHref(f), icon: 'alert' });
    for (const d of a.decisions) items.push({ id: `d:${d.path}`, kind: 'Entscheidung', label: d.question || d.title, hint: a.name, href: noteHref(d), icon: 'question' });
  }
  return items;
}
export function filterPalette(items, q, limit = 40) {
  const s = q.trim().toLowerCase();
  if (!s) return items.slice(0, limit);
  const score = (it) => { const l = it.label.toLowerCase(); const i = l.indexOf(s); return i === 0 ? 0 : i > 0 ? 1 : `${l} ${it.hint}`.toLowerCase().includes(s) ? 2 : 9; };
  return items.map((it) => [it, score(it)]).filter(([, sc]) => sc < 9).sort((a, b) => a[1] - b[1] || a[0].label.localeCompare(b[0].label)).slice(0, limit).map(([it]) => it);
}
// Routes: #/apps  #/flows/<App>  #/focus/<App>  #/findings/<App>  #/decisions/<App>  #/note/<path>  #/_components
export const AREAS = [
  { key: 'apps', label: 'Apps', icon: 'grid' },
  { key: 'flows', label: 'Flows', icon: 'route' },
  { key: 'focus', label: 'Fokus', icon: 'bolt' },
  { key: 'findings', label: 'Befunde', icon: 'alert' },
  { key: 'decisions', label: 'Entscheidungen', icon: 'question' },
];
export const areaHref = (key, app) => (key === 'apps' || !app ? '#/apps' : `#/${key}/${encodeURIComponent(app)}`);
export function parseHash(hash) {
  const h = String(hash || '').replace(/^#\/?/, '');
  try {
    if (h === '_components') return { name: 'gallery', app: null };
    if (h.startsWith('workspace/')) { const path = decodeURIComponent(h.slice(10)); const p = path.split('/'); return { name: 'workspace', path, app: p[0] === 'Apps' ? p[1] : null, kind: 'flows' }; }
    if (h.startsWith('note/')) { const path = decodeURIComponent(h.slice(5)); const p = path.split('/'); return { name: 'note', path, app: p[0] === 'Apps' ? p[1] : null, kind: { Flows: 'flows', Findings: 'findings', Entscheidungen: 'decisions' }[p[2]] || 'flows' }; }
    const m = h.match(/^(flows|focus|findings|decisions|app)\/(.+)$/);
    if (m) return { name: m[1] === 'app' ? 'flows' : m[1], app: decodeURIComponent(m[2]) };
    const k = h.split('/')[0];
    if (['flows', 'focus', 'findings', 'decisions'].includes(k)) return { name: k, app: null };
  } catch { /* malformed escape: fall through */ }
  return { name: 'apps', app: null };
}
export const totalsOf = (apps) => {
  const flows = apps.reduce((n, a) => n + a.total, 0);
  const rel = apps.reduce((n, a) => n + (a.total - (a.counts?.na || 0)), 0);
  const done = apps.reduce((n, a) => n + (a.counts.exists + a.counts.built + 0.5 * a.counts.partial), 0);
  return { apps: apps.length, flows, coverage: rel ? done / rel : null, blockers: apps.reduce((n, a) => n + blockersOf(a).length, 0), decisions: apps.reduce((n, a) => n + openDecisionsOf(a).length, 0) };
};
