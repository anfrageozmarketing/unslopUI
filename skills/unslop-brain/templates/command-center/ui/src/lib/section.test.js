import test from 'node:test';
import assert from 'node:assert/strict';
import { replaceSection } from './note.js';

const body = '```mermaid\nflowchart TD\n  A[Start] --> B[Ende]\n```\n\nIntro Text\n\n## Soll\n\n- eins\n\n## Lücken\n\n- offen\n';
test('replaces one section and keeps the others', () => {
  const r = replaceSection(body, 'Soll', '- neu');
  assert.match(r, /## Soll\n\n- neu\n/); assert.match(r, /- offen/); assert.doesNotMatch(r, /- eins/);
});
test('replacing the intro keeps the diagram and the headings', () => {
  const r = replaceSection(body, null, 'Anderer Text');
  assert.match(r, /```mermaid[\s\S]*```/); assert.match(r, /Anderer Text/); assert.doesNotMatch(r, /Intro Text/); assert.match(r, /## Lücken/);
});
test('unknown heading leaves the body unchanged', () => { assert.equal(replaceSection(body, 'Gibt es nicht', 'x'), body); });
