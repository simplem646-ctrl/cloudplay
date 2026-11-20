import test from 'node:test';
import assert from 'node:assert/strict';
import { measureText, wrapText, tokenize, stripMarkup, visibleLength, charAdvance, hasGlyph, LINE_H } from '../../src/ui/font.js';

test('glyph metrics are proportional and markup is ignored', () => {
  assert.equal(charAdvance(' '), 4);
  assert.ok(charAdvance('i') < charAdvance('W'));
  assert.equal(measureText('iiii'), 15);
  assert.equal(measureText('{y}Gold{/}'), measureText('Gold'));
  assert.equal(visibleLength('a{r}bc{/}d'), 4);
  assert.equal(stripMarkup('x{#ff0000}y{/}z'), 'xyz');
  assert.ok(hasGlyph('♥') && hasGlyph('▼') && !hasGlyph('é'));
});

test('tokenize splits colour tags and newlines', () => {
  const t = tokenize('a{y}b\nc{/}');
  assert.deepEqual(t.map((x) => x.t), ['text', 'color', 'text', 'nl', 'text', 'color']);
  assert.equal(t[1].c, '#f2b84b');
  assert.equal(t[5].c, null);
});

test('wrapText wraps by pixel width and never exceeds it', () => {
  const lines = wrapText('The quick brown fox jumps over the lazy dog again and again and again.', 100);
  assert.ok(lines.length >= 3);
  for (const l of lines) assert.ok(measureText(l) <= 100, `"${l}" is ${measureText(l)}px`);
  assert.equal(stripMarkup(lines.join(' ')).replace(/\s+/g, ' '), 'The quick brown fox jumps over the lazy dog again and again and again.');
});

test('wrapText carries colour across breaks, honours newlines, splits long words', () => {
  const lines = wrapText('aaa {y}bbb ccc ddd eee fff ggg hhh{/} iii', 40);
  assert.ok(lines.slice(1).some((l) => l.startsWith('{#f2b84b}')), 'colour re-opened on a later line');
  assert.deepEqual(wrapText('one\ntwo', 200), ['one', 'two']);
  const long = wrapText('Supercalifragilisticexpialidocious', 50);
  assert.ok(long.length > 1);
  for (const l of long) assert.ok(measureText(l) <= 50);
  assert.deepEqual(wrapText('', 100), ['']);
  assert.equal(LINE_H, 10);
});
