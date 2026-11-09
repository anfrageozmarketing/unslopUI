import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { audit, toMd, ELEMENTS } from '../skills/unslop-build/scripts/audit-elements.mjs';

test('finds used and missing elements', () => {
  const d = mkdtempSync(join(tmpdir(), 'ae-'));
  writeFileSync(join(d, 'App.jsx'), `import { Button, Modal, Tabs } from '@heroui/react';\nexport const A = () => <Tabs><Button>OK</Button><Modal/><input type="search"/></Tabs>;`);
  const r = audit(d);
  for (const k of ['Button', 'Dialog', 'Tab', 'Search bar']) assert.ok(r.used[k], k);
  assert.ok(r.missing.includes('Skeleton')); assert.ok(r.missing.includes('Switch'));
  assert.equal(r.states['loading states'], false);
  assert.match(toMd(r), /## Not found/);
});
test('covers the classic catalog', () => { assert.ok(Object.keys(ELEMENTS).length >= 55); });
