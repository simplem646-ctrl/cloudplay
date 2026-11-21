// Scene 'activity:job_cafe': params {} -> { minutes, energy, pay, rank }.
// Guard (canWork) -> Aunt Roz briefs (longer on the first shift) -> minigame:cafe_serve { context: 'job' } -> finishShift -> pay card -> clock +180 -> pop.
// A cancelled/missing mini-game means no shift happens (minutes 0, pay 0). `rank` is the medal.
// Pure helpers (Node-testable): rozBrief, payLines.
import { DialogueBox, drawText, drawWindow, THEME } from '../../ui/index.js';
import { canWork, finishShift } from '../../sim/jobs.js';
import { openScene } from '../registry.js';
import { timeTint, tintCss } from '../academics/logic.js';
import { AcademicScene, drawCard } from '../academics/common.js';
import { rankFor, RANK_COMMENT } from './logic.js';
import { guardLine } from './activity_rest.js';

/** Roz's briefing text: long welcome on the first shift, a short line afterwards (more cheerful for a good streak). */
export function rozBrief({ firstShift = false, shifts = 0 } = {}) {
  if (firstShift) {
    return 'Theo! You came. Welcome to the Lantern Cafe, dear. Every customer sits at a table and wants one thing: coffee, tea, cake or a sandwich. '
      + 'Watch their faces, send the right order fast, and nobody walks out grumpy. Do well and I will pay you a little extra. Ready to try?';
  }
  if (shifts >= 8) return 'My best waiter is here! Same as always: right order, right away. Apron on, dear.';
  if (shifts >= 3) return 'Good to see you again. The tables are filling up, so keep an eye on the impatient ones.';
  return 'Back for another shift? Good. Remember, the right order, quickly. Apron is on the hook.';
}

/** Pay card lines. `res` is the finishShift result. */
export function payLines(res, rank) {
  const lines = [{ text: `Pay  $${res.pay}`, color: THEME.gold }];
  if (res.bonus) lines.push({ text: `Includes a $${res.bonus} tip for good service`, color: THEME.green });
  lines.push({ text: 'Charm +1', color: THEME.green });
  lines.push({ text: `Shifts worked: ${res.shifts}${res.firstShift ? '  (your first!)' : ''}`, color: THEME.cream });
  lines.push({ text: `Energy ${res.energy}   Time 3 h`, color: THEME.cream });
  if (rank) lines.push({ text: `Service: ${rank === 'none' ? 'rough' : rank}`, color: THEME.cream });
  return lines;
}

const rect = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); };

/** Cafe interior seen from the customer side of the counter, with Roz behind it. */
export function drawCafeBack(ctx, { t = 0, minute = 960, roz = true } = {}) {
  rect(ctx, '#e8d0a0', 0, 0, 320, 240);
  rect(ctx, '#c9a870', 0, 0, 320, 8);
  for (let x = 0; x < 320; x += 20) rect(ctx, '#dcc490', x, 8, 2, 112);
  // window
  rect(ctx, '#7a4f2e', 196, 20, 100, 70); rect(ctx, '#9fd0ee', 200, 24, 92, 62); rect(ctx, '#7a4f2e', 245, 24, 2, 62);
  rect(ctx, '#ffffff', 206 + ((t * 4) % 30), 34, 16, 5);
  // shelves with cups
  rect(ctx, '#7a4f2e', 22, 40, 110, 4); rect(ctx, '#7a4f2e', 22, 66, 110, 4);
  for (let i = 0; i < 7; i++) { rect(ctx, ['#e8645a', '#f6ecd2', '#7fb4ff'][i % 3], 28 + i * 15, 32, 9, 8); rect(ctx, ['#f2b84b', '#7fd36a', '#f4a6c8'][i % 3], 28 + i * 15, 58, 9, 8); }
  rect(ctx, '#d0443a', 140, 24, 40, 16); drawText(ctx, 'CAFE', 160, 29, { color: '#fff7de', shadow: null, align: 'center' });
  // floor
  rect(ctx, '#a8744a', 0, 120, 320, 120);
  for (let y = 120; y < 240; y += 14) rect(ctx, '#966440', 0, y, 320, 1);
  if (roz) {
    const bob = Math.round(Math.sin(t * 2) * 1);
    rect(ctx, '#e8645a', 140, 92 + bob, 22, 24); // dress
    rect(ctx, '#fff7de', 144, 100 + bob, 14, 16); // apron
    rect(ctx, '#f0c8a0', 144, 78 + bob, 14, 14);
    rect(ctx, '#8a8fb0', 142, 72 + bob, 18, 8); rect(ctx, '#8a8fb0', 141, 76 + bob, 3, 10); rect(ctx, '#8a8fb0', 158, 76 + bob, 3, 10); // grey bun hair
    rect(ctx, '#1d2340', 147, 84 + bob, 2, 2); rect(ctx, '#1d2340', 153, 84 + bob, 2, 2);
  }
  // counter
  rect(ctx, '#7a4f2e', 0, 112, 320, 8); rect(ctx, '#b07a44', 0, 120, 320, 36); rect(ctx, '#8a5c32', 0, 156, 320, 4);
  rect(ctx, '#d8d8e8', 40, 100, 24, 12); rect(ctx, '#a0a0b8', 44, 96, 16, 4); // espresso machine
  rect(ctx, '#f6ecd2', 250, 104, 28, 8); rect(ctx, '#e8645a', 254, 98, 20, 6); // cake stand
  // steam
  for (let i = 0; i < 3; i++) rect(ctx, 'rgba(255,255,255,0.5)', 50 + i * 4 + Math.sin(t * 3 + i) * 2, 88 - ((t * 14 + i * 7) % 18), 2, 3);
  const [r, g, b, a] = timeTint(minute);
  if (a > 0) { ctx.fillStyle = tintCss([r, g, b, a * 0.5]); ctx.fillRect(0, 0, 320, 240); }
}

export class JobCafe extends AcademicScene {
  constructor(game, params = {}) {
    super(game, params);
    this.res = null;
    this.medal = null;
  }

  enter() {
    this.minute0 = this.state.time.minute;
    const can = canWork(this.state);
    if (!can.ok) { this.guardText = guardLine('job', can); this.sfx('error'); this.setMode('guard'); return; }
    this.first = !this.state.school.job;
    this.setMode('brief');
    const text = rozBrief({ firstShift: this.first, shifts: this.state.school.jobShifts || 0 });
    this.ask(new DialogueBox({ services: this.services, who: 'roz', name: 'Aunt Roz', text, face: 'happy' }), () => this.launch());
  }

  popEmpty() { this.finish({ minutes: 0, energy: 0, pay: 0, rank: null }); }

  async launch() {
    this.setMode('waiting');
    const out = await openScene(this.game, 'minigame:cafe_serve', { context: 'job', seed: (this.state.time.absDay || 1) * 5 + 1 });
    if (this.finished) return;
    if (!out || out.cancelled || out.missing || typeof out.score !== 'number') {
      this.setMode('nope');
      this.ask(new DialogueBox({ services: this.services, who: 'roz', name: 'Aunt Roz', text: 'Changed your mind? No harm done, dear. The apron will keep.', face: 'neutral' }), () => this.popEmpty());
      return;
    }
    this.medal = out.rank || rankFor(out.score);
    this.score = out.score;
    this.res = finishShift(this.state, { score: out.score, rank: this.medal }, { advanceClock: false });
    if (!this.res.ok) { this.guardText = guardLine('job', this.res); this.setMode('guard'); return; }
    this.sfx(this.res.pay > 0 ? 'coin' : 'success');
    this.setMode('pay');
  }

  step(dt, input) {
    if (this.mode === 'guard') {
      if (this.mt > 0.3 && (input.pressed('confirm') || input.pressed('cancel'))) this.popEmpty();
    } else if (this.mode === 'pay') {
      if (this.mt > 0.5 && (input.pressed('confirm') || input.pressed('cancel'))) {
        const r = this.res;
        this.advanceClock(r.minutes);
        this.finish({ minutes: r.minutes, energy: r.energy, pay: r.pay, rank: this.medal });
      }
    } else this.tickWidget(dt, input);
  }

  draw(ui) {
    const ctx = ui.ctx;
    drawCafeBack(ctx, { t: this.t, minute: this.minute0 });
    if (this.widget) this.widget.draw(ctx);
    if (this.mode === 'guard') {
      ctx.fillStyle = 'rgba(12,14,34,0.45)'; ctx.fillRect(0, 0, 320, 240);
      drawCard(ctx, { x: 40, y: 80, w: 240, title: 'Cafe shift', lines: [{ text: this.guardText, color: '#ffffff' }], t: this.t });
    }
    if (this.mode === 'pay') {
      ctx.fillStyle = 'rgba(12,14,34,0.55)'; ctx.fillRect(0, 0, 320, 240);
      const comment = RANK_COMMENT[this.medal][Math.abs(this.score) % 3];
      drawCard(ctx, { x: 40, y: 44, w: 240, title: 'Shift over', lines: [...payLines(this.res, this.medal), { gap: true }, { text: `Roz: "${comment}"`, color: THEME.gold }], t: this.t });
    }
    void drawWindow;
  }
}
