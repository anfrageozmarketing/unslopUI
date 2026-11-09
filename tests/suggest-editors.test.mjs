import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { suggest, toMd } from '../skills/unslop-build/scripts/suggest-editors.mjs';

test('workflow schema suggests a node editor, tasks suggest a board', () => {
  const d = mkdtempSync(join(tmpdir(), 'se-'));
  writeFileSync(join(d, 'models.py'), [
    'class Other:', '    note: str',
    'class Step:', '    next_step: str', '    condition: str', '    trigger: str', 'class Edge:', '    source_id: int', '    target_id: int', 'class Workflow:', '    steps: List', '    edges: List', '    nodes: List',
    'class Task:', '    status: str  # todo doing done', '    stage: str  # doing', 'kanban board columns status done',
  ].join('\n'));
  const r = suggest(d);
  const names = r.map((x) => x.name);
  assert.ok(names.includes('Node editor')); assert.ok(names.includes('Board'));
  assert.match(toMd(r), /Evidence/);
});
test('plain list data suggests nothing strong', () => {
  const d = mkdtempSync(join(tmpdir(), 'se-'));
  writeFileSync(join(d, 'a.js'), 'const user = { name, email };\nrender(user);');
  assert.deepEqual(suggest(d), []);
});
