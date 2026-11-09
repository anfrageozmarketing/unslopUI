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
  { key: 'board', label: () => 'Board', filter: true, render: (a, root, name, flows) => {
      if (!flows.length) root.append(h('p', { class: 'empty' }, 'Keine Flows in dieser Auswahl.'));
      root.append(h('div', { class: 'board' }, STATUS.map(([k, l]) => {
        const items = flows.filter((f) => f.status === k).sort((x, y) => x.prio.localeCompare(y.prio));
        return h('section', { class: 'col', 'aria-label': l }, h('h3', {}, h('span', {}, l), h('span', { class: 'num' }, items.length)), items.map((f) => flowCard(f, name)));
      })));
  } },
  { key: 'areas', label: () => 'Bereiche', filter: true, render: (a, root, name, flows, areas) => {
      for (const ar of areas.filter((x) => !areaFilter || x === areaFilter)) {
        const fl = a.flows.filter((f) => f.area === ar);
        const c = { missing: 0, partial: 0, exists: 0, built: 0 }; fl.forEach((f) => c[f.status]++);
        root.append(h('h2', {}, `${ar} · ${fl.length}`), statusBar(c, fl.length), table(['Flow', 'Status', 'Prio', 'Screens', 'Endpoints'], fl.map((f) => [noteLink(f), STATUS_LABEL[f.status] || f.status, f.prio, f.screens.join(', '), f.endpoints.join(', ')])));
      }
  } },
  { key: 'findings', label: (a) => `Befunde (${a.findings.length})`, render: (a, root, name) => {
      const fs = [...a.findings].sort((x, y) => (SEVERITY_RANK[x.severity] ?? 9) - (SEVERITY_RANK[y.severity] ?? 9));
      root.append(fs.length ? table(['Schwere', 'Befund', 'Wo', 'Status'], fs.map((f) => [h('span', { class: `badge ${f.severity === 'Blocker' ? 'blocker' : ''}` }, f.severity), noteLink(f), f.where, select(f, 'state', ['open', 'fixed', 'wontfix'], name)])) : h('p', { class: 'empty' }, 'Keine Befunde.'));
  } },
  { key: 'decisions', label: (a) => `Entscheidungen (${a.decisions.length})`, render: (a, root, name) => {
      root.append(a.decisions.length ? table(['Entscheidung', 'Frage', 'Antwort', 'Status'], a.decisions.map((d) => [noteLink(d), d.question, d.answer, select(d, 'state', ['open', 'decided'], name)])) : h('p', { class: 'empty' }, 'Keine Entscheidungen.'));
  } },
];
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
  if (tab.filter) root.append(h('div', { class: 'tabs' }, ['Alle', ...areas].map((ar) => h('button', { type: 'button', 'aria-pressed': String((areaFilter || 'Alle') === ar), onclick: () => { areaFilter = ar === 'Alle' ? '' : ar; appView(name); } }, ar))));
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
  const st = h('select', { 'aria-label': 'Status' }, STATUS.map(([k, l]) => h('option', { value: k, selected: f.status === k }, l)));
  st.addEventListener('change', () => {
    if (st.value === 'built' && !f.evidence && !confirm('Für "Gebaut" fehlt ein Nachweis (evidence) in der Notiz. Trotzdem setzen?')) { st.value = f.status; return; }
    patch(f.path, 'status', st.value, appName);
  });
  const pr = h('select', { 'aria-label': 'Priorität' }, ['MVP', 'V1', 'V2'].map((v) => h('option', { value: v, selected: f.prio === v }, v)));
  pr.addEventListener('change', () => patch(f.path, 'prio', pr.value, appName));
  return h('div', { class: 'flow' }, noteLink(f), h('div', { class: 'muted' }, f.area), h('div', { class: 'meta' }, st, pr));
}
async function patch(path, field, value, appName) {
  try {
    await api('/api/note', { method: 'PATCH', body: JSON.stringify({ path, field, value }) });
    await load(); renderSide(); appView(appName); toast("Gespeichert");
  } catch (e) { toast(e.message); await load(); appView(appName); }
}

/* ---------- note view ---------- */
async function noteView(path) {
  const parts = path.split('/');
  const appName = parts[0] === 'Apps' ? parts[1] : null;
  crumbs([{ label: 'Apps', href: '#/' }, ...(appName ? [{ label: appName, href: `#/app/${encodeURIComponent(appName)}` }] : []), { label: parts.at(-1).replace(/\.md$/, '') }]);
  $view.replaceChildren(h('p', { class: 'muted' }, 'Lädt …'));
  let note;
  try { note = await api(`/api/note?path=${encodeURIComponent(path)}`); } catch (e) { $view.replaceChildren(h('p', { class: 'empty' }, e.message)); return; }
  const box = h('article', { class: 'note' });
  const meta = Object.entries(note.meta).filter(([k, v]) => v !== '' && !(Array.isArray(v) && !v.length));
  if (meta.length) box.append(h('p', { class: 'legend' }, meta.map(([k, v]) => h('span', {}, h('b', {}, `${k}: `), Array.isArray(v) ? v.join(', ') : String(v)))));
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
