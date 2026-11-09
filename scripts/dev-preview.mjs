#!/usr/bin/env node
// Local UI preview of the Command Center with DEMO data only (never a real vault).
// Starts the app on a temp copy of examples/demo-vault plus a tiny proxy on 127.0.0.1 that adds the test login,
// so a browser tool (Playwright) can open  http://127.0.0.1:8091  without credentials in the URL.
// Usage: node scripts/dev-preview.mjs            (runs until stopped)
//        node scripts/dev-preview.mjs --selftest (starts, checks, exits 0/1)
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CC = join(ROOT, 'skills/unslop-brain/templates/command-center');
const PW = 'demo-preview-only-123';
const APP_PORT = Number(process.env.APP_PORT || 8090);
const PROXY_PORT = Number(process.env.PREVIEW_PORT || 8091);
const tmp = mkdtempSync(join(tmpdir(), 'cc-preview-'));
cpSync(join(ROOT, 'examples/demo-vault'), join(tmp, 'vault'), { recursive: true });
const user = spawnSync('node', [join(CC, 'hash-password.mjs'), 'demo'], { env: { ...process.env, CC_PASSWORD: PW }, encoding: 'utf8' }).stdout.trim();
const app = spawn('node', [join(CC, 'server.mjs')], { env: { ...process.env, VAULT_DIR: join(tmp, 'vault'), CC_USERS: user, PORT: String(APP_PORT), HOST: '127.0.0.1' }, stdio: 'ignore' });
const auth = 'Basic ' + Buffer.from(`demo:${PW}`).toString('base64');
const proxy = http.createServer((req, res) => {
  const up = http.request({ host: '127.0.0.1', port: APP_PORT, path: req.url, method: req.method, headers: { ...req.headers, authorization: auth } }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
  up.on('error', () => { res.writeHead(502); res.end('app not ready'); });
  req.pipe(up);
}).listen(PROXY_PORT, '127.0.0.1');
const stop = () => { app.kill(); proxy.close(); };
process.on('SIGINT', () => { stop(); process.exit(0); });
process.on('SIGTERM', () => { stop(); process.exit(0); });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${APP_PORT}/healthz`)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 100)); }
if (process.argv.includes('--selftest')) {
  const idx = await (await fetch(`http://127.0.0.1:${PROXY_PORT}/api/index`)).json();
  const ok = idx.apps?.[0]?.name === 'Demo-App';
  console.log(ok ? `selftest ok: ${idx.apps[0].name}, ${idx.apps[0].total} flows` : 'selftest FAILED');
  stop(); process.exit(ok ? 0 : 1);
}
console.log(`Command Center preview (demo data): http://127.0.0.1:${PROXY_PORT}   - Ctrl+C to stop`);
