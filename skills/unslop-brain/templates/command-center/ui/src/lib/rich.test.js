import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlToMd } from './rich.js';

test('formatted text becomes markdown', () => {
  assert.equal(htmlToMd('<p>Hallo <strong>Welt</strong> und <em>mehr</em></p>'), 'Hallo **Welt** und *mehr*');
  assert.equal(htmlToMd('<ul><li>eins</li><li>zwei</li></ul>'), '-   eins\n-   zwei'.replace(/-   /g, '- '));
});
test('tables and links survive', () => {
  const md = htmlToMd('<table><thead><tr><th>Option</th><th>Folge</th></tr></thead><tbody><tr><td>Single</td><td>Einfach</td></tr></tbody></table>');
  assert.match(md, /\| Option \| Folge \|/); assert.match(md, /\| Single \| Einfach \|/);
  assert.equal(htmlToMd('<p><a href="https://x.de">x</a></p>'), '[x](https://x.de)');
});
test('empty input is empty', () => { assert.equal(htmlToMd(''), ''); assert.equal(htmlToMd('<p><br></p>'), ''); });
