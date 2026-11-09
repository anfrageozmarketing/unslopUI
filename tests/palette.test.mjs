// Palette generator: valid output, independent contrast re-check, determinism, bad input.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'skills/unslop-foundation/scripts/palette.mjs');
const run = (args) => spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' });
// independent WCAG implementation, not imported from the script
const chan = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * chan((n >> 16) & 255) + 0.7152 * chan((n >> 8) & 255) + 0.0722 * chan(n & 255); };
const ratio = (a, b) => { const x = lum(a); const y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

for (const [seed, mood] of [['#1f5c4d', 'calm'], ['#ff6a3d', 'bold'], ['#6d28d9', 'cool'], ['#facc15', 'warm'], ['#0a0a0a', 'calm'], ['#ffffff', 'calm']]) {
  test(`palette for ${seed} (${mood}) writes all files and passes contrast independently`, () => {
    const out = mkdtempSync(join(tmpdir(), 'pal-'));
    const r = run(['--seed', seed, '--mood', mood, '--out', out]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    for (const f of ['tokens.css', 'palette.json', 'PALETTE.md', 'DESIGN.md', 'preview.html']) assert.ok(existsSync(join(out, f)), f);
    const p = JSON.parse(readFileSync(join(out, 'palette.json'), 'utf8'));
    for (const theme of ['light', 'dark']) {
      const t = p.themes[theme];
      assert.ok(ratio(t.ink, t.bg) >= 7, `${theme} ink`);
      assert.ok(ratio(t['ink-muted'], t.bg) >= 4.5, `${theme} muted`);
      assert.ok(ratio(t['accent-text'], t.bg) >= 4.5, `${theme} accent text`);
      assert.ok(ratio(t['on-accent'], t.accent) >= 4.5, `${theme} on-accent`);
      for (const k of ['ok', 'warn', 'bad', 'info']) { assert.ok(ratio(t[k], t.bg) >= 4.5, `${theme} ${k}`); assert.ok(ratio(t[k], t[`${k}-soft`]) >= 4.5, `${theme} ${k} soft`); }
      for (const v of Object.values(t)) assert.match(v, /^#[0-9a-f]{6}$/);
    }
    const css = readFileSync(join(out, 'tokens.css'), 'utf8');
    assert.match(css, /:root:not\(\[data-theme="light"\]\)/);
    assert.match(css, /:root\[data-theme="dark"\]/);
    assert.match(css, /prefers-reduced-motion/);
  });
}

test('deterministic output', () => {
  const a = mkdtempSync(join(tmpdir(), 'pal-')); const b = mkdtempSync(join(tmpdir(), 'pal-'));
  run(['--seed', '#1f5c4d', '--out', a]); run(['--seed', '#1f5c4d', '--out', b]);
  assert.equal(readFileSync(join(a, 'tokens.css'), 'utf8'), readFileSync(join(b, 'tokens.css'), 'utf8'));
});

test('different seeds give different palettes', () => {
  const a = mkdtempSync(join(tmpdir(), 'pal-')); const b = mkdtempSync(join(tmpdir(), 'pal-'));
  run(['--seed', '#1f5c4d', '--out', a]); run(['--seed', '#ff6a3d', '--out', b]);
  assert.notEqual(readFileSync(join(a, 'tokens.css'), 'utf8'), readFileSync(join(b, 'tokens.css'), 'utf8'));
});

test('rejects bad seed and bad mood', () => {
  assert.equal(run(['--seed', 'nope']).status, 1);
  assert.equal(run([]).status, 1);
  assert.equal(run(['--seed', '#1f5c4d', '--mood', 'loud']).status, 1);
});

test('DESIGN.md is the agent contract: frontmatter, every role token with both modes, fixed sections', () => {
  const out = mkdtempSync(join(tmpdir(), 'pal-'));
  assert.equal(run(['--seed', '#1f5c4d', '--name', 'Command Center', '--out', out]).status, 0);
  const md = readFileSync(join(out, 'DESIGN.md'), 'utf8');
  const p = JSON.parse(readFileSync(join(out, 'palette.json'), 'utf8'));
  assert.match(md, /^---\nname: Command Center design contract\nseed: "#1f5c4d"/);
  for (const k of Object.keys(p.themes.light)) {
    assert.ok(md.includes(`\`--${k}\``), `role --${k}`);
    assert.ok(md.includes(p.themes.light[k]) && md.includes(p.themes.dark[k]), `values for --${k}`);
  }
  for (const h of ['## Setup', '## Design direction', '## Colors', '## Typography', '## Layout and spacing', '## Shapes', '## Elevation and glass', '## Motion', '## Components', '## Do', "## Don't", '## Source of truth']) assert.ok(md.includes(h), h);
  assert.ok(!/serif[^-]/.test(md.replace(/Sans-serif|sans-serif|no serif|add serif fonts/gi, '')), 'no serif recommendation');
});
