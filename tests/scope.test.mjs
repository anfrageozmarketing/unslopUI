import test from 'node:test';
import assert from 'node:assert/strict';
import { scope, toMd, FEATURES } from '../skills/unslop-build/scripts/scope.mjs';

test('payments adds billing screens and subscription flows', () => {
  const s = scope({ kind: 'b2b', features: ['accounts', 'payments'] });
  assert.ok(s.screens.includes('Pricing')); assert.ok(s.flows.includes('Canceling subscription'));
});
test('always-needed states are present without features', () => {
  const s = scope({ kind: 'consumer', features: [] });
  for (const x of ['Empty state', 'Error', 'Loading']) assert.ok(s.screens.includes(x));
});
test('kind decides density and unknown features are reported', () => {
  assert.equal(scope({ kind: 'internal' }).design.density, 'compact');
  assert.deepEqual(scope({ features: ['teleport'] }).unknown, ['teleport']);
});
test('no duplicates and feature names are listed as skipped', () => {
  const s = scope({ features: ['accounts', 'accounts', 'teams'] });
  assert.equal(new Set(s.flows).size, s.flows.length);
  assert.ok(s.skipped.includes('payments')); assert.equal(s.skipped.length, Object.keys(FEATURES).length - 2);
  assert.match(toMd(s), /## Screens/);
});

test('account placement is asked when accounts exist and not given', () => {
  assert.ok(scope({ features: ['accounts'] }).questions.some((q) => /account area/i.test(q)));
  const s = scope({ features: ['accounts'], account: 'topbar', devices: ['desktop'] });
  assert.equal(s.questions.length, 0); assert.match(toMd(s), /Account area: topbar/);
});
