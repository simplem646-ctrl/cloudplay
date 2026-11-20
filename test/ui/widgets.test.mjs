import test from 'node:test';
import assert from 'node:assert/strict';
import { DialogueBox, ChoiceBox, ConfirmBox, NumberPicker, LINES_PER_PAGE, ListMenu, GridMenu, TabBar, CalendarGrid, Banner, TextPage, ToastStack, HUD } from '../../src/ui/index.js';

const services = { settings: { textSpeed: 'normal' }, sfx: () => {} };
// fake engine input: pass the actions that are "pressed" this frame
const mk = (...acts) => { const s = new Set(acts); return { pressed: (a) => s.has(a), repeat: (a) => s.has(a), down: (a) => s.has(a) }; };
const run = (w, secs, input = mk()) => { for (let i = 0; i < secs * 60; i++) w.update(1 / 60, input); };

test('DialogueBox types out, paginates and finishes on confirm', () => {
  const long = 'This is a rather long line of dialogue that definitely needs more than three lines of text to display in the box, '.repeat(3);
  const d = new DialogueBox({ services, who: 'nina', name: 'Nina', face: 'happy', text: long });
  assert.ok(d.pages.length >= 2);
  assert.ok(d.pages.every((p) => p.length <= LINES_PER_PAGE));
  assert.ok(d.isTyping());
  run(d, 0.3);
  assert.ok(d.shown > 0 && d.isTyping());
  d.update(1 / 60, mk('confirm')); // first confirm skips the typewriter
  assert.ok(!d.isTyping());
  d.update(1 / 60, mk('confirm')); // second confirm turns the page
  assert.equal(d.page, 1);
  while (!d.done) { d.update(1 / 60, mk('confirm')); d.update(1 / 60, mk('confirm')); }
  assert.equal(d.result, true);
});

test('DialogueBox speed follows the text-speed setting and fast input', () => {
  const text = 'x'.repeat(60);
  const slow = new DialogueBox({ services: { settings: { textSpeed: 'slow' } }, who: null, text, style: 'narrate' });
  const fast = new DialogueBox({ services: { settings: { textSpeed: 'fast' } }, who: null, text, style: 'narrate' });
  run(slow, 0.5); run(fast, 0.5);
  assert.ok(fast.shown > slow.shown);
  const boosted = new DialogueBox({ services, who: null, text, style: 'narrate' });
  const normal = new DialogueBox({ services, who: null, text, style: 'narrate' });
  run(boosted, 0.5, mk('fast')); run(normal, 0.5);
  assert.ok(boosted.shown > normal.shown);
});

test('DialogueBox shows no portrait for narration and unknown speakers get a placeholder slot', () => {
  assert.equal(new DialogueBox({ services, style: 'narrate', text: 'Hi' }).showPortrait, false);
  assert.equal(new DialogueBox({ services, who: 'unknown', name: '???', text: 'Hi' }).showPortrait, true);
});

test('ChoiceBox navigates, skips nothing, returns the index; cancel only when allowed', () => {
  const c = new ChoiceBox({ services, options: ['a', 'b', { text: 'c', disabled: true }] });
  c.update(1 / 60, mk('down'));
  assert.equal(c.cursor, 1);
  c.update(1 / 60, mk('down'));
  c.update(1 / 60, mk('confirm')); // disabled: stays open
  assert.equal(c.done, false);
  c.update(1 / 60, mk('up'));
  c.update(1 / 60, mk('confirm'));
  assert.equal(c.result, 1);
  const c2 = new ChoiceBox({ services, options: ['a', 'b'], cancellable: true });
  c2.update(1 / 60, mk('cancel'));
  assert.equal(c2.result, -1);
  const c3 = new ChoiceBox({ services, options: ['a', 'b'] });
  c3.update(1 / 60, mk('cancel'));
  assert.equal(c3.done, false);
});

test('ConfirmBox and NumberPicker', () => {
  const y = new ConfirmBox({ services, message: 'Sleep now?', defaultYes: true });
  y.update(1 / 60, mk('confirm'));
  assert.equal(y.result, true);
  const n = new ConfirmBox({ services, message: 'Quit?' });
  n.update(1 / 60, mk('confirm'));
  assert.equal(n.result, false);
  const p = new NumberPicker({ services, min: 1, max: 5, value: 2, unitPrice: 6 });
  p.update(1 / 60, mk('right')); p.update(1 / 60, mk('right')); p.update(1 / 60, mk('right')); p.update(1 / 60, mk('right'));
  assert.equal(p.value, 5);
  p.update(1 / 60, mk('confirm'));
  assert.equal(p.result, 5);
});

test('ListMenu scrolls, wraps and respects disabled rows', () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ label: `Item ${i}`, disabled: i === 3 }));
  let seen = -1;
  const l = new ListMenu({ services, items, rows: 4, onCursor: (i) => { seen = i; } });
  for (let i = 0; i < 5; i++) l.update(1 / 60, mk('down'));
  assert.equal(l.cursor, 5); assert.equal(seen, 5);
  assert.ok(l.top >= 2 && l.cursor < l.top + 4);
  l.update(1 / 60, mk('up')); l.update(1 / 60, mk('up')); l.update(1 / 60, mk('up')); // onto the disabled row 2->3? (5->2)
  l.cursor = 3; l.update(1 / 60, mk('confirm'));
  assert.equal(l.done, false);
  l.cursor = 9; l.update(1 / 60, mk('down'));
  assert.equal(l.cursor, 0); assert.equal(l.top, 0);
  l.update(1 / 60, mk('confirm'));
  assert.equal(l.result.index, 0);
  const c = new ListMenu({ services, items }); c.update(1 / 60, mk('cancel'));
  assert.equal(c.result, null);
});

test('GridMenu moves in 2D and clamps to the last item', () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ label: `i${i}` }));
  const g = new GridMenu({ services, items, cols: 4, rows: 2 });
  g.update(1 / 60, mk('down')); assert.equal(g.cursor, 4);
  g.update(1 / 60, mk('down')); assert.equal(g.cursor, 8);
  g.update(1 / 60, mk('down')); assert.equal(g.cursor, 8); // already on the last row
  g.cursor = 7; g.update(1 / 60, mk('down')); assert.equal(g.cursor, 9); // last row is shorter: clamp to the last item
  g.update(1 / 60, mk('left')); assert.equal(g.cursor, 8);
  g.update(1 / 60, mk('confirm')); assert.equal(g.result.index, 8);
});

test('TabBar wraps and fires onChange; CalendarGrid moves by day and week', () => {
  const seen = [];
  const t = new TabBar({ services, labels: ['A', 'B', 'C'], onChange: (i) => seen.push(i) });
  t.update(1 / 60, mk('left'));
  assert.equal(t.index, 2); assert.deepEqual(seen, [2]);
  const c = new CalendarGrid({ services, today: 14 });
  c.update(1 / 60, mk('right')); assert.equal(c.cursor, 15);
  c.update(1 / 60, mk('down')); assert.equal(c.cursor, 22);
  c.update(1 / 60, mk('down')); c.update(1 / 60, mk('down')); assert.equal(c.cursor, 28);
  c.update(1 / 60, mk('confirm')); assert.equal(c.result, 28);
  assert.match(c.detailLines(14)[0], /Spring 14/);
  const d = new CalendarGrid({ services, data: { 20: { festival: 'Regional Meet', birthdays: ['Nina'] } } });
  assert.ok(d.detailLines(20).some((l) => l.includes('Regional Meet')));
});

test('Banner, TextPage, ToastStack and HUD lifecycle', () => {
  const b = new Banner({ services, text: 'Spring', ms: 500 });
  run(b, 0.6);
  assert.equal(b.result, true);
  const tp = new TextPage({ services, lines: [{ text: 'Credits', style: 'title' }, { text: 'Made with care.', style: 'text' }], speed: 400 });
  run(tp, 3);
  assert.equal(tp.result, true);
  const ts = new ToastStack({ services });
  ts.push({ text: 'Got a bun!', ttl: 0.5 });
  assert.equal(ts.items.length, 1);
  run(ts, 0.7);
  assert.equal(ts.items.length, 0);
  const h = new HUD({ services });
  h.showLocation('Bell Square'); run(h, 3.5);
  assert.equal(h.loc, null);
});
