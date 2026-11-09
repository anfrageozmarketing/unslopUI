// Command Center UI - vanilla JS. All text is inserted with textContent; markdown goes through DOMPurify.
const STATUS = [
  ['missing', 'Fehlt'], ['partial', 'Teilweise'], ['exists', 'Vorhanden'], ['built', 'Gebaut'],
];
const STATUS_LABEL = Object.fromEntries(STATUS);
const AREA_ORDER = ['Zugang', 'Onboarding', 'Kernablauf', 'Einstellungen', 'System'];
const SEVERITY_RANK = { Blocker: 0, Gap: 1, Rough: 2, Polish: 3 };
const $view = document.getElementById('view');
const $crumbs = document.getElementById('crumbs');
const $side = document.getElementById('side');
let data = { apps: [] };

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

function statusBar(counts, total) {
  const bar = h('div', { class: 'bar', role: 'img', 'aria-label': STATUS.map(([k, l]) => `${l}: ${counts[k]}`).join(', ') });
  for (const [k] of STATUS) if (counts[k]) bar.append(h('i', { class: `s-${k}`, style: `width:${(counts[k] / total) * 100}%` }));
  return bar;
}
function legend(counts) {
  return h('div', { class: 'legend' }, STATUS.map(([k, l]) => h('span', {}, h('span', { class: `dot s-${k}` }), `${l} `, h('span', { class: 'num' }, counts[k]))));
}
function safeUrl(u) {
  try { const x = new URL(String(u)); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : null; } catch { return null; }
}
function currentApp() {
  const hash = location.hash.replace(/^#\/?/, '');
  if (hash.startsWith('app/')) return decodeURIComponent(hash.slice(4));
  if (hash.startsWith('note/')) { const p = decodeURIComponent(hash.slice(5)).split('/'); return p[0] === 'Apps' ? p[1] : null; }
  return null;
}
function renderSide() {
  const cur = currentApp();
  const items = data.apps.map((a) => {
    const blockers = a.findings.filter((f) => f.severity === 'Blocker' && f.state === 'open').length;
    const link = h('a', { class: 'side-item', href: `#/app/${encodeURIComponent(a.name)}`, 'aria-current': cur === a.name ? 'page' : null },
      h('div', { class: 'row' }, h('span', { class: 'name' }, a.name), blockers ? h('span', { class: 'badge blocker num', title: 'Offene Blocker' }, blockers) : null),
      h('div', { class: 'sub num' }, a.total ? `${pct(a.coverage)} abgedeckt · ${a.total} Flows` : 'Noch keine Flows'),
      a.total ? statusBar(a.counts, a.total) : null);
    const url = safeUrl(a.url);
    return h('li', {}, link, url ? h('a', { class: 'side-open', href: url, target: '_blank', rel: 'noopener noreferrer' }, 'App öffnen ↗') : null);
  });
  $side.replaceChildren(
    h('h2', {}, 'Apps'),
    h('ul', {}, h('li', {}, h('a', { class: 'side-item', href: '#/', 'aria-current': !location.hash.replace(/^#\/?/, '') ? 'page' : null }, h('div', { class: 'name' }, 'Übersicht'))), items),
  );
}
function crumbs(parts) {
  $crumbs.replaceChildren(...parts.flatMap((p, i) => [i ? h('span', {}, '/') : null, p.href ? h('a', { href: p.href }, p.label) : h('span', {}, p.label)]).filter(Boolean));
}

/* ---------- overview ---------- */
function overview() {
  crumbs([]);
  const root = h('div', {}, h('h1', {}, 'Apps'), h('p', { class: 'muted' }, 'Wähle eine App. Blocker, Entscheidungen und Flows findest du in ihrem Bereich.'));
  if (!data.apps.length) root.append(h('p', { class: 'empty' }, 'Noch keine Apps im Vault. Lege unter Apps/<Name>/ eine _App.md an.'));
  root.append(h('div', { class: 'grid' }, data.apps.map((a) =>
    h('a', { class: 'card', href: `#/app/${encodeURIComponent(a.name)}` },
      h('div', { class: 'row' }, h('h3', {}, a.name), a.score != null ? h('span', { class: 'badge num' }, `Score ${a.score}/32`) : null),
      h('div', { class: 'muted' }, a.stack || '\u00a0'),
      a.total ? [statusBar(a.counts, a.total), legend(a.counts), h('p', { class: 'muted num' }, `Abdeckung ${pct(a.coverage)} · ${a.total} Flows`)] : h('p', { class: 'muted' }, 'Noch keine Flows'),
    ))));
  $view.replaceChildren(root);
}
function noteLink(n) { return h('a', { href: `#/note/${encodeURIComponent(n.path)}` }, n.title); }
function table(head, rows) {
  return h('table', {}, h('thead', {}, h('tr', {}, head.map((x) => h('th', { scope: 'col' }, x)))), h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => h('td', {}, c))))));
}

/* ---------- app view ---------- */
// Each tab is one entry. To add a section later (Screens, API, Tests ...), add an entry here.
const openBlockers = (a) => a.findings.filter((f) => f.severity === 'Blocker' && f.state === 'open');
const openDecisions = (a) => a.decisions.filter((d) => d.state === 'open');
const TABS = [
  { key: 'overview', label: () => 'Überblick', render: (a, root) => {
      const bl = openBlockers(a); const dc = openDecisions(a);
      root.append(h('div', { class: 'grid stats' },
        stat('Flows', a.total), stat('Abdeckung', pct(a.coverage)), stat('Offene Blocker', bl.length, bl.length ? 'blocker' : ''), stat('Offene Entscheidungen', dc.length)));
      root.append(h('h2', {}, `Blocker (${bl.length})`),
        bl.length ? table(['Befund', 'Wo'], bl.map((b) => [noteLink(b), b.where])) : h('p', { class: 'empty' }, 'Keine offenen Blocker.'));
      root.append(h('h2', {}, `Offene Entscheidungen (${dc.length})`),
        dc.length ? table(['Entscheidung', 'Frage'], dc.map((d) => [noteLink(d), d.question])) : h('p', { class: 'empty' }, 'Keine offenen Entscheidungen.'));
      const next = a.flows.filter((f) => f.status === 'missing' || f.status === 'partial')
        .sort((x, y) => ['MVP', 'V1', 'V2'].indexOf(x.prio) - ['MVP', 'V1', 'V2'].indexOf(y.prio)).slice(0, 8);
      root.append(h('h2', {}, 'Nächste Flows (MVP zuerst)'),
        next.length ? table(['Flow', 'Bereich', 'Prio', 'Status'], next.map((f) => [noteLink(f), f.area, f.prio, STATUS_LABEL[f.status]])) : h('p', { class: 'empty' }, 'Alles umgesetzt.'));
  } },
  { key: 'flows', label: (a) => `Flows (${a.total})`, render: (a, root, name, _f, areas) => flowsTab(a, root, name, areas) },
  { key: 'findings', label: (a) => `Befunde (${a.findings.length})`, render: (a, root, name) => {
      const fs = [...a.findings].sort((x, y) => (SEVERITY_RANK[x.severity] ?? 9) - (SEVERITY_RANK[y.severity] ?? 9));
      root.append(fs.length ? table(['Schwere', 'Befund', 'Wo', 'Status'], fs.map((f) => [h('span', { class: `badge ${f.severity === 'Blocker' ? 'blocker' : ''}` }, f.severity), noteLink(f), f.where, select(f, 'state', ['open', 'fixed', 'wontfix'], name)])) : h('p', { class: 'empty' }, 'Keine Befunde.'));
  } },
  { key: 'decisions', label: (a) => `Entscheidungen (${a.decisions.length})`, render: (a, root, name) => {
      root.append(a.decisions.length ? table(['Entscheidung', 'Frage', 'Antwort', 'Status'], a.decisions.map((d) => [noteLink(d), d.question, d.answer, select(d, 'state', ['open', 'decided'], name)])) : h('p', { class: 'empty' }, 'Keine Entscheidungen.'));
  } },
];

/* ---------- flows management ---------- */
const PRIOS = ['MVP', 'V1', 'V2'];
const FQ = { q: '', area: '', status: '', prio: '' };
let flowView = 'list';
let showNew = false;
function statusSelect(f, appName) {
  const st = h('select', { 'aria-label': 'Status' }, STATUS.map(([k, l]) => h('option', { value: k, selected: f.status === k }, l)));
  st.addEventListener('change', () => {
    if (st.value === 'built' && !f.evidence && !confirm('Für "Gebaut" fehlt ein Nachweis (evidence). Trotzdem setzen?')) { st.value = f.status; return; }
    patch(f.path, 'status', st.value, appName);
  });
  return st;
}
function prioSelect(f, appName) {
  const pr = h('select', { 'aria-label': 'Priorität' }, PRIOS.map((v) => h('option', { value: v, selected: f.prio === v }, v)));
  pr.addEventListener('change', () => patch(f.path, 'prio', pr.value, appName));
  return pr;
}
const splitList = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean);

function flowsTab(a, root, name, areas) {
  const search = h('input', { type: 'search', placeholder: 'Flow, Screen oder Endpoint suchen', value: FQ.q, 'aria-label': 'Flows durchsuchen' });
  const filter = (key, label, opts) => {
    const s = h('select', { 'aria-label': label }, h('option', { value: '' }, label), opts.map(([v, l]) => h('option', { value: v, selected: FQ[key] === v }, l)));
    s.addEventListener('change', () => { FQ[key] = s.value; draw(); });
    return s;
  };
  const views = h('span', { class: 'tabs inline' }, [['list', 'Liste'], ['board', 'Board']].map(([k, l]) =>
    h('button', { type: 'button', 'aria-pressed': String(flowView === k), onclick: () => { flowView = k; appView(name); } }, l)));
  const newBtn = h('button', { type: 'button', class: 'ghost', onclick: () => { showNew = !showNew; appView(name); } }, showNew ? 'Abbrechen' : '+ Neuer Flow');
  root.append(h('div', { class: 'toolbar' }, search, filter('area', 'Alle Bereiche', areas.map((x) => [x, x])), filter('status', 'Alle Status', STATUS), filter('prio', 'Alle Prios', PRIOS.map((x) => [x, x])), views, newBtn));
  if (showNew) root.append(newFlowForm(a, name, areas));
  const count = h('p', { class: 'muted num' });
  const host = h('div');
  root.append(count, host);
  search.addEventListener('input', () => { FQ.q = search.value; draw(); });

  function draw() {
    const q = FQ.q.trim().toLowerCase();
    const list = a.flows.filter((f) => (!FQ.area || f.area === FQ.area) && (!FQ.status || f.status === FQ.status) && (!FQ.prio || f.prio === FQ.prio)
      && (!q || [f.title, f.area, ...f.screens, ...f.endpoints].join(' ').toLowerCase().includes(q)));
    count.textContent = `${list.length} von ${a.total} Flows`;
    if (!list.length) { host.replaceChildren(h('p', { class: 'empty' }, a.total ? 'Kein Flow passt zu den Filtern.' : 'Noch keine Flows. Lege den ersten mit "+ Neuer Flow" an.')); return; }
    const byPrio = (x, y) => PRIOS.indexOf(x.prio) - PRIOS.indexOf(y.prio) || x.title.localeCompare(y.title);
    if (flowView === 'board') {
      host.replaceChildren(h('div', { class: 'board' }, STATUS.map(([k, l]) => {
        const items = list.filter((f) => f.status === k).sort(byPrio);
        return h('section', { class: 'col', 'aria-label': l }, h('h3', {}, h('span', {}, l), h('span', { class: 'num' }, items.length)), items.map((f) => flowCard(f, name)));
      })));
      return;
    }
    const groups = [...new Set(list.map((f) => f.area))].sort((x, y) => (AREA_ORDER.indexOf(x) + 1 || 99) - (AREA_ORDER.indexOf(y) + 1 || 99));
    host.replaceChildren(...groups.flatMap((ar) => {
      const fl = list.filter((f) => f.area === ar).sort(byPrio);
      return [h('h2', {}, `${ar} · ${fl.length}`),
        table(['Flow', 'Status', 'Prio', 'Screens', 'Nachweis'], fl.map((f) => [noteLink(f), statusSelect(f, name), prioSelect(f, name), f.screens.join(', '), f.evidence ? '✓' : '']))];
    }));
  }
  draw();
}

function newFlowForm(a, appName, areas) {
  const field = (label, input) => h('label', { class: 'fld' }, h('span', {}, label), input);
  const title = h('input', { required: true, maxlength: 80, placeholder: 'z. B. Passwort zurücksetzen' });
  const area = h('input', { required: true, maxlength: 60, list: 'areas', placeholder: 'z. B. Zugang', value: FQ.area });
  const dl = h('datalist', { id: 'areas' }, [...new Set([...AREA_ORDER, ...areas])].map((x) => h('option', { value: x })));
  const st = h('select', {}, STATUS.map(([k, l]) => h('option', { value: k, selected: k === 'missing' }, l)));
  const pr = h('select', {}, PRIOS.map((v) => h('option', { value: v, selected: v === 'V1' }, v)));
  const scr = h('input', { placeholder: '/login, /forgot (Komma trennt)' });
  const ep = h('input', { placeholder: 'POST /api/auth/login (Komma trennt)' });
  const form = h('form', { class: 'newflow card' }, h('h3', {}, 'Neuer Flow'),
    h('div', { class: 'fgrid' }, field('Titel', title), field('Bereich', area), field('Status', st), field('Prio', pr), field('Screens', scr), field('Endpoints', ep)), dl,
    h('div', { class: 'row', style: 'justify-content:flex-start' }, h('button', { class: 'ghost', type: 'submit' }, 'Flow anlegen')));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const r = await api('/api/flow', { method: 'POST', body: JSON.stringify({ app: appName, area: area.value, title: title.value, status: st.value, prio: pr.value, screens: splitList(scr.value), endpoints: splitList(ep.value) }) });
      showNew = false; await load(); renderSide(); location.hash = `#/note/${encodeURIComponent(r.path)}`;
    } catch (err) { toast(err.message); }
  });
  return form;
}

/* ---------- note management (flow, finding, decision) ---------- */
const MANAGED = ['flow', 'finding', 'decision'];
let editBody = false;
let lastNote = null;
function managePanel(path, note, appName) {
  const t = note.meta.type;
  if (!MANAGED.includes(t)) return null;
  const m = note.meta;
  const inputs = {};
  const rows = [];
  const text = (key, label, val, ph = '') => { inputs[key] = h('input', { value: val || '', placeholder: ph, maxlength: 300 }); rows.push(h('label', { class: 'fld' }, h('span', {}, label), inputs[key])); };
  const pick = (key, label, pairs, val) => { inputs[key] = h('select', {}, pairs.map(([v, l]) => h('option', { value: v, selected: val === v }, l))); rows.push(h('label', { class: 'fld' }, h('span', {}, label), inputs[key])); };
  const orig = {};
  if (t === 'flow') {
    pick('status', 'Status', STATUS, m.status); pick('prio', 'Prio', PRIOS.map((v) => [v, v]), m.prio);
    text('screens', 'Screens', (m.screens || []).join(', '), 'Komma trennt'); text('endpoints', 'Endpoints', (m.endpoints || []).join(', '), 'Komma trennt');
    text('evidence', 'Nachweis (für "Gebaut")', m.evidence, 'Test, Gate oder Link');
  } else if (t === 'decision') {
    pick('state', 'Status', [['open', 'Offen'], ['decided', 'Entschieden']], m.state); text('answer', 'Antwort', m.answer);
  } else {
    pick('state', 'Status', [['open', 'Offen'], ['fixed', 'Behoben'], ['wontfix', 'Wird nicht behoben']], m.state);
    pick('severity', 'Schwere', ['Blocker', 'Gap', 'Rough', 'Polish'].map((v) => [v, v]), m.severity);
  }
  for (const k of Object.keys(inputs)) orig[k] = inputs[k].value;
  const value = (k) => (k === 'screens' || k === 'endpoints' ? splitList(inputs[k].value) : inputs[k].value);
  const save = h('button', { type: 'button', class: 'ghost' }, 'Speichern');
  save.addEventListener('click', async () => {
    const changed = Object.keys(inputs).filter((k) => inputs[k].value !== orig[k]);
    if (!changed.length) { toast('Nichts geändert'); return; }
    if (inputs.status && changed.includes('status') && inputs.status.value === 'built' && !inputs.evidence.value.trim() && !confirm('Für "Gebaut" fehlt ein Nachweis. Trotzdem speichern?')) return;
    try {
      for (const k of changed.filter((x) => x !== 'status')) await api('/api/note', { method: 'PATCH', body: JSON.stringify({ path, field: k, value: value(k) }) });
      if (changed.includes('status')) await api('/api/note', { method: 'PATCH', body: JSON.stringify({ path, field: 'status', value: value('status') }) });
      await load(); renderSide(); toast('Gespeichert'); await route();
    } catch (e) { toast(e.message); }
  });
  const edit = h('button', { type: 'button', class: 'ghost', onclick: () => { editBody = true; route(); } }, 'Text bearbeiten');
  const arch = h('button', { type: 'button', class: 'ghost danger', onclick: async () => {
    if (!confirm('Notiz archivieren? Sie verschwindet aus der Übersicht und liegt im Ordner _Archiv der App.')) return;
    try { await api('/api/note', { method: 'DELETE', body: JSON.stringify({ path }) }); await load(); renderSide(); toast('Archiviert'); location.hash = appName ? `#/app/${encodeURIComponent(appName)}` : '#/'; } catch (e) { toast(e.message); }
  } }, 'Archivieren');
  return h('section', { class: 'manage', 'aria-label': 'Verwalten' }, h('div', { class: 'fgrid' }, rows), h('div', { class: 'row', style: 'justify-content:flex-start;margin-top:12px' }, save, edit, arch));
}
function bodyEditor(path, note) {
  const ta = h('textarea', { class: 'editor', rows: 22, spellcheck: 'false', 'aria-label': 'Notiztext (Markdown)' });
  ta.value = note.body.replace(/^\n+/, '');
  const save = h('button', { type: 'button', class: 'ghost' }, 'Text speichern');
  save.addEventListener('click', async () => {
    try { await api('/api/note', { method: 'PUT', body: JSON.stringify({ path, body: ta.value }) }); editBody = false; await load(); toast('Gespeichert'); await route(); } catch (e) { toast(e.message); }
  });
  const cancel = h('button', { type: 'button', class: 'ghost', onclick: () => { editBody = false; route(); } }, 'Abbrechen');
  return h('div', {}, h('p', { class: 'muted' }, 'Markdown. Diagramme als ```mermaid-Block. Die Eigenschaften oben bleiben unverändert.'), ta, h('div', { class: 'row', style: 'justify-content:flex-start;margin-top:12px' }, save, cancel));
}

function stat(label, value, cls = '') {
  return h('div', { class: 'card stat' }, h('div', { class: `big num ${cls}` }, String(value ?? '–')), h('div', { class: 'muted' }, label));
}
let appTab = 'overview';
let areaFilter = '';
let lastApp = null;
function appView(name) {
  const a = data.apps.find((x) => x.name === name);
  if (!a) { $view.replaceChildren(h('p', { class: 'empty' }, 'App nicht gefunden.')); return; }
  if (lastApp !== name) { lastApp = name; appTab = 'overview'; areaFilter = ''; }
  crumbs([{ label: 'Apps', href: '#/' }, { label: a.name }]);
  const areas = [...new Set(a.flows.map((f) => f.area))].sort((x, y) => (AREA_ORDER.indexOf(x) + 1 || 99) - (AREA_ORDER.indexOf(y) + 1 || 99));
  const appUrl = safeUrl(a.url);
  const root = h('div', {}, h('div', { class: 'row' }, h('h1', {}, a.name), h('span', { class: 'row' }, a.score != null ? h('span', { class: 'badge num' }, `Score ${a.score}/32`) : null, appUrl ? h('a', { class: 'btn-open', href: appUrl, target: '_blank', rel: 'noopener noreferrer' }, 'App öffnen ↗') : null)));
  if (a.total) root.append(statusBar(a.counts, a.total), legend(a.counts));
  const tab = TABS.find((t) => t.key === appTab) || TABS[0];
  root.append(h('div', { class: 'tabs', style: 'margin-top:16px' }, TABS.map((t) =>
    h('button', { type: 'button', 'aria-pressed': String(t.key === tab.key), onclick: () => { appTab = t.key; appView(name); } }, t.label(a)))));
  const flows = a.flows.filter((f) => !areaFilter || f.area === areaFilter);
  tab.render(a, root, name, flows, areas);
  $view.replaceChildren(root);
}
function select(item, field, values, appName) {
  const s = h('select', { 'aria-label': field }, values.map((v) => h('option', { value: v, selected: item[field] === v }, v)));
  s.addEventListener('change', () => patch(item.path, field, s.value, appName));
  return s;
}
function flowCard(f, appName) {
  return h('div', { class: 'flow' }, noteLink(f), h('div', { class: 'muted' }, f.area), h('div', { class: 'meta' }, statusSelect(f, appName), prioSelect(f, appName)));
}
async function patch(path, field, value, appName) {
  try {
    await api('/api/note', { method: 'PATCH', body: JSON.stringify({ path, field, value }) });
    await load(); renderSide(); appView(appName); toast("Gespeichert");
  } catch (e) { toast(e.message); await load(); appView(appName); }
}

/* ---------- note view ---------- */
async function noteView(path) {
  if (lastNote !== path) { editBody = false; lastNote = path; }
  const parts = path.split('/');
  const appName = parts[0] === 'Apps' ? parts[1] : null;
  crumbs([{ label: 'Apps', href: '#/' }, ...(appName ? [{ label: appName, href: `#/app/${encodeURIComponent(appName)}` }] : []), { label: parts.at(-1).replace(/\.md$/, '') }]);
  $view.replaceChildren(h('p', { class: 'muted' }, 'Lädt …'));
  let note;
  try { note = await api(`/api/note?path=${encodeURIComponent(path)}`); } catch (e) { $view.replaceChildren(h('p', { class: 'empty' }, e.message)); return; }
  const box = h('article', { class: 'note' });
  const mp = managePanel(path, note, appName);
  if (mp) box.append(mp);
  const meta = Object.entries(note.meta).filter(([k, v]) => v !== '' && !(Array.isArray(v) && !v.length));
  if (meta.length && !mp) box.append(h('p', { class: 'legend' }, meta.map(([k, v]) => h('span', {}, h('b', {}, `${k}: `), Array.isArray(v) ? v.join(', ') : String(v)))));
  if (editBody && mp) { box.append(bodyEditor(path, note)); $view.replaceChildren(box); return; }
  const body = note.body.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, alias) => alias || t);
  if (window.marked && window.DOMPurify) {
    const holder = h('div');
    holder.innerHTML = window.DOMPurify.sanitize(window.marked.parse(body, { gfm: true }));
    box.append(holder);
    if (window.mermaid) {
      window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default' });
      const blocks = [...holder.querySelectorAll('pre > code.language-mermaid')];
      for (const [i, code] of blocks.entries()) {
        try {
          const { svg } = await window.mermaid.render(`m${Date.now()}_${i}`, code.textContent);
          const wrap = h('div'); wrap.innerHTML = window.DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
          code.parentElement.replaceWith(wrap);
        } catch { /* keep the code block visible if the diagram is invalid */ }
      }
    }
  } else {
    box.append(h('pre', {}, body));
  }
  $view.replaceChildren(box);
}

/* ---------- routing ---------- */
async function route() {
  renderSide();
  const hash = location.hash.replace(/^#\/?/, '');
  try {
    if (hash.startsWith('app/')) appView(decodeURIComponent(hash.slice(4)));
    else if (hash.startsWith('note/')) await noteView(decodeURIComponent(hash.slice(5)));
    else overview();
  } catch (e) { $view.replaceChildren(h('p', { class: 'empty' }, e.message)); }
}
document.getElementById('refresh').addEventListener('click', async () => { try { await load(); await route(); toast('Aktualisiert'); } catch (e) { toast(e.message); } });
window.addEventListener('hashchange', route);
load().then(route).catch((e) => $view.replaceChildren(h('p', { class: 'empty' }, `Daten konnten nicht geladen werden: ${e.message}`)));
