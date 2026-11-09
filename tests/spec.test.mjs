import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSpec, toCss, toMd } from '../skills/unslop-build/scripts/spec.mjs';

test('line heights are multiples of the base', () => {
  for (const base of [4, 8]) for (const t of buildSpec({ base }).type) assert.equal(t.lh % base, 0, `${t.name} ${t.lh}`);
});
test('type scale grows and base is 16', () => {
  const t = buildSpec().type; assert.equal(t.find((x) => x.name === 'base').px, 16);
  for (let i = 1; i < t.length; i++) assert.ok(t[i].px > t[i - 1].px);
});
test('comfortable controls meet the tap target', () => { assert.ok(buildSpec().control.lg >= 44); });
test('rejects bad input', () => {
  assert.throws(() => buildSpec({ base: 5 })); assert.throws(() => buildSpec({ ratio: 2 })); assert.throws(() => buildSpec({ density: 'x' }));
});
test('css maps HeroUI without borders and md has no hex', () => {
  const css = toCss(buildSpec()); assert.match(css, /--border-width: 0px/); assert.match(css, /@theme/); assert.doesNotMatch(css, /#[0-9a-f]{3,6}\b/i);
  assert.match(toMd(buildSpec()), /Type scale/);
});
