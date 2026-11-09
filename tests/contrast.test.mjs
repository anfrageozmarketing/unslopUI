import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const S = join(dirname(fileURLToPath(import.meta.url)), '..', 'skills/unslop-human/scripts/contrast.mjs');
const run = (...a) => spawnSync('node', [S, ...a], { encoding: 'utf8' });
test('contrast script gives known ratios and exit codes', () => {
  const bw = run('#000000', '#ffffff'); assert.equal(bw.status, 0); assert.match(bw.stdout, /21\.00:1/);
  const grey = run('#777777', '#ffffff'); assert.equal(grey.status, 1); assert.match(grey.stdout, /4\.4\d:1/); assert.match(grey.stdout, /normal text \(4\.5\): FAIL/); assert.match(grey.stdout, /large text.*PASS/);
  assert.equal(run('#555555', '#000000').status, 1);
  assert.equal(run('nope', '#fff').status, 1);
  assert.equal(run('ffffff', '000000').status, 0, 'hex without #');
});
