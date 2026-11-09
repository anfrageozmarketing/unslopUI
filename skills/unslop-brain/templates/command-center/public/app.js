// Command Center UI - vanilla JS. All text goes in via textContent; markdown goes through DOMPurify.
// Design idea: the flows of an app are a route map (lanes per area, one node per flow), not a table.
const STATUS = [['missing', 'Fehlt'], ['partial', 'Teilweise'], ['exists', 'Vorhanden'], ['built', 'Gebaut'], ['na', 'Nicht nötig']];
const LABEL = Object.fromEntries(STATUS);
const PRIOS = ['MVP', 'V1', 'V2'];
const AREA_ORDER = ['Zugang', 'Onboarding', 'Kernablauf', 'Einstellungen', 'System'];
const SEVERITIES = ['Blocker', 'Gap', 'Rough', 'Polish'];
const SEV_RANK = { Blocker: 0, Gap: 1, Rough: 2, Polish: 3 };
const FSTATES = [['open', 'Offen'], ['fixed', 'Behoben'], ['wontfix', 'Wird nicht behoben']];
const DSTATES = [['open', 'Offen'], ['decided', 'Entschieden']];
const $view = document.getElementById('view');
const $crumbs = document.getElementById('crumbs');
const $side = document.getElementById('side');
let data = { apps: [] };

/* ---------- helpers ---------- */
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
}
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2500);
}
async function api(path, opts) {
  const r = await fetch(path, { headers: { 'x-requested-with': 'command-center', ...(opts?.body ? { 'content-type': 'application/json' } : {}) }, ...opts });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Fehler ${r.status}`);
  return r.json();
}
async function load() { data = await api('/api/index'); }
const pct = (x) => (x == null ? '–' : `${Math.round(x * 100)} %`);
const noteHref = (n) => `#/note/${encodeURIComponent(n.path)}`;
function safeUrl(u) { try { const x = new URL(String(u)); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : null; } catch { return null; } }
const splitList = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean);
const blockersOf = (a) => a.findings.filter((f) => f.severity === 'Blocker' && f.state === 'open');
const decisionsOf = (a) => a.decisions.filter((d) => d.state === 'open');
function areasOf(a) {
  return [...new Set(a.flows.map((f) => f.area))].sort((x, y) => (AREA_ORDER.indexOf(x) + 1 || 99) - (AREA_ORDER.indexOf(y) + 1 || 99) || x.localeCompare(y));
}
function crumbs(parts) {
  $crumbs.replaceChildren(...parts.flatMap((p, i) => [i ? h('span', {}, '/') : null, p.href ? h('a', { href: p.href }, p.label) : h('span', {}, p.label)]).filter(Boolean));
}
function currentApp() {
  const hash = location.hash.replace(/^#\/?/, '');
  if (hash.startsWith('app/')) return decodeURIComponent(hash.slice(4));
  if (hash.startsWith('note/')) { const p = decodeURIComponent(hash.slice(5)).split('/'); return p[0] === 'Apps' ? p[1] : null; }
  return null;
}

/* ---------- signature components ---------- */
// Strip: the whole app in one line. One tick per flow, grouped by area, coloured by status.
function strip(a, { compact = false } = {}) {
  const areas = areasOf(a);
  if (!areas.length) return h('div', { class: 'strip empty' }, 'noch keine Flows');
  const wrap = h('div', { class: `strip${compact ? ' compact' : ''}`, role: 'img',
    'aria-label': STATUS.map(([k, l]) => `${l}: ${a.counts[k] || 0}`).join(', ') });
  for (const ar of areas) {
    const seg = h('div', { class: 'seg', title: ar });
    for (const f of a.flows.filter((x) => x.area === ar)) seg.append(h('i', { class: 'tick', 'data-s': f.status, title: `${f.title} · ${LABEL[f.status]}` }));
    wrap.append(seg);
  }
  return wrap;
}
// Route map: one lane per area, one node per flow. Marker shows status, size shows priority.
function makeLane(a, ar, active, current) {
  const flows = a.flows.filter((f) => f.area === ar).sort((x, y) => PRIOS.indexOf(x.prio) - PRIOS.indexOf(y.prio) || x.title.localeCompare(y.title));
  const done = flows.filter((f) => f.status === 'built' || f.status === 'exists').length;
  const track = h('div', { class: 'track' }, flows.map((f) => {
    const dim = active.size && !active.has(f.status);
    const cur = f.path === current;
    return h('a', { class: `node p-${f.prio}${dim ? ' dim' : ''}${cur ? ' cur' : ''}`, 'data-s': f.status, 'aria-current': cur ? 'page' : null, href: noteHref(f), title: `${f.title} · ${LABEL[f.status]} · ${f.prio}${f.reason ? ` · ${f.reason}` : ''}` },
      h('span', { class: 'mk', 'aria-hidden': 'true' }), h('span', { class: 'lbl' }, f.title), f.prio === 'MVP' ? h('span', { class: 'mvp' }, 'MVP') : null);
  }));
  return h('section', { class: 'lane', 'aria-label': ar }, h('header', {}, h('h3', {}, ar), h('span', { class: 'quiet num' }, `${done}/${flows.length}`)), track);
}
function routeMap(a, active) {
  const areas = areasOf(a);
  if (!areas.length) return h('p', { class: 'quiet' }, 'Noch keine Flows. Lege den ersten mit "+ Neuer Flow" an.');
  return h('div', { class: 'map' }, areas.map((ar) => makeLane(a, ar, active, null)));
}
function legend(a, active, onToggle) {
  return h('div', { class: 'legend', role: 'group', 'aria-label': 'Status filtern' }, STATUS.filter(([k]) => a.counts[k]).map(([k, l]) =>
    h('button', { type: 'button', class: `chip${active.has(k) ? ' on' : ''}`, 'data-s': k, 'aria-pressed': String(active.has(k)), onclick: () => onToggle(k) },
      h('span', { class: 'mk', 'aria-hidden': 'true' }), l, ' ', h('span', { class: 'num' }, a.counts[k]))));
}
// One sentence instead of KPI cards.
function summary(a) {
  const bl = blockersOf(a).length; const dc = decisionsOf(a).length;
  const parts = [`${a.total} Flows, ${pct(a.coverage)} abgedeckt`];
  if (bl) parts.push(`${bl} offene Blocker`);
  if (dc) parts.push(`${dc} offene Entscheidungen`);
  return h('p', { class: 'summary' }, parts.join(' · '));
}

/* ---------- side + home ---------- */
function renderSide() {
  const cur = currentApp();
  $side.replaceChildren(
    h('a', { class: 'side-item home', href: '#/', 'aria-current': !location.hash.replace(/^#\/?/, '') ? 'page' : null }, 'Alle Apps'),
    h('ul', {}, data.apps.map((a) => {
      const bl = blockersOf(a).length; const url = safeUrl(a.url);
      return h('li', {},
        h('a', { class: 'side-item', href: `#/app/${encodeURIComponent(a.name)}`, 'aria-current': cur === a.name ? 'page' : null },
          h('span', { class: 'row' }, h('span', { class: 'name' }, a.name), bl ? h('span', { class: 'dotbad', title: `${bl} offene Blocker` }, bl) : null), strip(a, { compact: true })),
        url ? h('a', { class: 'side-open', href: url, target: '_blank', rel: 'noopener noreferrer' }, 'App öffnen ↗') : null);
    })));
}
function homeView() {
  crumbs([]);
  const root = h('div', {}, h('h1', {}, 'Apps'));
  if (!data.apps.length) root.append(h('p', { class: 'quiet' }, 'Noch keine Apps im Vault. Lege unter Apps/<Name>/ eine _App.md an.'));
  root.append(h('div', { class: 'apps' }, data.apps.map((a) =>
    h('a', { class: 'app-row', href: `#/app/${encodeURIComponent(a.name)}` },
      h('div', { class: 'app-head' }, h('h2', {}, a.name), a.stack ? h('span', { class: 'quiet' }, a.stack) : null),
      strip(a), summary(a)))));
  $view.replaceChildren(root);
}

/* ---------- app view ---------- */
let appTab = 'flows';
let lastApp = null;
const active = new Set();
let showNew = false;
const TABS = [
  { key: 'flows', label: (a) => `Flows (${a.total})` },
  { key: 'attention', label: () => 'Aufmerksamkeit' },
  { key: 'findings', label: (a) => `Befunde (${a.findings.length})` },
  { key: 'decisions', label: (a) => `Entscheidungen (${a.decisions.length})` },
];
function appView(name) {
  const a = data.apps.find((x) => x.name === name);
  if (!a) { $view.replaceChildren(h('p', { class: 'quiet' }, 'App nicht gefunden.')); return; }
  if (lastApp !== name) { lastApp = name; appTab = 'flows'; active.clear(); showNew = false; }
  crumbs([{ label: 'Apps', href: '#/' }, { label: a.name }]);
  const url = safeUrl(a.url);
  const root = h('div', {},
    h('header', { class: 'app-top' }, h('h1', {}, a.name),
      h('span', { class: 'row' }, a.score != null ? h('span', { class: 'quiet num' }, `Score ${a.score}/36`) : null, url ? h('a', { class: 'btn-open', href: url, target: '_blank', rel: 'noopener noreferrer' }, 'App öffnen ↗') : null)),
    strip(a), summary(a),
    h('nav', { class: 'tabs', 'aria-label': 'Bereiche' }, TABS.map((t) => h('button', { type: 'button', 'aria-pressed': String(t.key === appTab), onclick: () => { appTab = t.key; showNew = false; appView(name); } }, t.label(a)))));
  ({ flows: flowsTab, attention: attentionTab, findings: findingsTab, decisions: decisionsTab }[appTab])(a, root, name);
  $view.replaceChildren(root);
}
function addButton(label, name) {
  return h('button', { type: 'button', class: 'plain', onclick: () => { showNew = !showNew; appView(name); } }, showNew ? 'Abbrechen' : label);
}
function flowsTab(a, root, name) {
  root.append(h('div', { class: 'bar' }, legend(a, active, (k) => { if (active.has(k)) active.delete(k); else active.add(k); appView(name); }), addButton('+ Neuer Flow', name)));
  if (showNew) root.append(createForm('Neuer Flow', name, '/api/flow', [
    ['title', 'Titel', h('input', { required: true, maxlength: 80, placeholder: 'z. B. Passwort zurücksetzen' })],
    ['area', 'Bereich', h('input', { required: true, maxlength: 60, list: 'areas', placeholder: 'z. B. Zugang' })],
    ['prio', 'Prio', h('select', {}, PRIOS.map((v) => h('option', { value: v, selected: v === 'V1' }, v)))],
    ['screens', 'Screens', h('input', { placeholder: '/login, /forgot' })],
    ['endpoints', 'Endpoints', h('input', { placeholder: 'POST /api/auth/login' })],
  ], (b) => ({ ...b, screens: splitList(b.screens), endpoints: splitList(b.endpoints) }),
  h('datalist', { id: 'areas' }, [...new Set([...AREA_ORDER, ...areasOf(a)])].map((x) => h('option', { value: x })))));
  root.append(routeMap(a, active));
}
function attentionTab(a, root) {
  const bl = blockersOf(a); const dc = decisionsOf(a);
  const next = a.flows.filter((f) => f.status === 'missing' || f.status === 'partial').sort((x, y) => PRIOS.indexOf(x.prio) - PRIOS.indexOf(y.prio)).slice(0, 6);
  const group = (title, items, empty) => h('section', { class: 'stream' }, h('h2', {}, title),
    items.length ? h('ul', {}, items) : h('p', { class: 'quiet' }, empty));
  root.append(
    group('Blocker', bl.map((b) => h('li', {}, h('a', { href: noteHref(b), class: 'line bad' }, h('b', {}, b.title), b.where ? h('span', { class: 'quiet' }, b.where) : null))), 'Keine offenen Blocker.'),
    group('Offene Entscheidungen', dc.map((d) => h('li', {}, h('a', { href: noteHref(d), class: 'line ask' }, h('b', {}, d.question || d.title), h('span', { class: 'quiet' }, d.title)))), 'Keine offenen Entscheidungen.'),
    group('Als Nächstes bauen', next.map((f) => h('li', {}, h('a', { href: noteHref(f), class: 'line', 'data-s': f.status }, h('span', { class: 'mk', 'aria-hidden': 'true' }), h('b', {}, f.title), h('span', { class: 'quiet' }, `${f.area} · ${f.prio}`)))), 'Alles Wichtige ist umgesetzt.'));
}
function chips(options, current, onPick) {
  return h('div', { class: 'legend' }, options.map(([v, l]) => h('button', { type: 'button', class: `chip plainchip${current === v ? ' on' : ''}`, 'aria-pressed': String(current === v), onclick: () => onPick(v) }, l)));
}
let findState = 'open';
function findingsTab(a, root, name) {
  const list = a.findings.filter((f) => !findState || f.state === findState).sort((x, y) => (SEV_RANK[x.severity] ?? 9) - (SEV_RANK[y.severity] ?? 9) || x.title.localeCompare(y.title));
  root.append(h('div', { class: 'bar' }, chips([['open', 'Offen'], ['', 'Alle']], findState, (v) => { findState = v; appView(name); }), addButton('+ Neuer Befund', name)));
  if (showNew) root.append(createForm('Neuer Befund', name, '/api/finding', [
    ['title', 'Titel', h('input', { required: true, maxlength: 80, placeholder: 'Was ist das Problem?' })],
    ['severity', 'Schwere', h('select', {}, SEVERITIES.map((v) => h('option', { value: v, selected: v === 'Gap' }, v)))],
    ['where', 'Wo', h('input', { maxlength: 300, placeholder: 'Datei oder Route' })],
  ]));
  root.append(list.length ? h('ul', { class: 'items' }, list.map((f) => h('li', {}, h('a', { class: `item sev-${f.severity}`, href: noteHref(f) },
    h('span', { class: 'sev' }, f.severity), h('b', {}, f.title), f.where ? h('span', { class: 'quiet' }, f.where) : null,
    f.state !== 'open' ? h('span', { class: 'quiet' }, (FSTATES.find(([v]) => v === f.state) || [0, f.state])[1]) : null))))
    : h('p', { class: 'quiet' }, 'Keine Befunde in dieser Ansicht.'));
}
let decState = 'open';
function decisionsTab(a, root, name) {
  const list = a.decisions.filter((d) => !decState || d.state === decState).sort((x, y) => x.title.localeCompare(y.title));
  root.append(h('div', { class: 'bar' }, chips([['open', 'Offen'], ['decided', 'Entschieden'], ['', 'Alle']], decState, (v) => { decState = v; appView(name); }), addButton('+ Neue Entscheidung', name)));
  if (showNew) root.append(createForm('Neue Entscheidung', name, '/api/decision', [
    ['title', 'Titel', h('input', { required: true, maxlength: 80, placeholder: 'z. B. Eigener oder zentraler Login' })],
    ['question', 'Frage', h('input', { maxlength: 300, placeholder: 'Was muss entschieden werden?' })],
  ]));
  root.append(list.length ? h('ul', { class: 'items' }, list.map((d) => h('li', {}, h('a', { class: `item q ${d.state}`, href: noteHref(d) },
    h('b', { class: 'big' }, d.question || d.title), d.state === 'decided' ? h('span', { class: 'answer' }, `→ ${d.answer || 'entschieden'}`) : null, h('span', { class: 'quiet' }, d.title)))))
    : h('p', { class: 'quiet' }, 'Keine Entscheidungen in dieser Ansicht.'));
}
function createForm(title, appName, endpoint, fields, transform = (b) => b, extra = null) {
  const inputs = {};
  const rows = fields.map(([key, label, el]) => { inputs[key] = el; return h('label', { class: 'fld' }, h('span', {}, label), el); });
  const form = h('form', { class: 'create' }, h('h3', {}, title), h('div', { class: 'fgrid' }, rows), extra, h('button', { class: 'plain strong', type: 'submit' }, 'Anlegen'));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const body = { app: appName }; for (const [k, el] of Object.entries(inputs)) body[k] = el.value;
      const r = await api(endpoint, { method: 'POST', body: JSON.stringify(transform(body)) });
      showNew = false; await load(); renderSide(); location.hash = noteHref({ path: r.path });
    } catch (err) { toast(err.message); }
  });
  return form;
}

/* ---------- note view (read first, edit tucked away) ---------- */
const MANAGED = ['flow', 'finding', 'decision'];
let editBody = false;
let lastNote = null;
function managePanel(path, note, appName) {
  const t = note.meta.type;
  if (!MANAGED.includes(t)) return null;
  const m = note.meta; const inputs = {}; const orig = {}; const rows = [];
  const text = (key, label, val, ph = '') => { inputs[key] = h('input', { value: val || '', placeholder: ph, maxlength: 300 }); rows.push(h('label', { class: 'fld' }, h('span', {}, label), inputs[key])); };
  const pick = (key, label, pairs, val) => { inputs[key] = h('select', {}, pairs.map(([v, l]) => h('option', { value: v, selected: val === v }, l))); rows.push(h('label', { class: 'fld' }, h('span', {}, label), inputs[key])); };
  if (t === 'flow') {
    pick('status', 'Status', STATUS, m.status); pick('prio', 'Prio', PRIOS.map((v) => [v, v]), m.prio);
    text('reason', 'Begründung (bei "Nicht nötig")', m.reason, 'Warum braucht diese App das nicht?');
    text('screens', 'Screens', (m.screens || []).join(', '), 'Komma trennt'); text('endpoints', 'Endpoints', (m.endpoints || []).join(', '), 'Komma trennt');
    text('evidence', 'Nachweis (für "Gebaut")', m.evidence, 'Test, Gate oder Link');
  } else if (t === 'decision') {
    pick('state', 'Status', DSTATES, m.state); text('question', 'Frage', m.question); text('answer', 'Antwort', m.answer);
  } else {
    pick('state', 'Status', FSTATES, m.state); pick('severity', 'Schwere', SEVERITIES.map((v) => [v, v]), m.severity); text('where', 'Wo', m.where);
  }
  for (const k of Object.keys(inputs)) orig[k] = inputs[k].value;
  const value = (k) => (k === 'screens' || k === 'endpoints' ? splitList(inputs[k].value) : inputs[k].value);
  const save = h('button', { type: 'button', class: 'plain strong' }, 'Speichern');
  save.addEventListener('click', async () => {
    const changed = Object.keys(inputs).filter((k) => inputs[k].value !== orig[k]);
    if (!changed.length) { toast('Nichts geändert'); return; }
    if (changed.includes('status') && inputs.status.value === 'built' && !inputs.evidence.value.trim() && !confirm('Für "Gebaut" fehlt ein Nachweis. Trotzdem speichern?')) return;
    try {
      for (const k of changed.filter((x) => x !== 'status')) await api('/api/note', { method: 'PATCH', body: JSON.stringify({ path, field: k, value: value(k) }) });
      if (changed.includes('status')) await api('/api/note', { method: 'PATCH', body: JSON.stringify({ path, field: 'status', value: value('status') }) });
      await load(); renderSide(); toast('Gespeichert'); await route();
    } catch (e) { toast(e.message); }
  });
  const edit = h('button', { type: 'button', class: 'plain', onclick: () => { editBody = true; route(); } }, 'Text bearbeiten');
  const arch = h('button', { type: 'button', class: 'plain danger', onclick: async () => {
    if (!confirm('Notiz archivieren? Sie verschwindet aus der Übersicht und liegt im Ordner _Archiv der App.')) return;
    try { await api('/api/note', { method: 'DELETE', body: JSON.stringify({ path }) }); await load(); renderSide(); toast('Archiviert'); location.hash = appName ? `#/app/${encodeURIComponent(appName)}` : '#/'; } catch (e) { toast(e.message); }
  } }, 'Archivieren');
  return h('details', { class: 'manage' }, h('summary', {}, 'Bearbeiten'), h('div', { class: 'fgrid' }, rows), h('div', { class: 'actions' }, save, edit, arch));
}
function bodyEditor(path, note) {
  const ta = h('textarea', { class: 'editor', rows: 22, spellcheck: 'false', 'aria-label': 'Notiztext (Markdown)' });
  ta.value = note.body.replace(/^\n+/, '');
  const save = h('button', { type: 'button', class: 'plain strong' }, 'Text speichern');
  save.addEventListener('click', async () => {
    try { await api('/api/note', { method: 'PUT', body: JSON.stringify({ path, body: ta.value }) }); editBody = false; await load(); toast('Gespeichert'); await route(); } catch (e) { toast(e.message); }
  });
  return h('div', {}, h('p', { class: 'quiet' }, 'Markdown. Diagramme als mermaid-Block. Die Eigenschaften bleiben unverändert.'), ta,
    h('div', { class: 'actions' }, save, h('button', { type: 'button', class: 'plain', onclick: () => { editBody = false; route(); } }, 'Abbrechen')));
}
async function renderMd(md) {
  const holder = h('div', { class: 'md' });
  if (window.marked && window.DOMPurify) {
    holder.innerHTML = window.DOMPurify.sanitize(window.marked.parse(md, { gfm: true }));
    if (window.mermaid) {
      window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default' });
      const blocks = [...holder.querySelectorAll('pre > code.language-mermaid')];
      for (const [i, code] of blocks.entries()) {
        try {
          const { svg } = await window.mermaid.render(`m${Date.now()}_${i}`, code.textContent);
          const wrap = h('div', { class: 'diagram' }); wrap.innerHTML = window.DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
          code.parentElement.replaceWith(wrap);
        } catch { /* keep the code block visible if the diagram is invalid */ }
      }
    }
  } else {
    holder.append(h('pre', {}, md));
  }
  return holder;
}
function splitSections(md) {
  const pre = []; const secs = []; let cur = null;
  for (const l of md.split('\n')) {
    const m = l.match(/^##\s+(.*)$/);
    if (m) { cur = { title: m[1].trim(), lines: [] }; secs.push(cur); } else (cur ? cur.lines : pre).push(l);
  }
  return { pre: pre.join('\n').replace(/^\s*#\s+.*\n/, ''), secs: secs.map((s) => ({ title: s.title, md: s.lines.join('\n') })) };
}
/* ---------- flow canvas: the diagram as nodes and curves, not as a document ---------- */
const NODE_W = 196; const NODE_H = 62; const DEC = 66; const GAP_X = 124; const GAP_Y = 44; const PAD = 70;
const cleanLabel = (s) => String(s || '').replace(/<br\s*\/?>/gi, ' ').replace(/^["'`]+|["'`]+$/g, '').replace(/\s+/g, ' ').trim();
// Reads the usual mermaid flowchart subset: ids with [ ] ( ) { } shapes, chains, -- text --> and -->|text| labels.
function parseFlow(src) {
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
function layoutFlow(g) {
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
const KIND_LABEL = { start: 'Start', router: 'Weiche', step: 'Schritt', end: 'Ende' };
function edgePath(a, b, isBack, others) {
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
const ROUTER_ICON = '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path d="M4 16h8m0 0c6 0 6-8 14-8m0 0l-4-3m4 3l-4 3M12 16c6 0 6 8 14 8m0 0l-4-3m4 3l-4 3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function flowCanvas(g, onEdit) {
  const stage = h('div', { class: 'fstage', tabindex: '0', role: 'group', 'aria-label': 'Ablauf als Diagramm. Ziehen zum Verschieben, Mausrad zum Zoomen.' });
  if (!g.nodes.length) {
    stage.classList.add('empty');
    stage.append(h('div', { class: 'fempty' }, h('p', {}, 'Für diesen Flow gibt es noch keinen Ablauf.'), h('button', { type: 'button', class: 'plain strong', onclick: onEdit }, 'Ablauf als Text zeichnen')));
    return stage;
  }
  const lay = layoutFlow(g);
  const world = h('div', { class: 'fworld', style: `width:${lay.w}px;height:${lay.h}px` });
  const paths = [];
  const labels = [];
  for (const e of g.edges) {
    const a = lay.pos.get(e.from); const b = lay.pos.get(e.to); if (!a || !b) continue;
    const p = edgePath(a, b, lay.back.has(e), [...lay.pos.values()]);
    paths.push(`<path d="${p.d}" class="fedge${lay.back.has(e) ? ' back' : ''}" marker-end="url(#arr)"/>`);
    if (e.label) labels.push(h('span', { class: 'elabel', style: `left:${Math.round(p.mx)}px;top:${Math.round(p.my)}px` }, e.label));
  }
  const svg = h('div', { class: 'fsvg', 'aria-hidden': 'true' });
  svg.innerHTML = `<svg width="${lay.w}" height="${lay.h}" viewBox="0 0 ${lay.w} ${lay.h}"><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9z" class="farrow"/></marker></defs>${paths.join('')}</svg>`;
  world.append(svg);
  for (const n of g.nodes) {
    const p = lay.pos.get(n.id);
    const dec = n.shape === 'decision';
    const icon = dec ? h('span', { class: 'ficon' }) : null;
    if (icon) icon.innerHTML = ROUTER_ICON;
    const body = dec ? [icon, h('span', { class: 'fcap' }, n.label)] : [h('span', { class: 'flabel' }, n.label)];
    const node = h('div', { class: `fnode k-${n.kind}${dec ? ' dec' : ''}`, style: `left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px`, title: n.label },
      h('span', { class: 'fbadge' }, KIND_LABEL[n.kind], h('b', { class: 'fnum' }, String(n.n))), ...body, h('i', { class: 'port in' }), h('i', { class: 'port out' }));
    world.append(node);
  }
  for (const l of labels) world.append(l);
  stage.append(world);
  // Stage hugs the diagram instead of leaving a big empty canvas (phone: still tall enough to read).
  stage.style.height = `${Math.round(Math.max(300, Math.min(620, lay.h * 1.15 + 70)))}px`;

  let k = 1; let x = 0; let y = 0;
  const apply = () => { world.style.transform = `translate(${x}px, ${y}px) scale(${k})`; };
  const fit = () => {
    const w = stage.clientWidth || 900; const hh = stage.clientHeight || 480;
    // Narrow stage: keep text readable (>= 0.8) and start at the left edge; the rest is reached by panning.
    k = Math.max(w < 600 ? 0.8 : 0, Math.min(1.5, (w - 24) / lay.w, (hh - 24) / lay.h));
    x = lay.w * k > w - 24 ? 12 : (w - lay.w * k) / 2; y = (hh - lay.h * k) / 2; apply();
  };
  const zoomAt = (f, cx, cy) => { const k2 = Math.max(0.3, Math.min(2, k * f)); x = cx - (cx - x) * (k2 / k); y = cy - (cy - y) * (k2 / k); k = k2; apply(); };
  const ctl = h('div', { class: 'fctl' },
    h('button', { type: 'button', 'aria-label': 'Verkleinern', onclick: () => zoomAt(0.85, (stage.clientWidth || 900) / 2, (stage.clientHeight || 480) / 2) }, '−'),
    h('button', { type: 'button', 'aria-label': 'Vergrößern', onclick: () => zoomAt(1.18, (stage.clientWidth || 900) / 2, (stage.clientHeight || 480) / 2) }, '+'),
    h('button', { type: 'button', onclick: fit }, 'Einpassen'));
  stage.append(ctl);
  let drag = null;
  stage.addEventListener('pointerdown', (e) => { if (e.target.closest && e.target.closest('.fctl')) return; drag = { sx: e.clientX - x, sy: e.clientY - y }; stage.classList.add('grab'); stage.setPointerCapture?.(e.pointerId); });
  stage.addEventListener('pointermove', (e) => { if (!drag) return; x = e.clientX - drag.sx; y = e.clientY - drag.sy; apply(); });
  const end = () => { drag = null; stage.classList.remove('grab'); };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
  stage.addEventListener('wheel', (e) => { e.preventDefault(); const r = stage.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.1 : 0.9, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  stage.addEventListener('keydown', (e) => { if (e.key === '+' || e.key === '=') zoomAt(1.18, 300, 200); else if (e.key === '-') zoomAt(0.85, 300, 200); else if (e.key === '0') fit(); });
  apply(); setTimeout(fit, 0);
  return stage;
}

// No diagram in the note: derive a plain chain from the "Soll" section so the canvas is never empty.
function sollChain(title, secs) {
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
function takeMermaid(md) {
  const m = md.match(/```mermaid[ \t]*\r?\n([\s\S]*?)```/);
  return m ? { code: m[1], rest: md.replace(m[0], '') } : { code: null, rest: md };
}
// Flow page: the canvas is the page. Facts, the area's route and the notes sit around it.
async function flowPage(path, note, body, appName) {
  const m = note.meta; const a = data.apps.find((x) => x.name === appName);
  const { pre, secs } = splitSections(body);
  const { code, rest } = takeMermaid(pre);
  const head = h('header', { class: 'fp-head', 'data-s': m.status }, h('span', { class: 'mk big', 'aria-hidden': 'true' }),
    h('div', {}, h('h1', {}, m.title || path.split('/').pop().replace(/\.md$/, '')),
      h('p', { class: 'flowmeta' }, `${LABEL[m.status] || m.status} · ${m.area || ''} · ${m.prio || ''}${m.reason ? ` · ${m.reason}` : ''}`)));
  const drawn = code ? parseFlow(code) : { nodes: [], edges: [] };
  const derived = !drawn.nodes.length ? sollChain(m.title || '', secs) : null;
  const canvas = flowCanvas(derived || drawn, () => { editBody = true; route(); });
  const tags = (label, list) => (list && list.length ? h('div', { class: 'fact' }, h('span', { class: 'quiet' }, label), h('span', { class: 'tags' }, list.map((x) => h('code', { class: 'tag' }, x)))) : null);
  const facts = [tags('Screens', m.screens), tags('Endpoints', m.endpoints), m.evidence ? h('div', { class: 'fact' }, h('span', { class: 'quiet' }, 'Nachweis'), h('span', {}, m.evidence)) : null].filter(Boolean);
  const mini = a && m.area ? h('div', { class: 'miniroute' }, makeLane(a, m.area, new Set(), path)) : null;
  return { head, canvas, derived: !!derived, facts: facts.length ? h('div', { class: 'facts' }, facts) : null, mini, rest, secs };
}
async function noteView(path) {
  if (lastNote !== path) { editBody = false; lastNote = path; }
  const parts = path.split('/');
  const appName = parts[0] === 'Apps' ? parts[1] : null;
  crumbs([{ label: 'Apps', href: '#/' }, ...(appName ? [{ label: appName, href: `#/app/${encodeURIComponent(appName)}` }] : []), { label: parts.at(-1).replace(/\.md$/, '') }]);
  $view.replaceChildren(h('p', { class: 'quiet' }, 'Lädt …'));
  let note;
  try { note = await api(`/api/note?path=${encodeURIComponent(path)}`); } catch (e) { $view.replaceChildren(h('p', { class: 'quiet' }, e.message)); return; }
  const box = h('article', { class: 'note' });
  const mp = managePanel(path, note, appName);
  const body = note.body.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, alias) => alias || t);
  if (note.meta.type === 'flow') {
    const fp = await flowPage(path, note, body, appName);
    box.classList.add('wide');
    box.append(fp.head);
    if (editBody && mp) { box.append(mp, bodyEditor(path, note)); $view.replaceChildren(box); return; }
    box.append(fp.canvas);
    if (fp.derived) box.append(h('p', { class: 'quiet fcaption' }, 'Aus "Soll" abgeleitet, kein gezeichneter Ablauf. ', h('button', { type: 'button', class: 'plain', onclick: () => { editBody = true; route(); } }, 'Ablauf als Text zeichnen')));
    if (fp.facts) box.append(fp.facts);
    if (fp.mini) box.append(fp.mini);
    if (fp.rest.trim()) box.append(await renderMd(fp.rest));
    const want = (t) => /^(soll|l[uü]cken)/i.test(t);
    const pair = fp.secs.filter((s) => want(s.title)); const others = fp.secs.filter((s) => !want(s.title));
    if (pair.length) box.append(h('div', { class: 'cols' }, await Promise.all(pair.map(async (s) => h('section', { class: 'col' }, h('h2', {}, s.title), await renderMd(s.md))))));
    for (const s of others) box.append(h('section', { class: 'sec' }, h('h2', {}, s.title), await renderMd(s.md)));
    if (mp) box.append(mp);
    $view.replaceChildren(box);
    return;
  }
  if (mp) box.append(mp);
  if (editBody && mp) { box.append(bodyEditor(path, note)); $view.replaceChildren(box); return; }
  box.append(await renderMd(body));
  $view.replaceChildren(box);
}

/* ---------- routing ---------- */
async function route() {
  renderSide();
  const hash = location.hash.replace(/^#\/?/, '');
  try {
    if (hash.startsWith('app/')) appView(decodeURIComponent(hash.slice(4)));
    else if (hash.startsWith('note/')) await noteView(decodeURIComponent(hash.slice(5)));
    else homeView();
  } catch (e) { $view.replaceChildren(h('p', { class: 'quiet' }, e.message)); }
}
document.getElementById('refresh').addEventListener('click', async () => { try { await load(); await route(); toast('Aktualisiert'); } catch (e) { toast(e.message); } });
window.addEventListener('hashchange', route);
load().then(route).catch((e) => $view.replaceChildren(h('p', { class: 'quiet' }, `Daten konnten nicht geladen werden: ${e.message}`)));
