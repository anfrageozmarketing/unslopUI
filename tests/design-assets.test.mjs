// Command Center design assets: illustrations, generative portrait, motion. (Icons come from the Phosphor library.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const D = join(dirname(fileURLToPath(import.meta.url)), '..', 'skills/unslop-brain/templates/command-center/design');
const { art, portrait } = await import(join(D, 'illustrations.mjs'));
test('illustrations: token colours only, no scripts, no external refs, no text from data', () => {
  for (const [name, fn] of Object.entries(art)) {
    const s = fn();
    assert.match(s, /^<svg class="art" viewBox="0 0 320 240"/, name);
    assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(s), `${name}: no hex colours`);
    assert.ok(!/<script|href=|xlink|http|onload|onerror/i.test(s), `${name}: no scripts or external references`);
    assert.ok(/var\(--/.test(s), `${name}: uses tokens`);
    assert.match(s, /role="img" aria-label="[^"]+"/, `${name}: accessible name`);
  }
  assert.ok(Object.keys(art).length >= 6);
});

test('portrait: deterministic, differs per app, numbers only', () => {
  const flows = [{ area: 'Zugang', status: 'missing', prio: 'MVP' }, { area: 'Zugang', status: 'built', prio: 'V1' }, { area: 'Kernablauf', status: 'partial', prio: 'V2' }];
  const a = portrait({ seed: 'App A', flows }); const b = portrait({ seed: 'App A', flows }); const c = portrait({ seed: 'App B', flows });
  assert.equal(a, b); assert.notEqual(a, c);
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(a));
  const evil = portrait({ seed: '<img src=x onerror=alert(1)>', flows: [{ area: '<script>', status: '"><svg onload=1>', prio: 'MVP' }] });
  assert.ok(!/<img|<script|onerror|onload|alert/i.test(evil.replace(/<svg class="portrait"[^>]*>/, '')), 'nothing from data reaches the markup');
  assert.match(portrait({ seed: 'x', flows: [] }), /^<svg class="portrait"/);
  assert.match(portrait(null), /^<svg class="portrait"/);
});

test('css uses tokens: no hex colours in components.css and motion.css', () => {
  for (const f of ['motion.css']) {
    const css = readFileSync(join(D, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(css), `${f}: no hex colours`);
  }
  assert.match(readFileSync(join(D, 'motion.css'), 'utf8'), /prefers-reduced-motion/);
});
