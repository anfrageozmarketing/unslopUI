// Run: node --test tests/
// Starts the Command Center against a temporary copy of the demo vault and checks auth, API, write-back and path safety.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CC = join(ROOT, 'skills/unslop-brain/templates/command-center');
const PORT = 18000 + Math.floor(Math.random() * 1000);
const BASE = `http://127.0.0.1:${PORT}`;
const PW = 'correct-horse-battery';
const auth = 'Basic ' + Buffer.from(`anna:${PW}`).toString('base64');
const FLOW = 'Apps/Demo-App/Flows/Zugang/Login.md';
let tmp, child, userLine, pub;

const get = (p, headers = { authorization: auth }) => fetch(BASE + p, { headers });
const patch = (body, extra = {}) => fetch(BASE + '/api/note', {
  method: 'PATCH',
  headers: { authorization: auth, 'content-type': 'application/json', 'x-requested-with': 'command-center', ...extra },
  body: JSON.stringify(body),
});

before(async () => {
  tmp = mkdtempSync(join(tmpdir(), 'cc-'));
  cpSync(join(ROOT, 'examples/demo-vault'), join(tmp, 'vault'), { recursive: true });
  pub = join(tmp, 'public'); mkdirSync(join(pub, 'assets'), { recursive: true });
  writeFileSync(join(pub, 'index.html'), '<!doctype html><title>t</title><script type="module" src="./assets/app-abc.js"></script>');
  writeFileSync(join(pub, 'assets', 'app-abc.js'), 'console.log(1)'); writeFileSync(join(pub, 'assets', 'secret.map'), 'x');
  const h = spawnSync('node', [join(CC, 'hash-password.mjs'), 'anna'], { env: { ...process.env, CC_PASSWORD: PW }, encoding: 'utf8' });
  userLine = h.stdout.trim();
  child = spawn('node', [join(CC, 'server.mjs')], {
    env: { ...process.env, VAULT_DIR: join(tmp, 'vault'), PUBLIC_DIR: pub, CC_USERS: userLine, PORT: String(PORT), HOST: '127.0.0.1' },
    stdio: 'ignore',
  });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(BASE + '/healthz')).ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('server did not start');
});
after(() => child?.kill());

test('refuses to start without users', () => {
  const r = spawnSync('node', [join(CC, 'server.mjs')], { env: { ...process.env, CC_USERS: '', VAULT_DIR: tmp }, encoding: 'utf8', timeout: 5000 });
  assert.equal(r.status, 1);
});

test('hash-password rejects short passwords', () => {
  const r = spawnSync('node', [join(CC, 'hash-password.mjs'), 'bob'], { env: { ...process.env, CC_PASSWORD: 'short' }, encoding: 'utf8' });
  assert.equal(r.status, 1);
});

test('requires authentication', async () => {
  assert.equal((await get('/api/index', {})).status, 401);
  assert.equal((await get('/', {})).status, 401);
  assert.equal((await get('/api/index', { authorization: 'Basic ' + Buffer.from('anna:wrong').toString('base64') })).status, 401);
  assert.equal((await get('/healthz', {})).status, 200);
});

test('serves the built UI with strict headers; blocks traversal and unknown types', async () => {
  const idx = await get('/');
  assert.equal(idx.status, 200); assert.match(idx.headers.get('content-type'), /text\/html/); assert.equal(idx.headers.get('cache-control'), 'no-store');
  assert.match(idx.headers.get('content-security-policy'), /default-src 'none'; script-src 'self';/);
  assert.ok(!/jsdelivr|unpkg|cdn/.test(idx.headers.get('content-security-policy')), 'no CDN in CSP');
  assert.equal(idx.headers.get('x-content-type-options'), 'nosniff');
  const js = await get('/assets/app-abc.js');
  assert.equal(js.status, 200); assert.match(js.headers.get('content-type'), /javascript/); assert.match(js.headers.get('cache-control'), /immutable/);
  for (const p of ['/assets/secret.map', '/server.mjs', '/assets/../../server.mjs', '/%2e%2e/server.mjs', '/assets/nope.js', '/..%2fserver.mjs']) {
    const r = await get(p); assert.ok([400, 404].includes(r.status), `${p} -> ${r.status}`);
  }
  assert.equal((await get('/', {})).status, 401);
});

test('index summarizes the demo vault', async () => {
  const d = await (await get('/api/index')).json();
  assert.equal(d.apps.length, 1);
  const a = d.apps[0];
  assert.equal(a.name, 'Demo-App');
  assert.equal(a.score, 11);
  assert.equal(a.total, 7);
  assert.deepEqual(a.counts, { missing: 4, partial: 1, exists: 1, built: 1, na: 0 });
  assert.equal(a.findings.length, 2);
  assert.equal(a.decisions.length, 2);
});

test('reads a note and blocks path tricks', async () => {
  const ok = await (await get('/api/note?path=' + encodeURIComponent(FLOW))).json();
  assert.equal(ok.meta.type, 'flow');
  assert.match(ok.body, /mermaid/);
  for (const p of ['../../../etc/hosts', 'Apps/../../../etc/hosts.md', '/etc/hosts', 'nope.md', FLOW.replace('.md', '.txt')]) {
    assert.equal((await get('/api/note?path=' + encodeURIComponent(p))).status, 404, p);
  }
});

test('write-back: whitelist, enums, CSRF header', async () => {
  assert.equal((await patch({ path: FLOW, field: 'status', value: 'partial' }, { 'x-requested-with': '' })).status, 400);
  assert.equal((await patch({ path: FLOW, field: 'status', value: 'bogus' })).status, 400);
  assert.equal((await patch({ path: FLOW, field: 'app', value: 'x' })).status, 400);
  assert.equal((await patch({ path: '../../etc/hosts', field: 'status', value: 'built' })).status, 404);
  const before = readFileSync(join(tmp, 'vault', FLOW), 'utf8');
  const r = await patch({ path: FLOW, field: 'status', value: 'partial' });
  assert.equal(r.status, 200);
  const after = readFileSync(join(tmp, 'vault', FLOW), 'utf8');
  assert.match(after, /^status: partial$/m);
  assert.equal(after.replace(/^status: partial$/m, 'status: missing'), before, 'only the status line changed');
});

const post = (path, body, method = 'POST') => fetch(BASE + path, {
  method, headers: { authorization: auth, 'content-type': 'application/json', 'x-requested-with': 'command-center' }, body: JSON.stringify(body),
});
const readVault = (rel) => readFileSync(join(tmp, 'vault', rel), 'utf8');

test('create flow: validates input and refuses duplicates and path tricks', async () => {
  const ok = await post('/api/flow', { app: 'Demo-App', area: 'Zugang', title: 'Einladung annehmen', status: 'missing', prio: 'MVP', screens: ['/invite/:token'], endpoints: ['POST /api/invites'] });
  assert.equal(ok.status, 201);
  const { path } = await ok.json();
  assert.equal(path, 'Apps/Demo-App/Flows/Zugang/Einladung annehmen.md');
  const txt = readVault(path);
  assert.match(txt, /^type: flow$/m);
  assert.match(txt, /^screens: \[\/invite\/:token\]$/m);
  assert.equal((await post('/api/flow', { app: 'Demo-App', area: 'Zugang', title: 'Einladung annehmen' })).status, 409);
  assert.equal((await post('/api/flow', { app: 'Nope', area: 'Zugang', title: 'X' })).status, 404);
  assert.equal((await post('/api/flow', { app: 'Demo-App', area: 'Zugang', title: '' })).status, 400);
  assert.equal((await post('/api/flow', { app: 'Demo-App', area: 'Zugang', title: 'X', status: 'bogus' })).status, 400);
  assert.equal((await post('/api/flow', { app: 'Demo-App', area: 'Zugang', title: 'X', screens: ['a,b'] })).status, 400);
  // traversal attempts are neutralised into a harmless name inside the app's Flows folder
  const t = await post('/api/flow', { app: 'Demo-App', area: '../../..', title: '../../etc/evil' });
  if (t.status === 201) assert.match((await t.json()).path, /^Apps\/Demo-App\/Flows\/[^/]+\/[^/]+\.md$/);
  else assert.equal(t.status, 400);
  const idx = await (await get('/api/index')).json();
  assert.ok(idx.apps[0].flows.some((f) => f.title === 'Einladung annehmen'));
});

test('edit flow fields: lists, text, enum; touches updated', async () => {
  const P = 'Apps/Demo-App/Flows/Zugang/Einladung annehmen.md';
  assert.equal((await post('/api/note', { path: P, field: 'endpoints', value: ['POST /api/a', 'GET /api/b'] }, 'PATCH')).status, 200);
  assert.match(readVault(P), /^endpoints: \[POST \/api\/a, GET \/api\/b\]$/m);
  assert.equal((await post('/api/note', { path: P, field: 'evidence', value: 'Test e2e_invite grün' }, 'PATCH')).status, 200);
  assert.match(readVault(P), /^evidence: "Test e2e_invite grün"$/m);
  assert.equal((await post('/api/note', { path: P, field: 'evidence', value: 'mit "Quote"' }, 'PATCH')).status, 400);
  assert.equal((await post('/api/note', { path: P, field: 'screens', value: 'nicht-liste' }, 'PATCH')).status, 400);
  assert.equal((await post('/api/note', { path: P, field: 'title', value: 'Einladung annehmen und beitreten' }, 'PATCH')).status, 200);
  assert.match(readVault(P), /^title: "Einladung annehmen und beitreten"$/m);
  assert.equal((await post('/api/note', { path: P, field: 'nonsense', value: 'x' }, 'PATCH')).status, 400);
  assert.match(readVault(P), new RegExp(`^updated: ${new Date().toISOString().slice(0, 10)}$`, 'm'));
  // a block list in the old file is replaced cleanly
  const D = 'Apps/Demo-App/Entscheidungen/Single- oder Multi-Tenant.md';
  assert.equal((await post('/api/note', { path: D, field: 'answer', value: 'Nur das eigene Team' }, 'PATCH')).status, 200);
  assert.match(readVault(D), /^answer: "Nur das eigene Team"$/m);
});

test('edit body keeps frontmatter; rejects oversize and non-managed notes', async () => {
  const P = 'Apps/Demo-App/Flows/Zugang/Einladung annehmen.md';
  const head = readVault(P).split('\n---\n')[0];
  assert.equal((await post('/api/note', { path: P, body: '# Neu\n\nText' }, 'PUT')).status, 200);
  const after = readVault(P);
  assert.ok(after.startsWith(head.replace(/^updated: .*$/m, '').slice(0, 20)));
  assert.match(after, /# Neu\n\nText\n$/);
  assert.match(after, /^status: missing$/m);
  assert.equal((await post('/api/note', { path: P, body: 'x'.repeat(70000) }, 'PUT')).status, 400);
  assert.equal((await post('/api/note', { path: 'Apps/Demo-App/_App.md', body: 'x' }, 'PUT')).status, 400);
});

test('archive moves the note out of the index and never deletes', async () => {
  const P = 'Apps/Demo-App/Flows/Zugang/Einladung annehmen.md';
  assert.equal((await post('/api/note', { path: P }, 'DELETE')).status, 200);
  const idx = await (await get('/api/index')).json();
  assert.ok(!idx.apps[0].flows.some((f) => f.title === 'Einladung annehmen'));
  assert.equal((await get('/api/note?path=' + encodeURIComponent(P))).status, 404);
  const archived = readdirSync(join(tmp, 'vault', 'Apps/Demo-App/_Archiv'));
  assert.equal(archived.length, 1);
  assert.match(archived[0], /Einladung annehmen\.md$/);
  assert.equal((await post('/api/note', { path: 'Apps/Demo-App/_App.md' }, 'DELETE')).status, 400);
});

test('create finding and decision; edit their text fields; validate', async () => {
  const f = await post('/api/finding', { app: 'Demo-App', title: 'Neuer Befund', severity: 'Blocker', where: 'server.js' });
  assert.equal(f.status, 201);
  const fp = (await f.json()).path;
  assert.equal(fp, 'Apps/Demo-App/Findings/Neuer Befund.md');
  assert.match(readVault(fp), /^severity: Blocker$/m);
  assert.match(readVault(fp), /^where: "server.js"$/m);
  assert.equal((await post('/api/finding', { app: 'Demo-App', title: 'Neuer Befund' })).status, 409);
  assert.equal((await post('/api/finding', { app: 'Demo-App', title: 'X', severity: 'Huge' })).status, 400);
  assert.equal((await post('/api/finding', { app: 'Demo-App', title: '' })).status, 400);
  assert.equal((await post('/api/note', { path: fp, field: 'where', value: 'lib/db.js' }, 'PATCH')).status, 200);
  assert.match(readVault(fp), /^where: "lib\/db.js"$/m);
  const d = await post('/api/decision', { app: 'Demo-App', title: 'Neue Entscheidung', question: 'Was nun?' });
  assert.equal(d.status, 201);
  const dp = (await d.json()).path;
  assert.equal(dp, 'Apps/Demo-App/Entscheidungen/Neue Entscheidung.md');
  assert.equal((await post('/api/note', { path: dp, field: 'question', value: 'Anders?' }, 'PATCH')).status, 200);
  assert.equal((await post('/api/note', { path: dp, field: 'state', value: 'decided' }, 'PATCH')).status, 200);
  const idx = await (await get('/api/index')).json();
  const app = idx.apps[0];
  assert.ok(app.findings.some((x) => x.title === 'Neuer Befund' && x.severity === 'Blocker' && x.where === 'lib/db.js'));
  assert.ok(app.decisions.some((x) => x.title === 'Neue Entscheidung' && x.state === 'decided' && x.question === 'Anders?'));
  assert.equal((await post('/api/decision', { app: 'Nope', title: 'X' })).status, 404);
});

test('"na" (not needed) with reason is not a gap; overview file is generated for AI readers', async () => {
  const P = 'Apps/Demo-App/Flows/Einstellungen/Mail-Absender.md';
  assert.equal((await post('/api/note', { path: P, field: 'status', value: 'na' }, 'PATCH')).status, 200);
  assert.equal((await post('/api/note', { path: P, field: 'reason', value: 'Absender steht fest im Betrieb' }, 'PATCH')).status, 200);
  const a = (await (await get('/api/index')).json()).apps[0];
  assert.equal(a.counts.na, 1);
  assert.equal(a.total, 7);
  const c = a.counts;
  assert.equal(a.coverage, (c.exists + c.built + 0.5 * c.partial) / (a.total - c.na), 'na is excluded from the coverage denominator');
  const ov = 'Apps/Demo-App/_Overview.md';
  let txt = '';
  for (let i = 0; i < 30 && !txt.includes('Nicht nötig (Absender steht fest im Betrieb)'); i++) {
    await new Promise((r) => setTimeout(r, 100));
    try { txt = readVault(ov); } catch { /* not written yet */ }
  }
  assert.match(txt, /^type: overview$/m);
  assert.match(txt, /Nicht nötig \(Absender steht fest im Betrieb\)/);
  assert.match(txt, /### Zugang/);
  assert.match(txt, /Offene Blocker \(\d+\)/);
  // the overview is not editable through the API
  assert.equal((await post('/api/note', { path: ov, field: 'status', value: 'built' }, 'PATCH')).status, 400);
});

test('archive returns a restore token and the note comes back', async () => {
  const c = await post('/api/flow', { app: 'Demo-App', area: 'System', title: 'Zz Restore Test' });
  const { path } = await c.json();
  const a = await post('/api/note', { path }, 'DELETE'); const ab = await a.json();
  assert.equal(a.status, 200); assert.match(ab.restore.from, /^Apps\/Demo-App\/_Archiv\/.+Zz Restore Test\.md$/); assert.equal(ab.restore.to, path);
  assert.equal((await get('/api/note?path=' + encodeURIComponent(path))).status, 404);
  assert.equal((await post('/api/restore', { from: ab.restore.from, to: 'Apps/Other/Flows/System/x.md' })).status, 400, 'other app');
  assert.equal((await post('/api/restore', { from: ab.restore.from, to: 'Apps/Demo-App/_Archiv/x.md' })).status, 400, 'back into archive');
  assert.equal((await post('/api/restore', { from: 'Apps/Demo-App/_Archiv/../../../etc/hosts.md', to: path })).status, 400, 'traversal');
  assert.equal((await post('/api/restore', { from: 'Apps/Demo-App/_Archiv/nope.md', to: path })).status, 404);
  assert.equal((await post('/api/restore', ab.restore)).status, 200);
  assert.equal((await get('/api/note?path=' + encodeURIComponent(path))).status, 200);
  assert.equal((await post('/api/restore', ab.restore)).status, 404, 'already restored');
  await post('/api/note', { path }, 'DELETE'); // leave the demo vault tidy for later tests
});

test('state-changing calls need the header and JSON', async () => {
  const bad = await fetch(BASE + '/api/flow', { method: 'POST', headers: { authorization: auth, 'content-type': 'text/plain' }, body: '{}' });
  assert.equal(bad.status, 400);
});

test('locks out after repeated failures', async () => {
  const bad = { authorization: 'Basic ' + Buffer.from('anna:nope').toString('base64') };
  let last;
  for (let i = 0; i < 10; i++) last = (await get('/api/index', bad)).status;
  assert.equal(last, 429);
});
