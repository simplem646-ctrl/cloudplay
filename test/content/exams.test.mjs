import test from 'node:test';
import assert from 'node:assert/strict';
import { SUBJECTS } from '../../src/core/constants.js';
import * as math from '../../src/content/exams/math.js';
import * as literature from '../../src/content/exams/literature.js';
import * as science from '../../src/content/exams/science.js';
import * as history from '../../src/content/exams/history.js';
import * as art from '../../src/content/exams/art.js';
import * as pe from '../../src/content/exams/pe.js';

const BANKS = { math, literature, science, history, art, pe };

test('there is one exam bank per subject', () => {
  assert.deepEqual(Object.keys(BANKS).sort(), [...SUBJECTS].sort());
});

for (const [subject, mod] of Object.entries(BANKS)) {
  test(`exam bank "${subject}" is well-formed`, () => {
    const bank = mod.default;
    assert.equal(bank.subject, subject);
    assert.ok(bank.questions.length >= 18);
    for (const tier of [1, 2, 3]) assert.ok(bank.questions.filter((q) => q.tier === tier).length >= 6, `tier ${tier}`);
    const seen = new Set();
    const positions = [0, 0, 0, 0];
    for (const q of bank.questions) {
      assert.ok(q.q.length <= 100 && q.q.length > 8, q.q);
      assert.equal(q.a.length, 4, q.q);
      assert.equal(new Set(q.a).size, 4, `duplicate options: ${q.q}`);
      assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4, q.q);
      for (const a of q.a) assert.ok(a.length > 0 && a.length <= 28, `option too long (${a.length}): "${a}"`);
      assert.ok([1, 2, 3].includes(q.tier));
      assert.ok(!seen.has(q.q), `duplicate question ${q.q}`);
      seen.add(q.q);
      positions[q.correct]++;
    }
    for (const p of positions) assert.ok(p >= 3, `correct answer positions are unbalanced: ${positions}`);
  });
}
