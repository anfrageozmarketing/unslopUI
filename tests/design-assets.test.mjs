// Command Center design assets: icon set, illustrations, motion, component sheet.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const D = join(dirname(fileURLToPath(import.meta.url)), '..', 'skills/unslop-brain/templates/command-center/design');
const require = createRequire(import.meta.url);
const { ICONS, icon } = require(join(D, 'icons.js'));
const { art, portrait } = require(join(D, 'illustrations.js'));
const PATH = /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s-]+$/;

test('icon set: complete, valid path data, one drawing language', () => {
  const required = ['key', 'flag', 'route', 'sliders', 'server', 'search', 'refresh', 'plus', 'edit', 'archive', 'undo', 'check', 'close', 'alert', 'question', 'bolt', 'zoom-in', 'zoom-out', 'fit', 'grid', 'link-out', 'chevron', 'command'];
  for (const n of required) assert.ok(ICONS[n], `icon ${n}`);
  for (const [n, d] of Object.entries(ICONS)) {
    assert.ok(d.l && d.f, `${n} has line and soft shape`);
    assert.match(d.l, PATH, `${n} line path chars`); assert.match(d.f, PATH, `${n} soft path chars`);
    assert.ok(/^M/.test(d.l) && /^M/.test(d.f), `${n} paths start with M`);
  }
  const svg = icon('key', { size: 32, label: 'Zugang "<x>"' });
  assert.match(svg, /^<svg class="ic" viewBox="0 0 24 24" width="32" height="32"/);
  assert.match(svg, /ic-soft/); assert.match(svg, /ic-line/);
  assert.ok(!svg.includes('<x>') && !svg.includes('"<'), 'label is escaped');
  assert.equal(icon('does-not-exist'), '');
  assert.match(icon('key'), /aria-hidden="true"/);
});

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

test('component sheet loads existing files and its script parses', () => {
  const html = readFileSync(join(D, 'components.html'), 'utf8');
  for (const m of html.matchAll(/(?:href|src)="([^"#]+\.(?:css|js))"/g)) assert.ok(existsSync(join(D, m[1])), m[1]);
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
  assert.doesNotThrow(() => new Function(script), 'inline script parses');
  for (const id of ['s-icons', 's-status', 's-buttons', 's-segment', 's-rows', 's-quick', 's-glass', 's-empty', 's-hero', 's-route', 's-loading']) assert.ok(html.includes(`id="${id}"`), id);
});

test('css uses tokens: no hex colours in components.css and motion.css', () => {
  for (const f of ['components.css', 'motion.css']) {
    const css = readFileSync(join(D, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(css), `${f}: no hex colours`);
  }
  assert.match(readFileSync(join(D, 'motion.css'), 'utf8'), /prefers-reduced-motion/);
});
