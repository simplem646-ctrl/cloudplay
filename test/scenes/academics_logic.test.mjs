import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FLAVOUR, flavourPool, flavourLine, lateLine, pickQuizQuestion, layoutQuestion, optionItems, examTitle, progressLabel,
  gradeColor, GRADE_COLOR, teacherComment, TEACHER_COMMENT, hourOptions, timeTint, joinGains, proctorLine,
} from '../../src/scenes/academics/logic.js';
import { SUBJECTS } from '../../src/core/constants.js';
import { measureText } from '../../src/ui/font.js';
import { defaultBanks } from '../../src/sim/exams.js';
import { letterGrade } from '../../src/sim/academics.js';
import { resetRegistry, registerScene, listScenes } from '../../src/scenes/registry.js';
import { registerAcademicScenes } from '../../src/scenes/academics/index.js';

test('every subject has at least 6 flavour lines and year pools differ', () => {
  for (const s of SUBJECTS) {
    const all = new Set([1, 2, 3].flatMap((y) => flavourPool(s, y)));
    assert.ok(all.size >= 6, s);
    assert.notDeepEqual(flavourPool(s, 1), flavourPool(s, 3));
    assert.ok(FLAVOUR[s].all.length >= 1);
  }
});

test('flavour line is deterministic per day and period, and varies across days', () => {
  assert.equal(flavourLine('math', 2, 7, 10, 3), flavourLine('math', 2, 7, 10, 3));
  assert.ok(flavourPool('math', 2).includes(flavourLine('math', 2, 7, 10, 3)));
  const seen = new Set();
  for (let d = 0; d < 40; d++) seen.add(flavourLine('science', 1, 7, d, 1));
  assert.ok(seen.size >= 3);
  assert.equal(lateLine(1, 2, 3), lateLine(1, 2, 3));
});

test('pop quiz question follows the year tier and is stable', () => {
  const bank = defaultBanks().math;
  for (const year of [1, 2, 3]) {
    const q = pickQuizQuestion(bank, { seed: 5, absDay: 9, period: 2, year });
    assert.equal(q.tier, year);
    assert.equal(q.options.length, 4);
    assert.deepEqual(q, pickQuizQuestion(bank, { seed: 5, absDay: 9, period: 2, year }));
  }
  assert.equal(pickQuizQuestion([], { seed: 1, absDay: 1, period: 1, year: 1 }), null);
});

test('question wrapping respects the width and the line cap', () => {
  const long = 'The interior angles of a very large and rather complicated polygon add up to how many degrees in total please?';
  const lines = layoutQuestion(long, 120, 2);
  assert.equal(lines.length, 2);
  assert.ok(lines[1].endsWith('...'));
  for (const l of layoutQuestion(long, 120, 9)) assert.ok(measureText(l) <= 120);
});

test('option items grey out struck options, are lettered and fit the width', () => {
  const q = { options: ['90', '270', '180', 'a very very long option that will certainly not fit in the box at all, really'], struck: [1] };
  const items = optionItems(q, 100);
  assert.equal(items.length, 4);
  assert.deepEqual(items.map((i) => i.disabled), [false, true, false, false]);
  assert.ok(items[0].label.startsWith('A. '));
  assert.ok(items[1].label.startsWith('x B.'));
  for (const i of items) assert.ok(measureText(i.label) <= 100);
  assert.deepEqual(items.map((i) => i.index), [0, 1, 2, 3]);
});

test('titles and progress labels', () => {
  assert.equal(examTitle('Midterm Exams (Term 1)', 0, 'math'), 'Midterm Exams (Term 1) - Day 1 - Mathematics');
  assert.equal(progressLabel(2, 6), 'Question 3/6');
  assert.equal(progressLabel(9, 6), 'Question 6/6');
});

test('grade colours cover every letter and match the rule letters', () => {
  for (const l of ['A', 'B', 'C', 'D', 'F']) assert.ok(/^#[0-9a-f]{6}$/.test(GRADE_COLOR[l]));
  assert.equal(gradeColor(letterGrade(95)), GRADE_COLOR.A);
  assert.equal(gradeColor(letterGrade(10)), GRADE_COLOR.F);
  assert.equal(gradeColor('?'), GRADE_COLOR.F);
});

test('teacher comments: 3 variants per standing, deterministic', () => {
  for (const s of ['honors', 'good', 'fair', 'probation']) assert.equal(TEACHER_COMMENT[s].length, 3);
  assert.equal(teacherComment('good', 4, 'Y1_midterm1'), teacherComment('good', 4, 'Y1_midterm1'));
  assert.ok(TEACHER_COMMENT.probation.includes(teacherComment('probation', 9, 'k')));
});

test('study hour options, time tint, gains text, proctor line', () => {
  assert.deepEqual(hourOptions(30, 12).map((o) => o.enabled), [true, true, false]);
  assert.deepEqual(hourOptions(5, 12).map((o) => o.enabled), [false, false, false]);
  assert.equal(timeTint(12 * 60)[3], 0);
  assert.ok(timeTint(22 * 60)[3] > 0.3);
  assert.equal(joinGains({ math: 3, pe: 1 }), 'Math +3  PE +1');
  assert.ok(proctorLine(95).includes('Excellent'));
});

test('registerAcademicScenes registers the five scenes', () => {
  resetRegistry();
  registerAcademicScenes();
  assert.deepEqual(listScenes(), ['activity:study_home', 'activity:study_library', 'class', 'exam', 'report_card']);
  resetRegistry();
  registerScene('x', () => ({}));
  resetRegistry();
});
