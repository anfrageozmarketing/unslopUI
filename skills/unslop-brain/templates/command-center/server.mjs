// Command Center - dependency-free server (Node 20+).
// Reads an Obsidian-style vault (markdown + YAML frontmatter) and serves a private overview UI.
// Fails closed: refuses to start without users. Writes only whitelisted frontmatter fields.
import http from 'node:http';
import crypto from 'node:crypto';
import { readFile, writeFile, readdir, mkdir, rename } from 'node:fs/promises';
import { join, resolve, relative, sep, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const VAULT = resolve(process.env.VAULT_DIR || join(HERE, 'vault'));
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '127.0.0.1';
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const MAX_NOTE_BYTES = 512 * 1024;

const ENUMS = {
  status: ['missing', 'partial', 'exists', 'built'],
  prio: ['MVP', 'V1', 'V2'],
  state: ['open', 'fixed', 'wontfix', 'decided'],
  severity: ['Blocker', 'Gap', 'Rough', 'Polish'],
};
const WRITABLE = {
  flow: ['status', 'prio', 'screens', 'endpoints', 'evidence'],
  finding: ['state', 'severity', 'where'],
  decision: ['state', 'answer', 'question'],
};
const FIELD_KIND = { screens: 'list', endpoints: 'list', evidence: 'text', answer: 'text', question: 'text', where: 'text' };
const MANAGED = ['flow', 'finding', 'decision'];
const MAX_BODY = 64 * 1024;
const STATE_VALUES = { finding: ['open', 'fixed', 'wontfix'], decision: ['open', 'decided'] };

/* ---------- users ---------- */
function parseUsers(raw) {
  const users = new Map();
  for (const part of raw.split(',').map((s) => s.trim()).filter(Boolean)) {
    const eq = part.indexOf('=');
    if (eq < 1) continue;
    const [salt, hash] = part.slice(eq + 1).split('.');
    if (!salt || !hash) continue;
    users.set(part.slice(0, eq), { salt: Buffer.from(salt, 'hex'), hash: Buffer.from(hash, 'hex') });
  }
  return users;
}
const USERS = parseUsers(process.env.CC_USERS || '');
if (USERS.size === 0) {
  console.error('CC_USERS is empty. Create users with: node hash-password.mjs <name>. Refusing to start.');
  process.exit(1);
}

function checkLogin(name, password) {
  const u = USERS.get(name);
  const salt = u ? u.salt : Buffer.alloc(16);
  const expected = u ? u.hash : Buffer.alloc(32);
  const got = crypto.scryptSync(password, salt, 32);
  return crypto.timingSafeEqual(got, expected) && !!u;
}

const fails = new Map(); // ip -> [timestamps]
function tooManyFails(ip) {
  const now = Date.now();
  const list = (fails.get(ip) || []).filter((t) => now - t < 15 * 60_000);
  fails.set(ip, list);
  return list.length >= 8;
}
function noteFail(ip) { (fails.get(ip) || fails.set(ip, []).get(ip)).push(Date.now()); }

function clientIp(req) {
  if (TRUST_PROXY) {
    // Behind one trusted proxy the proxy appends the real client address, so the LAST entry is the one to trust.
    const xf = String(req.headers['x-forwarded-for'] || '').split(',').map((x) => x.trim()).filter(Boolean).pop();
    if (xf) return xf;
  }
  return req.socket.remoteAddress || 'unknown';
}

/* ---------- frontmatter ---------- */
function unquote(v) {
  v = v.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}
function scalar(v) {
  v = unquote(v);
  if (v === '') return '';
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}
export function parseNote(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  let key = null;
  for (const line of m[1].split(/\r?\n/)) {
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && key) { (Array.isArray(meta[key]) ? meta[key] : (meta[key] = [])).push(unquote(item[1])); continue; }
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    key = kv[1];
    const val = kv[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      meta[key] = val.slice(1, -1).split(',').map((s) => unquote(s)).filter((s) => s !== '');
    } else if (val === '') {
      meta[key] = '';
    } else {
      meta[key] = scalar(val);
    }
  }
  return { meta, body: m[2] };
}

export function setField(text, field, value) {
  const m = text.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/);
  if (!m) return null;
  const lines = m[2].split(/\r?\n/);
  const re = new RegExp(`^${field}:`);
  const i = lines.findIndex((l) => re.test(l));
  if (i < 0) lines.push(`${field}: ${value}`);
  else {
    let n = 1; // drop "- item" continuation lines of an old block list
    while (i + n < lines.length && /^\s+-\s/.test(lines[i + n])) n++;
    lines.splice(i, n, `${field}: ${value}`);
  }
  return m[1] + lines.join('\n') + m[3] + text.slice(m[0].length);
}

export function replaceBody(text, body) {
  const m = text.match(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/);
  if (!m) return null;
  return text.slice(0, m[0].length).replace(/(\r?\n)?$/, '\n') + body.replace(/\s+$/, '') + '\n';
}

const today = () => new Date().toISOString().slice(0, 10);
const touch = (text) => setField(text, 'updated', today()) ?? text;

// Values that go into frontmatter. Returns the text to write, or null when invalid.
export function fmtValue(kind, v) {
  if (kind === 'list') {
    if (!Array.isArray(v) || v.length > 30) return null;
    const items = v.map((x) => String(x).trim()).filter(Boolean);
    if (items.some((x) => x.length > 120 || /[\r\n,[\]"]/.test(x))) return null;
    return `[${items.join(', ')}]`;
  }
  if (kind === 'text') {
    if (typeof v !== 'string' || v.length > 300 || /[\r\n"]/.test(v)) return null;
    return v.trim() === '' ? '' : `"${v.trim()}"`;
  }
  return null;
}

export function safeName(s, max = 80) {
  return String(s ?? '').normalize('NFC').replace(/[\\/:*?"<>|#^[\]\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim().replace(/^\.+/, '').slice(0, max).trim();
}

/* ---------- vault scan ---------- */
async function walk(dir, out = []) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) { if (e.name !== '_Archiv') await walk(p, out); }
    else if (e.isFile() && e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

async function scan() {
  const files = await walk(VAULT);
  const notes = [];
  for (const f of files) {
    let text;
    try { text = await readFile(f, 'utf8'); } catch { continue; }
    if (text.length > MAX_NOTE_BYTES) continue;
    const { meta } = parseNote(text);
    const rel = relative(VAULT, f).split(sep).join('/');
    notes.push({ path: rel, meta, title: meta.title || rel.split('/').pop().replace(/\.md$/, '') });
  }
  const apps = new Map();
  for (const n of notes.filter((x) => x.meta.type === 'app')) {
    const name = String(n.meta.name || n.title);
    apps.set(name, { name, path: n.path, score: n.meta.score === '' ? null : (n.meta.score ?? null),
      stack: n.meta.stack || '', url: n.meta.url || '', updated: n.meta.updated || '',
      flows: [], findings: [], decisions: [] });
  }
  for (const n of notes) {
    const t = n.meta.type;
    if (!['flow', 'finding', 'decision'].includes(t)) continue;
    const an = String(n.meta.app || '');
    let app = apps.get(an);
    if (!app) { app = { name: an || '(ohne App)', path: null, score: null, stack: '', url: '', updated: '', flows: [], findings: [], decisions: [] }; apps.set(app.name, app); }
    const base = { path: n.path, title: n.title };
    if (t === 'flow') app.flows.push({ ...base, area: n.meta.area || 'Sonstiges', status: n.meta.status || 'missing',
      prio: n.meta.prio || 'V1', screens: n.meta.screens || [], endpoints: n.meta.endpoints || [], evidence: n.meta.evidence || '', updated: n.meta.updated || '' });
    if (t === 'finding') app.findings.push({ ...base, severity: n.meta.severity || 'Rough', state: n.meta.state || 'open', where: n.meta.where || '' });
    if (t === 'decision') app.decisions.push({ ...base, state: n.meta.state || 'open', question: n.meta.question || '', answer: n.meta.answer || '' });
  }
  const list = [...apps.values()].map((a) => {
    const counts = { missing: 0, partial: 0, exists: 0, built: 0 };
    for (const f of a.flows) if (f.status in counts) counts[f.status]++;
    const total = a.flows.length;
    const coverage = total ? (counts.exists + counts.built + 0.5 * counts.partial) / total : null;
    return { ...a, counts, total, coverage };
  }).sort((a, b) => a.name.localeCompare(b.name));
  return { apps: list, notes: notes.map((n) => n.path) };
}

/* ---------- http ---------- */
const CSP = "default-src 'none'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
function send(res, code, body, type = 'application/json; charset=utf-8', extra = {}) {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer', 'content-security-policy': CSP, ...extra });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
function unauthorized(res) { send(res, 401, 'Authentication required', 'text/plain; charset=utf-8', { 'www-authenticate': 'Basic realm="Command Center", charset="UTF-8"' }); }

function authenticate(req, res) {
  const ip = clientIp(req);
  if (tooManyFails(ip)) { send(res, 429, 'Too many attempts', 'text/plain; charset=utf-8', { 'retry-after': '900' }); return false; }
  const h = String(req.headers.authorization || '');
  if (!h.startsWith('Basic ')) { unauthorized(res); return false; }
  const raw = Buffer.from(h.slice(6), 'base64').toString('utf8');
  const i = raw.indexOf(':');
  if (i < 0 || !checkLogin(raw.slice(0, i), raw.slice(i + 1))) { noteFail(ip); unauthorized(res); return false; }
  return true;
}

async function readBody(req, limit = 4096) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > limit) throw new Error('too large'); chunks.push(c); }
  return Buffer.concat(chunks).toString('utf8');
}

async function resolveNote(path) {
  if (typeof path !== 'string' || !path.endsWith('.md')) return null;
  const { notes } = await scan();
  if (!notes.includes(path)) return null; // only files the scan found
  const abs = resolve(VAULT, path);
  if (!abs.startsWith(VAULT + sep)) return null;
  return abs;
}

const STATIC = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/healthz') return send(res, 200, 'ok', 'text/plain; charset=utf-8');
    if (!authenticate(req, res)) return;

    if (req.method === 'GET' && STATIC[url.pathname]) {
      const [file, type] = STATIC[url.pathname];
      return send(res, 200, await readFile(join(HERE, 'public', file)), type);
    }
    if (req.method === 'GET' && url.pathname === '/api/index') return send(res, 200, await scan());
    if (req.method === 'GET' && url.pathname === '/api/note') {
      const abs = await resolveNote(url.searchParams.get('path'));
      if (!abs) return send(res, 404, { error: 'not found' });
      const { meta, body } = parseNote(await readFile(abs, 'utf8'));
      return send(res, 200, { meta, body });
    }
    if (['PATCH', 'PUT', 'DELETE', 'POST'].includes(req.method) && url.pathname.startsWith('/api/')) {
      // state-changing: needs the custom header and a JSON body (blocks cross-site form posts)
      if (req.headers['x-requested-with'] !== 'command-center' || !String(req.headers['content-type'] || '').startsWith('application/json'))
        return send(res, 400, { error: 'bad request' });
      let data;
      try { data = JSON.parse(await readBody(req, MAX_BODY + 4096)); } catch { return send(res, 400, { error: 'bad json' }); }
      if (!data || typeof data !== 'object') return send(res, 400, { error: 'bad json' });
      const guard = async (fn) => {
        try { return await fn(); } catch (e) {
          if (e.code === 'EACCES' || e.code === 'EROFS') return send(res, 403, { error: 'vault is not writable for the app (chown -R 1000:1000 the vault)' });
          throw e;
        }
      };

      if (req.method === 'PATCH' && url.pathname === '/api/note') {
        const abs = await resolveNote(data.path);
        if (!abs) return send(res, 404, { error: 'not found' });
        const text = await readFile(abs, 'utf8');
        const type = parseNote(text).meta.type;
        const field = data.field;
        if (!(WRITABLE[type] || []).includes(field)) return send(res, 400, { error: 'field not writable' });
        let value;
        if (FIELD_KIND[field]) {
          value = fmtValue(FIELD_KIND[field], data.value);
          if (value === null) return send(res, 400, { error: 'invalid value' });
        } else {
          const values = field === 'state' ? STATE_VALUES[type] : ENUMS[field];
          if (!values.includes(data.value)) return send(res, 400, { error: 'invalid value' });
          value = data.value;
        }
        const out = setField(text, field, value);
        if (out === null) return send(res, 409, { error: 'note has no frontmatter' });
        return guard(async () => { await writeFile(abs, touch(out), 'utf8'); return send(res, 200, { ok: true }); });
      }

      if (req.method === 'PUT' && url.pathname === '/api/note') {
        const abs = await resolveNote(data.path);
        if (!abs) return send(res, 404, { error: 'not found' });
        if (typeof data.body !== 'string' || data.body.length > MAX_BODY) return send(res, 400, { error: 'invalid body' });
        const text = await readFile(abs, 'utf8');
        if (!MANAGED.includes(parseNote(text).meta.type)) return send(res, 400, { error: 'note type not editable' });
        const out = replaceBody(text, data.body);
        if (out === null) return send(res, 409, { error: 'note has no frontmatter' });
        return guard(async () => { await writeFile(abs, touch(out), 'utf8'); return send(res, 200, { ok: true }); });
      }

      if (req.method === 'DELETE' && url.pathname === '/api/note') { // archive, never delete
        const abs = await resolveNote(data.path);
        if (!abs) return send(res, 404, { error: 'not found' });
        const text = await readFile(abs, 'utf8');
        if (!MANAGED.includes(parseNote(text).meta.type)) return send(res, 400, { error: 'note type not archivable' });
        const parts = data.path.split('/');
        if (parts[0] !== 'Apps' || parts.length < 4) return send(res, 400, { error: 'unexpected location' });
        const dest = join(VAULT, parts[0], parts[1], '_Archiv', `${new Date().toISOString().replace(/[:.]/g, '-')}-${basename(abs)}`);
        return guard(async () => { await mkdir(join(dest, '..'), { recursive: true }); await rename(abs, dest); return send(res, 200, { ok: true }); });
      }

      if (req.method === 'POST' && (url.pathname === '/api/finding' || url.pathname === '/api/decision')) {
        const isFinding = url.pathname === '/api/finding';
        const { apps } = await scan();
        const app = apps.find((a) => a.name === data.app && a.path);
        if (!app) return send(res, 404, { error: 'app not found' });
        const title = safeName(data.title);
        if (!title) return send(res, 400, { error: 'title required' });
        let fm;
        if (isFinding) {
          const severity = data.severity ?? 'Gap';
          if (!ENUMS.severity.includes(severity)) return send(res, 400, { error: 'invalid value' });
          const where = fmtValue('text', data.where ?? '');
          if (where === null) return send(res, 400, { error: 'invalid value' });
          fm = `type: finding\napp: ${app.name}\nseverity: ${severity}\nstate: open\nwhere: ${where}\nupdated: ${today()}`;
        } else {
          const question = fmtValue('text', data.question ?? '');
          if (question === null) return send(res, 400, { error: 'invalid value' });
          fm = `type: decision\napp: ${app.name}\nstate: open\nquestion: ${question}\nanswer:\nupdated: ${today()}`;
        }
        const rel = `${app.path.split('/').slice(0, -1).join('/')}/${isFinding ? 'Findings' : 'Entscheidungen'}/${title}.md`;
        const abs = resolve(VAULT, rel);
        if (!abs.startsWith(VAULT + sep)) return send(res, 400, { error: 'invalid name' });
        const body = isFinding
          ? `# ${title}\n\n**Was:** \n**Warum es zählt:** \n**Kleinster Fix:** \n`
          : `# ${title}\n\n## Optionen\n\n| Option | Folge |\n|---|---|\n|  |  |\n\n## Empfehlung\n\n`;
        return guard(async () => {
          await mkdir(join(abs, '..'), { recursive: true });
          try { await writeFile(abs, `---\n${fm}\n---\n${body}`, { encoding: 'utf8', flag: 'wx' }); } catch (e) { if (e.code === 'EEXIST') return send(res, 409, { error: 'a note with this title already exists' }); throw e; }
          return send(res, 201, { ok: true, path: rel });
        });
      }

      if (req.method === 'POST' && url.pathname === '/api/flow') {
        const { apps } = await scan();
        const app = apps.find((a) => a.name === data.app && a.path);
        if (!app) return send(res, 404, { error: 'app not found' });
        const area = safeName(data.area); const title = safeName(data.title);
        if (!area || !title) return send(res, 400, { error: 'title and area required' });
        const status = data.status ?? 'missing'; const prio = data.prio ?? 'V1';
        if (!ENUMS.status.includes(status) || !ENUMS.prio.includes(prio)) return send(res, 400, { error: 'invalid value' });
        const screens = fmtValue('list', data.screens ?? []); const endpoints = fmtValue('list', data.endpoints ?? []);
        if (screens === null || endpoints === null) return send(res, 400, { error: 'invalid value' });
        const rel = `${app.path.split('/').slice(0, -1).join('/')}/Flows/${area}/${title}.md`;
        const abs = resolve(VAULT, rel);
        if (!abs.startsWith(VAULT + sep)) return send(res, 400, { error: 'invalid name' });
        const content = `---\ntype: flow\napp: ${app.name}\narea: ${area}\ntitle: "${title}"\nstatus: ${status}\nprio: ${prio}\nscreens: ${screens}\nendpoints: ${endpoints}\nevidence:\nupdated: ${today()}\n---\n# ${title}\n\n\`\`\`mermaid\nflowchart TD\n  A[Start] --> B[Ergebnis]\n\`\`\`\n\n## Soll\n\n- \n\n## Lücken\n\n- \n`;
        return guard(async () => {
          await mkdir(join(abs, '..'), { recursive: true });
          try { await writeFile(abs, content, { encoding: 'utf8', flag: 'wx' }); } catch (e) { if (e.code === 'EEXIST') return send(res, 409, { error: 'a flow with this title already exists in this area' }); throw e; }
          return send(res, 201, { ok: true, path: rel });
        });
      }
    }
    return send(res, 404, { error: 'not found' });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: 'internal error' });
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, HOST, () => console.log(`Command Center on http://${HOST}:${PORT} - vault ${VAULT}`));
}
