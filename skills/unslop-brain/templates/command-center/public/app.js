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
function toast(msg, action) {
  const t = document.getElementById('toast');
  t.replaceChildren(msg, action ? h('button', { type: 'button', class: 'toast-act', onclick: () => { t.classList.remove('show'); action.run(); } }, icon('undo', 16), action.label) : null);
  t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), action ? 7000 : 2500);
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

/* ---------- icon set: one 24px grid, 2.6px round strokes, drawn here (never from note content) ---------- */
const ICONS = {
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12 20 3M16 7l3 3"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  server: '<rect x="3.5" y="4" width="17" height="6.5" rx="2"/><rect x="3.5" y="13.5" width="17" height="6.5" rx="2"/><path d="M7.5 7.25h.01M7.5 16.75h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pencil: '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z"/>',
  archive: '<rect x="3.5" y="4" width="17" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
  zoomIn: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.5-4.5M11 8v6M8 11h6"/>',
  zoomOut: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.5-4.5M8 11h6"/>',
  fit: '<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.5-4.5"/>',
  alert: '<path d="M12 4 3 19.5h18z"/><path d="M12 10v4.5M12 17.5h.01"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
  bolt: '<path d="M13 3 5 13.5h6L10 21l9-11h-6z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
  apps: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
  undo: '<path d="M9 6 4 11l5 5M4 11h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  more: '<path d="M5 12h.01M12 12h.01M19 12h.01"/>',
  dot: '<circle cx="12" cy="12" r="3"/>',
};
const AREA_ICON = { Zugang: 'key', Onboarding: 'flag', Kernablauf: 'route', Einstellungen: 'sliders', System: 'server' };
function icon(name, size = 20) {
  const s = h('span', { class: 'ic', 'aria-hidden': 'true' });
  s.innerHTML = `<svg viewBox="0 0 24 24" width="${Number(size)}" height="${Number(size)}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.dot}</svg>`;
  return s;
}
const iconBtn = (name, label, onclick, cls = '') => h('button', { type: 'button', class: `ibtn ${cls}`.trim(), 'aria-label': label, title: label, onclick }, icon(name, 18));

/* ---------- generated picture: every app gets a star chart of its own flows, seeded by its name ---------- */
function hashStr(s) { let x = 2166136261; for (const c of String(s)) { x ^= c.codePointAt(0); x = Math.imul(x, 16777619); } return x >>> 0; }
function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// A bold composition: big flat status-coloured fields, one thick route per area, one node shape per area.
// Only numbers and whitelisted names go into the markup, so no note content can reach it.
const AREA_SHAPE = { Zugang: 'sq', Onboarding: 'tri', Kernablauf: 'circ', Einstellungen: 'dia', System: 'hex' };
function shapeAt(kind, x, y, r) {
  const f = (n) => Math.round(n * 10) / 10;
  if (kind === 'sq') return `<rect x="${f(x - r)}" y="${f(y - r)}" width="${f(r * 2)}" height="${f(r * 2)}" rx="${f(r * 0.3)}"`;
  if (kind === 'tri') return `<polygon points="${f(x)},${f(y - r * 1.15)} ${f(x + r * 1.1)},${f(y + r * 0.85)} ${f(x - r * 1.1)},${f(y + r * 0.85)}"`;
  if (kind === 'dia') return `<polygon points="${f(x)},${f(y - r * 1.25)} ${f(x + r * 1.25)},${f(y)} ${f(x)},${f(y + r * 1.25)} ${f(x - r * 1.25)},${f(y)}"`;
  if (kind === 'hex') return `<polygon points="${[0, 1, 2, 3, 4, 5].map((i) => `${f(x + r * 1.15 * Math.cos(i * Math.PI / 3))},${f(y + r * 1.15 * Math.sin(i * Math.PI / 3))}`).join(' ')}"`;
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}"`;
}
function artSvg(a, W = 800, H = 240, edge = false) {
  const rnd = mulberry(hashStr(a.name)); const areas = areasOf(a); const parts = []; const sts = (s) => (LABEL[s] ? s : 'na');
  const present = STATUS.map(([k]) => k).filter((k) => a.flows.some((f) => f.status === k)); const pool = present.length ? present : ['na'];
  const pick = () => pool[Math.floor(rnd() * pool.length)];
  const fields = edge ? 6 : 3;
  for (let i = 0; i < fields; i++) {
    const left = edge && i < 3; const r = Math.round(H * (0.45 + rnd() * 0.5));
    const cx = left ? Math.round(rnd() * 200) : Math.round(rnd() * W); const cy = left ? Math.round(H * (0.12 + i * 0.32 + rnd() * 0.1)) : Math.round(rnd() * H);
    parts.push(rnd() < 0.5 ? `<circle class="fld st-${pick()}" cx="${cx}" cy="${cy}" r="${r}"/>` : `<rect class="fld st-${pick()}" x="${cx - r}" y="${cy - Math.round(r * 0.45)}" width="${r * 2}" height="${Math.round(r * 0.9)}" rx="${Math.round(r * 0.45)}" transform="rotate(${Math.round(rnd() * 60 - 30)} ${cx} ${cy})"/>`);
  }
  const band = H / (areas.length + 1); const unit = edge ? 1.9 : 1;
  areas.forEach((ar, i) => {
    const fl = a.flows.filter((f) => f.area === ar); const shape = AREA_SHAPE[ar] || 'circ'; let x = 30 + rnd() * 60;
    const counts = {}; for (const f of fl) counts[sts(f.status)] = (counts[sts(f.status)] || 0) + 1;
    const dom = Object.keys(counts).sort((p, q) => counts[q] - counts[p])[0] || 'na';
    const pts = fl.map((f) => { x += ((W - 190) / fl.length) * (0.75 + rnd() * 0.5); return { f, x: Math.min(W - 70, Math.round(x)), y: Math.round(band * (i + 1) + (rnd() - 0.5) * band * 0.6) }; });
    if (pts.length > 1) parts.push(`<polyline class="rt st-${dom}" points="${pts.map((p) => `${p.x},${p.y}`).join(' ')}"/>`);
    for (const p of pts) { const r = (p.f.prio === 'MVP' ? 15 : p.f.prio === 'V1' ? 11 : 8) * unit; parts.push(`${shapeAt(shape, p.x, p.y, r)} class="nd st-${sts(p.f.status)}"/>`); }
  });
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${parts.join('')}</svg>`;
}
function artBox(a, cls) { const d = h('div', { class: `art ${cls}`, 'aria-hidden': 'true' }); d.innerHTML = artSvg(a); return d; }
function setBackdrop() {
  const el = document.getElementById('backdrop'); if (!el) return;
  const cur = currentApp(); const a = data.apps.find((x) => x.name === cur);
  el.innerHTML = artSvg(a || { name: 'Command Center', flows: data.apps.flatMap((x) => x.flows) }, 1200, 700, true);
}

/* ---------- direct manipulation: popover, segmented switch, inline text, undo ---------- */
let openPop = null;
function closePopover(focusBack = true) {
  if (!openPop) return; const { el, anchor, off } = openPop; openPop = null;
  el.remove(); document.removeEventListener('pointerdown', off, true); if (focusBack) anchor.focus?.();
}
function popover(anchor, options, current, onPick, label) {
  closePopover(false);
  const list = h('div', { class: 'pop glass', role: 'listbox', 'aria-label': label });
  const items = options.map(([v, l, st]) => h('button', { type: 'button', role: 'option', class: 'pop-item', tabindex: '-1', 'aria-selected': String(v === current), 'data-s': st || null,
    onclick: () => { closePopover(); if (v !== current) onPick(v); } }, st ? h('span', { class: 'mk', 'aria-hidden': 'true' }) : null, l, v === current ? icon('check', 16) : null));
  list.append(...items);
  const off = (e) => { if (!list.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) closePopover(false); };
  list.addEventListener('keydown', (e) => {
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === 'Escape') { e.preventDefault(); closePopover(); }
    else if (e.key === 'Tab') closePopover(false);
  });
  document.body.append(list); document.addEventListener('pointerdown', off, true);
  const r = anchor.getBoundingClientRect();
  list.style.left = `${Math.max(8, Math.min(window.innerWidth - 220, r.left))}px`; list.style.top = `${Math.min(window.innerHeight - items.length * 46 - 16, r.bottom + 6)}px`;
  openPop = { el: list, anchor, off };
  (items[Math.max(0, options.findIndex(([v]) => v === current))] || items[0]).focus();
}
// 2-3 values as a switch; el.value holds the current one.
function segmented(options, current, onPick, label) {
  const el = h('div', { class: 'seg3', role: 'radiogroup', 'aria-label': label }); el.value = current;
  const btns = options.map(([v, l]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(v === current), 'data-v': v, onclick: () => pick(v) }, l));
  const pick = (v) => { if (v === el.value) return; el.value = v; btns.forEach((b) => b.setAttribute('aria-checked', String(b.getAttribute('data-v') === v))); onPick?.(v); };
  el.addEventListener('keydown', (e) => { const i = btns.indexOf(document.activeElement); if (e.key === 'ArrowRight' && i < btns.length - 1) { e.preventDefault(); btns[i + 1].focus(); } else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); btns[i - 1].focus(); } });
  el.append(...btns); return el;
}
function inlineText({ value, placeholder, label, onSave }) {
  const view = h('button', { type: 'button', class: 'inl', 'aria-label': `${label} bearbeiten` }, value ? value : h('span', { class: 'ph' }, placeholder));
  view.addEventListener('click', () => {
    const inp = h('input', { class: 'inl-in', value: value || '', placeholder, maxlength: 300, 'aria-label': label });
    view.replaceWith(inp); inp.focus(); let done = false;
    const finish = (save) => { if (done) return; done = true; if (save && inp.value !== (value || '')) onSave(inp.value); else inp.replaceWith(view); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); finish(true); } else if (e.key === 'Escape') { e.preventDefault(); finish(false); } });
    inp.addEventListener('blur', () => finish(true));
  });
  return view;
}
async function patchNote(path, field, value) { await api('/api/note', { method: 'PATCH', body: JSON.stringify({ path, field, value }) }); }
// Optimistic change: apply(v) updates the screen at once, the request follows, undo goes back to prev.
async function change(path, field, value, prev, apply) {
  const commit = async (v) => { await patchNote(path, field, v); await load(); renderSide(); };
  try {
    apply?.(value); await commit(value); await route();
    toast('Gespeichert', { label: 'Rückgängig', run: async () => { try { await commit(prev); await route(); toast('Zurückgesetzt'); } catch (e) { toast(e.message); } } });
  } catch (e) { apply?.(prev); toast(e.message); }
}

/* ---------- command palette (Ctrl/Cmd+K) ---------- */
function paletteItems(q, d = data, cur = currentApp()) {
  const items = [];
  if (cur) for (const [label, tab] of [['Neuen Flow anlegen', 'flows'], ['Neuen Befund anlegen', 'findings'], ['Neue Entscheidung anlegen', 'decisions']]) items.push({ kind: 'Aktion', ic: 'plus', label, sub: cur, run: () => gotoNew(cur, tab) });
  items.push({ kind: 'Aktion', ic: 'refresh', label: 'Daten aktualisieren', run: async () => { await load(); await route(); toast('Aktualisiert'); } });
  for (const a of d.apps) items.push({ kind: 'App', ic: 'apps', label: a.name, sub: a.stack || '', href: `#/app/${encodeURIComponent(a.name)}` });
  for (const a of d.apps) {
    for (const f of a.flows) items.push({ kind: 'Flow', ic: AREA_ICON[f.area] || 'route', st: f.status, label: f.title, sub: `${a.name} · ${f.area} · ${LABEL[f.status] || f.status}`, href: noteHref(f) });
    for (const f of a.findings) items.push({ kind: 'Befund', ic: 'alert', label: f.title, sub: `${a.name} · ${f.severity}`, href: noteHref(f) });
    for (const x of a.decisions) items.push({ kind: 'Entscheidung', ic: 'question', label: x.question || x.title, sub: `${a.name} · ${x.title}`, href: noteHref(x) });
  }
  const toks = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((i) => { const hay = `${i.label} ${i.sub || ''} ${i.kind}`.toLowerCase(); return toks.every((t) => hay.includes(t)); }).slice(0, 40);
}
let pal = null;
function closePalette() { if (!pal) return; const { back, prev } = pal; pal = null; back.remove(); prev?.focus?.(); }
function openPalette() {
  if (pal) return; closePopover(false);
  const input = h('input', { class: 'pal-in', type: 'text', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'pal-list', 'aria-autocomplete': 'list', placeholder: 'Apps, Flows, Befunde, Entscheidungen suchen …', 'aria-label': 'Suchen und springen', autocomplete: 'off' });
  const list = h('ul', { class: 'pal-list', id: 'pal-list', role: 'listbox', 'aria-label': 'Treffer' });
  const box = h('div', { class: 'pal glass', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Befehlspalette' }, h('div', { class: 'pal-top' }, icon('search', 20), input), list);
  const back = h('div', { class: 'pal-back' }, box);
  let res = []; let sel = 0;
  const draw = () => {
    res = paletteItems(input.value);
    list.replaceChildren(...(res.length ? res.map((it, i) => h('li', { id: `pal-${i}`, role: 'option', class: 'pal-item', 'aria-selected': String(i === sel), 'data-s': it.st || null, onclick: () => run(it) },
      it.st ? h('span', { class: 'mk', 'aria-hidden': 'true' }) : icon(it.ic, 18), h('span', { class: 'pal-l' }, it.label), h('span', { class: 'quiet pal-s' }, it.sub || ''), h('span', { class: 'pal-k' }, it.kind)))
      : [h('li', { class: 'quiet pal-none' }, 'Nichts gefunden.')]));
    input.setAttribute('aria-activedescendant', res.length ? `pal-${sel}` : '');
    list.children[sel]?.scrollIntoView?.({ block: 'nearest' });
  };
  const run = (it) => { closePalette(); if (it.href) location.hash = it.href; else it.run?.(); };
  input.addEventListener('input', () => { sel = 0; draw(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(res.length - 1, sel + 1); draw(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (res[sel]) run(res[sel]); }
    else if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
  });
  back.addEventListener('pointerdown', (e) => { if (e.target === back) closePalette(); });
  document.body.append(back); pal = { back, prev: document.activeElement }; draw(); input.focus();
}
function gotoNew(name, tab) {
  lastApp = name; appTab = tab; focusQuick = true;
  const target = `#/app/${encodeURIComponent(name)}`;
  if (location.hash === target) route(); else location.hash = target;
}
// j/k walk through the rows of the current list; Enter follows the focused link.
function walkRows(dir) {
  const rows = [...$view.querySelectorAll('[data-nav]')]; if (!rows.length) return;
  const i = rows.indexOf(document.activeElement); rows[Math.max(0, Math.min(rows.length - 1, i < 0 ? (dir > 0 ? 0 : rows.length - 1) : i + dir))].focus();
}
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal ? closePalette() : openPalette(); return; }
  const t = e.target; if (pal || e.ctrlKey || e.metaKey || e.altKey) return;
  if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
  if (e.key === 'j') walkRows(1); else if (e.key === 'k') walkRows(-1); else if (e.key === '/') { e.preventDefault(); openPalette(); }
});

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
  return h('section', { class: 'lane', 'aria-label': ar }, h('header', {}, h('h3', {}, icon(AREA_ICON[ar] || 'route', 22), ar), h('span', { class: 'quiet num' }, `${done}/${flows.length}`)), track);
}
function routeMap(a, active) {
  const areas = areasOf(a);
  if (!areas.length) return h('p', { class: 'quiet' }, 'Noch keine Flows. Lege den ersten unten mit "Neuer Flow" an.');
  return h('div', { class: 'map' }, areas.map((ar) => makeLane(a, ar, active, null)));
}
function legend(a, active, onToggle) {
  return h('div', { class: 'legend', role: 'group', 'aria-label': 'Status filtern' }, STATUS.filter(([k]) => a.counts[k]).map(([k, l]) =>
    h('button', { type: 'button', class: `chip${active.has(k) ? ' on' : ''}`, 'data-s': k, 'aria-pressed': String(active.has(k)), onclick: () => onToggle(k) },
      h('span', { class: 'mk', 'aria-hidden': 'true' }), l, ' ', h('span', { class: 'num' }, a.counts[k]))));
}
// One sentence instead of KPI cards.
function summaryText(a) {
  const bl = blockersOf(a).length; const dc = decisionsOf(a).length;
  const parts = [`${a.total} Flows, ${pct(a.coverage)} abgedeckt`];
  if (bl) parts.push(`${bl} offene Blocker`);
  if (dc) parts.push(`${dc} offene Entscheidungen`);
  return parts.join(' · ');
}
const summary = (a) => h('p', { class: 'summary' }, summaryText(a));

/* ---------- side + home ---------- */
function renderSide() {
  const cur = currentApp();
  $side.replaceChildren(
    h('a', { class: 'side-item home', href: '#/', 'aria-current': !location.hash.replace(/^#\/?/, '') ? 'page' : null }, icon('apps', 18), 'Alle Apps'),
    h('ul', {}, data.apps.map((a) => {
      const bl = blockersOf(a).length; const url = safeUrl(a.url);
      return h('li', {},
        h('a', { class: 'side-item', href: `#/app/${encodeURIComponent(a.name)}`, 'aria-current': cur === a.name ? 'page' : null },
          h('span', { class: 'row' }, h('span', { class: 'name' }, a.name), bl ? h('span', { class: 'dotbad', title: `${bl} offene Blocker` }, bl) : null), strip(a, { compact: true })),
        url ? h('a', { class: 'side-open', href: url, target: '_blank', rel: 'noopener noreferrer' }, 'App öffnen', icon('external', 14)) : null);
    })));
}
function homeView() {
  crumbs([]);
  const root = h('div', {}, h('h1', {}, 'Apps'));
  if (!data.apps.length) root.append(h('p', { class: 'quiet' }, 'Noch keine Apps im Vault. Lege unter Apps/<Name>/ eine _App.md an.'));
  root.append(h('div', { class: 'apps' }, data.apps.map((a) =>
    h('a', { class: 'app-row', href: `#/app/${encodeURIComponent(a.name)}`, 'data-nav': true }, artBox(a, 'row-art'),
      h('div', { class: 'app-head' }, h('h2', {}, a.name), a.stack ? h('span', { class: 'quiet' }, a.stack) : null),
      strip(a), summary(a)))));
  $view.replaceChildren(root);
}

/* ---------- app view ---------- */
let appTab = 'flows';
let lastApp = null;
let focusQuick = false;
const active = new Set();
const TABS = [
  { key: 'flows', ic: 'route', label: 'Flows', n: (a) => a.total },
  { key: 'attention', ic: 'bolt', label: 'Aufmerksamkeit', n: () => null },
  { key: 'findings', ic: 'alert', label: 'Befunde', n: (a) => a.findings.length },
  { key: 'decisions', ic: 'question', label: 'Entscheidungen', n: (a) => a.decisions.length },
];
function appView(name) {
  const a = data.apps.find((x) => x.name === name);
  if (!a) { $view.replaceChildren(h('p', { class: 'quiet' }, 'App nicht gefunden.')); return; }
  if (lastApp !== name) { lastApp = name; appTab = 'flows'; active.clear(); }
  crumbs([{ label: 'Apps', href: '#/' }, { label: a.name }]);
  const url = safeUrl(a.url);
  const root = h('div', {},
    h('header', { class: 'hero' }, artBox(a, 'hero-art'), h('div', { class: 'hero-body' },
      h('div', { class: 'app-top' }, h('h1', {}, a.name), url ? h('a', { class: 'btn-open', href: url, target: '_blank', rel: 'noopener noreferrer' }, 'App öffnen', icon('external', 16)) : null),
      strip(a), h('p', { class: 'summary' }, `${a.score != null ? `Score ${a.score}/36 · ` : ''}${summaryText(a)}`))),
    h('nav', { class: 'tabs', 'aria-label': 'Bereiche' }, TABS.map((t) => h('button', { type: 'button', 'aria-pressed': String(t.key === appTab), onclick: () => { appTab = t.key; appView(name); } },
      icon(t.ic, 18), t.label, t.n(a) != null ? h('span', { class: 'num cnt' }, t.n(a)) : null))));
  ({ flows: flowsTab, attention: attentionTab, findings: findingsTab, decisions: decisionsTab }[appTab])(a, root, name);
  $view.replaceChildren(root);
  if (focusQuick) { focusQuick = false; $view.querySelector?.('.quick input')?.focus(); }
}
function flowsTab(a, root, name) {
  root.append(h('div', { class: 'bar' }, legend(a, active, (k) => { if (active.has(k)) active.delete(k); else active.add(k); appView(name); })));
  root.append(routeMap(a, active));
  root.append(quickAdd('Neuer Flow', name, '/api/flow', 'Neuer Flow: Titel tippen, Enter', [
    ['area', 'Bereich', h('input', { required: true, maxlength: 60, list: 'areas', placeholder: 'Bereich, z. B. Zugang', value: areasOf(a)[0] || '' }), true],
    ['prio', 'Priorität', segmented(PRIOS.map((v) => [v, v]), 'V1', null, 'Priorität')],
    ['screens', 'Screens', h('input', { placeholder: '/login, /forgot' })],
    ['endpoints', 'Endpoints', h('input', { placeholder: 'POST /api/auth/login' })],
  ], (b) => ({ ...b, screens: splitList(b.screens), endpoints: splitList(b.endpoints) }),
  h('datalist', { id: 'areas' }, [...new Set([...AREA_ORDER, ...areasOf(a)])].map((x) => h('option', { value: x })))));
}
function attentionTab(a, root) {
  const bl = blockersOf(a); const dc = decisionsOf(a);
  const next = a.flows.filter((f) => f.status === 'missing' || f.status === 'partial').sort((x, y) => PRIOS.indexOf(x.prio) - PRIOS.indexOf(y.prio)).slice(0, 6);
  const group = (title, ic, items, empty) => h('section', { class: 'stream' }, h('h2', {}, icon(ic, 22), title),
    items.length ? h('ul', {}, items) : h('p', { class: 'quiet' }, empty));
  root.append(
    group('Blocker', 'alert', bl.map((b) => h('li', {}, h('a', { href: noteHref(b), class: 'line bad', 'data-nav': true }, h('b', {}, b.title), b.where ? h('span', { class: 'quiet' }, b.where) : null))), 'Keine offenen Blocker.'),
    group('Offene Entscheidungen', 'question', dc.map((d) => h('li', {}, h('a', { href: noteHref(d), class: 'line ask', 'data-nav': true }, h('b', {}, d.question || d.title), h('span', { class: 'quiet' }, d.title)))), 'Keine offenen Entscheidungen.'),
    group('Als Nächstes bauen', 'route', next.map((f) => h('li', { class: 'line', 'data-s': f.status },
      statusButton(f, `${f.title} (${f.area})`), h('a', { href: noteHref(f), class: 'ltitle', 'data-nav': true }, h('b', {}, f.title)), h('span', { class: 'quiet' }, `${f.area} · ${f.prio}`))), 'Alles Wichtige ist umgesetzt.'));
}
// The status marker is the control: click opens the five states.
function statusButton(f, what) {
  const b = h('button', { type: 'button', class: 'mk-btn', 'aria-haspopup': 'listbox', 'aria-label': `Status von ${what}: ${LABEL[f.status]}. Ändern`, onclick: () => {
    popover(b, STATUS.map(([k, l]) => [k, l, k]), f.status, (v) => pickStatus(f.path, f.status, v, f.evidence, (x) => { b.parentElement?.setAttribute('data-s', x); }), 'Status wählen');
  } }, h('span', { class: 'mk', 'aria-hidden': 'true' }));
  return b;
}
function pickStatus(path, prev, v, evidence, apply) {
  if (v === 'built' && !String(evidence || '').trim() && !confirm('Für "Gebaut" fehlt ein Nachweis. Trotzdem setzen?')) return;
  change(path, 'status', v, prev, apply);
}
function chips(options, current, onPick) {
  return h('div', { class: 'legend' }, options.map(([v, l]) => h('button', { type: 'button', class: `chip plainchip${current === v ? ' on' : ''}`, 'aria-pressed': String(current === v), onclick: () => onPick(v) }, l)));
}
function rowActions(...btns) { return h('span', { class: 'ract' }, btns); }
let findState = 'open';
function findingsTab(a, root, name) {
  const list = a.findings.filter((f) => !findState || f.state === findState).sort((x, y) => (SEV_RANK[x.severity] ?? 9) - (SEV_RANK[y.severity] ?? 9) || x.title.localeCompare(y.title));
  root.append(h('div', { class: 'bar' }, chips([['open', 'Offen'], ['', 'Alle']], findState, (v) => { findState = v; appView(name); })));
  root.append(list.length ? h('ul', { class: 'items' }, list.map((f) => {
    const sev = h('button', { type: 'button', class: 'sev', 'aria-haspopup': 'listbox', 'aria-label': `Schwere ${f.severity}. Ändern`, onclick: () => popover(sev, SEVERITIES.map((v) => [v, v]), f.severity, (v) => change(f.path, 'severity', v, f.severity), 'Schwere wählen') }, f.severity);
    return h('li', { class: `item sev-${f.severity}` }, sev,
      h('a', { class: 'ltitle', href: noteHref(f), 'data-nav': true }, h('b', {}, f.title), f.where ? h('span', { class: 'quiet' }, f.where) : null),
      f.state !== 'open' ? h('span', { class: 'quiet' }, (FSTATES.find(([v]) => v === f.state) || [0, f.state])[1]) : null,
      rowActions(f.state === 'open' ? iconBtn('check', 'Als behoben markieren', () => change(f.path, 'state', 'fixed', 'open')) : iconBtn('undo', 'Wieder öffnen', () => change(f.path, 'state', 'open', f.state))));
  })) : h('p', { class: 'quiet' }, 'Keine Befunde in dieser Ansicht.'));
  root.append(quickAdd('Neuer Befund', name, '/api/finding', 'Neuer Befund: Was ist das Problem? Enter', [
    ['severity', 'Schwere', segmented(SEVERITIES.map((v) => [v, v]), 'Gap', null, 'Schwere')],
    ['where', 'Wo', h('input', { maxlength: 300, placeholder: 'Datei oder Route' })],
  ]));
}
let decState = 'open';
function decisionsTab(a, root, name) {
  const list = a.decisions.filter((d) => !decState || d.state === decState).sort((x, y) => x.title.localeCompare(y.title));
  root.append(h('div', { class: 'bar' }, chips([['open', 'Offen'], ['decided', 'Entschieden'], ['', 'Alle']], decState, (v) => { decState = v; appView(name); })));
  root.append(list.length ? h('ul', { class: 'items' }, list.map((d) => h('li', { class: `item q ${d.state}` },
    h('a', { class: 'ltitle', href: noteHref(d), 'data-nav': true }, h('b', { class: 'big' }, d.question || d.title), d.state === 'decided' ? h('span', { class: 'answer' }, `→ ${d.answer || 'entschieden'}`) : null, h('span', { class: 'quiet' }, d.title)))))
    : h('p', { class: 'quiet' }, 'Keine Entscheidungen in dieser Ansicht.'));
  root.append(quickAdd('Neue Entscheidung', name, '/api/decision', 'Neue Entscheidung: Titel tippen, Enter', [
    ['question', 'Frage', h('input', { maxlength: 300, placeholder: 'Was muss entschieden werden?' })],
  ]));
}
// One line at the end of the list. Enter creates; "Mehr" opens the optional fields. fields: [key, label, el, alwaysVisible?]
function quickAdd(title, appName, endpoint, placeholder, fields, transform = (b) => b, extra = null) {
  const titleIn = h('input', { class: 'quick-in', required: true, maxlength: 80, placeholder, 'aria-label': title });
  const inputs = { title: titleIn }; const visible = []; const more = [];
  for (const [key, label, el, vis] of fields) { inputs[key] = el; const row = h('label', { class: 'fld' }, h('span', {}, label), el); (vis ? visible : more).push(row); }
  const morePanel = h('div', { class: 'fgrid quick-more', hidden: true }, more);
  const moreBtn = h('button', { type: 'button', class: 'plain', 'aria-expanded': 'false', onclick: () => { const open = morePanel.hasAttribute('hidden'); if (open) morePanel.removeAttribute('hidden'); else morePanel.setAttribute('hidden', ''); moreBtn.setAttribute('aria-expanded', String(open)); } }, 'Mehr');
  const form = h('form', { class: 'quick', 'aria-label': title }, icon('plus', 20), titleIn, ...visible, more.length ? moreBtn : null, h('button', { class: 'ibtn go', type: 'submit', 'aria-label': 'Anlegen', title: 'Anlegen (Enter)' }, icon('check', 18)), morePanel, extra);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const body = { app: appName }; for (const [k, el] of Object.entries(inputs)) body[k] = el.value;
      const r = await api(endpoint, { method: 'POST', body: JSON.stringify(transform(body)) });
      await load(); renderSide(); location.hash = noteHref({ path: r.path });
    } catch (err) { toast(err.message); }
  });
  return form;
}

/* ---------- note view (read first, edit tucked away) ---------- */
const MANAGED = ['flow', 'finding', 'decision'];
let editBody = false;
let manageOpen = false;
let lastNote = null;
const kv = (label, node) => h('div', { class: 'kv' }, h('span', { class: 'quiet' }, label), node);
function managePanel(path, note, appName) {
  const t = note.meta.type;
  if (!MANAGED.includes(t)) return null;
  const m = note.meta; const rows = [];
  const text = (key, label, val, ph = '', list = false) => rows.push(kv(label, inlineText({ value: list ? (val || []).join(', ') : val, placeholder: ph || 'Hinzufügen', label,
    onSave: (v) => change(path, key, list ? splitList(v) : v, val || (list ? [] : '')) })));
  const sw = (key, label, pairs, val) => rows.push(kv(label, segmented(pairs, val, (v) => change(path, key, v, val), label)));
  if (t === 'flow') {
    text('reason', 'Begründung', m.reason, 'Warum nicht nötig?'); text('screens', 'Screens', m.screens, '/login, /forgot', true);
    text('endpoints', 'Endpoints', m.endpoints, 'POST /api/…', true); text('evidence', 'Nachweis', m.evidence, 'Test, Gate oder Link');
  } else if (t === 'decision') {
    sw('state', 'Status', DSTATES, m.state); text('question', 'Frage', m.question, 'Was ist zu entscheiden?'); text('answer', 'Antwort', m.answer, 'Noch offen');
  } else {
    sw('state', 'Status', FSTATES, m.state); sw('severity', 'Schwere', SEVERITIES.map((v) => [v, v]), m.severity); text('where', 'Wo', m.where, 'Datei oder Route');
  }
  const arch = h('button', { type: 'button', class: 'plain danger', onclick: async () => {
    if (!confirm('Notiz archivieren? Sie verschwindet aus der Übersicht und liegt im Ordner _Archiv der App.')) return;
    try { await api('/api/note', { method: 'DELETE', body: JSON.stringify({ path }) }); await load(); renderSide(); toast('Archiviert'); location.hash = appName ? `#/app/${encodeURIComponent(appName)}` : '#/'; } catch (e) { toast(e.message); }
  } }, icon('archive', 18), 'Archivieren');
  const edit = h('button', { type: 'button', class: 'plain', onclick: () => { editBody = true; route(); } }, icon('pencil', 18), 'Text bearbeiten');
  const a = data.apps.find((x) => x.name === appName);
  const det = h('details', { class: 'manage glass', open: manageOpen }, a ? artBox(a, 'panel-art') : null, h('summary', {}, icon('pencil', 18), 'Bearbeiten'), h('div', { class: 'kvs' }, rows), h('div', { class: 'actions' }, edit, arch));
  det.addEventListener('toggle', () => { manageOpen = det.open; });
  return det;
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
const NODE_W = 180; const NODE_H = 72; const DEC = 80; const GAP_X = 84; const GAP_Y = 50; const PAD = 44;
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
    h('button', { type: 'button', 'aria-label': 'Verkleinern', title: 'Verkleinern (−)', onclick: () => zoomAt(0.85, (stage.clientWidth || 900) / 2, (stage.clientHeight || 480) / 2) }, icon('zoomOut', 22)),
    h('button', { type: 'button', 'aria-label': 'Vergrößern', title: 'Vergrößern (+)', onclick: () => zoomAt(1.18, (stage.clientWidth || 900) / 2, (stage.clientHeight || 480) / 2) }, icon('zoomIn', 22)),
    h('button', { type: 'button', 'aria-label': 'Einpassen', title: 'Einpassen (0)', onclick: fit }, icon('fit', 22)));
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
  const statusLabel = h('span', {}, LABEL[m.status] || m.status);
  const head = h('header', { class: 'fp-head', 'data-s': m.status });
  const sbtn = h('button', { type: 'button', class: 'mk-btn big', 'aria-haspopup': 'listbox', 'aria-label': `Status: ${LABEL[m.status] || m.status}. Ändern`, onclick: () => popover(sbtn, STATUS.map(([k, l]) => [k, l, k]), m.status, (v) => pickStatus(path, m.status, v, m.evidence, (x) => { head.setAttribute('data-s', x); statusLabel.textContent = LABEL[x] || x; }), 'Status wählen') }, h('span', { class: 'mk big', 'aria-hidden': 'true' }));
  const prioSw = segmented(PRIOS.map((v) => [v, v]), m.prio, (v) => change(path, 'prio', v, m.prio), 'Priorität');
  head.append(sbtn, h('div', {}, h('h1', {}, m.title || path.split('/').pop().replace(/\.md$/, '')),
    h('div', { class: 'flowmeta' }, statusLabel, m.area ? h('span', {}, `· ${m.area}`) : null, prioSw, m.reason ? h('span', {}, `· ${m.reason}`) : null)));
  const drawn = code ? parseFlow(code) : { nodes: [], edges: [] };
  const derived = !drawn.nodes.length ? sollChain(m.title || '', secs) : null;
  const canvas = flowCanvas(derived || drawn, () => { editBody = true; route(); });
  const tags = (label, list) => (list && list.length ? h('div', { class: 'fact' }, h('span', { class: 'quiet' }, label), h('span', { class: 'tags' }, list.map((x) => h('code', { class: 'tag' }, x)))) : null);
  const facts = [tags('Screens', m.screens), tags('Endpoints', m.endpoints), m.evidence ? h('div', { class: 'fact' }, h('span', { class: 'quiet' }, 'Nachweis'), h('span', {}, m.evidence)) : null].filter(Boolean);
  const mini = a && m.area ? h('div', { class: 'miniroute' }, makeLane(a, m.area, new Set(), path)) : null;
  return { head, canvas, derived: !!derived, facts: facts.length ? h('div', { class: 'facts' }, facts) : null, mini, rest, secs };
}
async function noteView(path) {
  if (lastNote !== path) { editBody = false; manageOpen = false; lastNote = path; }
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
  renderSide(); setBackdrop();
  const hash = location.hash.replace(/^#\/?/, '');
  try {
    if (hash.startsWith('app/')) appView(decodeURIComponent(hash.slice(4)));
    else if (hash.startsWith('note/')) await noteView(decodeURIComponent(hash.slice(5)));
    else homeView();
  } catch (e) { $view.replaceChildren(h('p', { class: 'quiet' }, e.message)); }
}
document.getElementById('search')?.addEventListener('click', openPalette);
document.getElementById('refresh').addEventListener('click', async () => { try { await load(); await route(); toast('Aktualisiert'); } catch (e) { toast(e.message); } });
window.addEventListener('hashchange', route);
load().then(route).catch((e) => $view.replaceChildren(h('p', { class: 'quiet' }, `Daten konnten nicht geladen werden: ${e.message}`)));
