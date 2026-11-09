// Command Center - dependency-free server (Node 20+).
// Reads an Obsidian-style vault (markdown + YAML frontmatter) and serves a private overview UI.
// Fails closed: refuses to start without users. Writes only whitelisted frontmatter fields.
import http from 'node:http';
import crypto from 'node:crypto';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, resolve, relative, sep } from 'node:path';
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
  flow: ['status', 'prio'],
  finding: ['state', 'severity'],
  decision: ['state'],
};
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
    const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
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
  if (i < 0) return null;
  lines[i] = `${field}: ${value}`;
  return m[1] + lines.join('\n') + m[3] + text.slice(m[0].length);
}

/* ---------- vault scan ---------- */
async function walk(dir, out = []) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) await walk(p, out);
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
    if (req.method === 'PATCH' && url.pathname === '/api/note') {
      if (req.headers['x-requested-with'] !== 'command-center' || !String(req.headers['content-type'] || '').startsWith('application/json'))
        return send(res, 400, { error: 'bad request' });
      let data;
      try { data = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'bad json' }); }
      const abs = await resolveNote(data.path);
      if (!abs) return send(res, 404, { error: 'not found' });
      const text = await readFile(abs, 'utf8');
      const type = parseNote(text).meta.type;
      const allowed = WRITABLE[type] || [];
      const field = data.field;
      if (!allowed.includes(field)) return send(res, 400, { error: 'field not writable' });
      const values = field === 'state' ? STATE_VALUES[type] : ENUMS[field];
      if (!values.includes(data.value)) return send(res, 400, { error: 'invalid value' });
      const out = setField(text, field, data.value);
      if (out === null) return send(res, 409, { error: `field "${field}" missing in note` });
      await writeFile(abs, out, 'utf8');
      return send(res, 200, { ok: true });
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
