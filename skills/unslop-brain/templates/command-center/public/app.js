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
// Flow page: facts first, the diagram as hero, "Soll" and "Lücken" side by side.
async function flowPage(path, note, body, appName) {
  const m = note.meta; const a = data.apps.find((x) => x.name === appName);
  const page = h('div', { class: 'flowpage' });
  page.append(h('header', { class: 'fp-head', 'data-s': m.status }, h('span', { class: 'mk big', 'aria-hidden': 'true' }),
    h('div', {}, h('h1', {}, m.title || path.split('/').pop().replace(/\.md$/, '')),
      h('p', { class: 'flowmeta' }, `${LABEL[m.status] || m.status} · ${m.area || ''} · ${m.prio || ''}${m.reason ? ` · ${m.reason}` : ''}`))));
  const facts = [];
  const tags = (label, list) => (list && list.length ? h('div', { class: 'fact' }, h('span', { class: 'quiet' }, label), h('span', { class: 'tags' }, list.map((x) => h('code', { class: 'tag' }, x)))) : null);
  facts.push(tags('Screens', m.screens), tags('Endpoints', m.endpoints));
  if (m.evidence) facts.push(h('div', { class: 'fact' }, h('span', { class: 'quiet' }, 'Nachweis'), h('span', {}, m.evidence)));
  if (facts.some(Boolean)) page.append(h('div', { class: 'facts' }, facts));
  if (a && m.area) page.append(h('div', { class: 'miniroute' }, makeLane(a, m.area, new Set(), path)));
  return { page, ...splitSections(body) };
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
    const { page, pre, secs } = await flowPage(path, note, body, appName);
    box.classList.add('wide');
    box.append(page);
    if (mp) box.append(mp);
    if (editBody && mp) { box.append(bodyEditor(path, note)); $view.replaceChildren(box); return; }
    if (pre.trim()) box.append(await renderMd(pre));
    const want = (t) => /^(soll|l[uü]cken)/i.test(t);
    const pair = secs.filter((s) => want(s.title)); const rest = secs.filter((s) => !want(s.title));
    if (pair.length) box.append(h('div', { class: 'cols' }, await Promise.all(pair.map(async (s) => h('section', { class: 'col' }, h('h2', {}, s.title), await renderMd(s.md))))));
    for (const s of rest) box.append(h('section', { class: 'sec' }, h('h2', {}, s.title), await renderMd(s.md)));
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
