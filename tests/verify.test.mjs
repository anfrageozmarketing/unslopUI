import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chrome = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
let hasPw = true; try { await import('playwright-core'); } catch { hasPw = false; }
const skip = !chrome || !hasPw;

test('verify finds a broken progress bar and passes a good page', { skip: skip && 'no chrome or playwright-core' }, async () => {
  const bad = '<!doctype html><html lang=en><body><div role=progressbar aria-valuenow=50 style="height:2px;width:200px;background:#ccc"><span style="display:block;width:0;height:2px"></span></div></body></html>';
  const good = '<!doctype html><html lang=en><body><main style="padding:24px"><h1>Hi</h1></main></body></html>';
  const srv = createServer((q, r) => { r.setHeader('content-type', 'text/html'); r.end(q.url === '/bad' ? bad : good); }).listen(0);
  const port = srv.address().port; const out = mkdtempSync(join(tmpdir(), 'ver-'));
  const run = async (route) => { try { await exec('node', ['skills/unslop-verify/scripts/verify.mjs', '--url', `http://127.0.0.1:${port}`, '--routes', route, '--out', join(out, route.slice(1)), '--widths', '360', '--themes', 'light'], { timeout: 90000 }); return 0; } catch (e) { return e.code; } };
  try {
    assert.equal(await run('/bad'), 1); assert.match(readFileSync(join(out, 'bad', 'REPORT.md'), 'utf8'), /progress-thin/);
    assert.equal(await run('/good'), 0);
  } finally { srv.close(); }
});
