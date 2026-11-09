// Smoke test for the Command Center UI logic with a minimal fake DOM (no browser needed).
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, '..', 'skills/unslop-brain/templates/command-center/public/app.js');

test('UI renders home, app tabs, create forms and the flow page', () => {
  const r = spawnSync('node', [join(HERE, 'ui-smoke-runner.mjs'), APP, join(HERE, '..', 'examples/demo-vault')], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
});
