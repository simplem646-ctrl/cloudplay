// minigame:track_sprint - 100 m dash. Alternate LEFT/RIGHT (or Z/X) as fast as you can; don't jump the gun.
import { drawText, drawBar, THEME } from '../../ui/index.js';
import { MiniGame } from './minigame.js';
import { SPRINT, sprintTopSpeed, sprintOpponents, sprintScore } from './logic.js';

const LANES = [78, 108, 138, 168]; // lane top y
const X0 = 34, X1 = 286;
const COLORS = [{ shirt: '#4a78c4', hair: '#7a4a2b' }, { shirt: '#d63a3a', hair: '#2a2332' }, { shirt: '#3a8f5a', hair: '#e3b95a' }, { shirt: '#e0a030', hair: '#5b3a29' }];

export class TrackSprint extends MiniGame {
  constructor(game, params) {
    super(game, params);
    this.id = 'track_sprint';
    this.title = '100 m Dash';
    this.controls = ['Alternate LEFT and RIGHT', '(or Z and X) as fast as you can!', 'Wait for the whistle: jumping the gun', 'costs you time.'];
  }
  startPlay() {
    const fitness = this.params.fitness ?? this.game.sim?.state?.player?.traits?.fitness ?? 20;
    this.top = sprintTopSpeed(fitness);
    const opp = sprintOpponents(this.difficulty, this.rngSeed);
    this.runners = [
      { dist: 0, v: 0, lane: 1, finished: null, color: COLORS[0], player: true },
      ...opp.map((target, i) => ({ dist: 0, v: 0, target, lane: [0, 2, 3][i], finished: null, color: COLORS[i + 1], wobble: i * 1.7 })),
    ];
    this.me = this.runners[0];
    this.clock = 0; this.last = null; this.penalty = 0; this.over = 0; this.falseStart = false;
  }
  playUpdate(dt, input) {
    const me = this.me;
    this.clock += dt;
    // starting gun fires 0.35 s after the countdown ends; pressing before it = false start
    const gun = this.clock >= 0.35;
    const pressL = input.pressed('left') || input.pressed('confirm'), pressR = input.pressed('right') || input.pressed('cancel');
    if ((pressL || pressR) && !gun && !this.falseStart) { this.falseStart = true; this.penalty = SPRINT.falseStartPenalty; this.sfx('error'); }
    if (this.penalty > 0) this.penalty -= dt;
    else if (gun && !me.finished) {
      const key = pressL ? 'L' : pressR ? 'R' : null;
      if (key) {
        if (key !== this.last) { me.v = Math.min(this.top, me.v + SPRINT.boost); this.last = key; this.sfx('step_stone'); } else me.v = Math.max(0, me.v - 0.15);
      }
    }
    this.runners.forEach((r) => {
      if (r.player) { if (gun) r.v = Math.max(0, r.v - (r.v * 0.45 + 0.8) * dt); }
      else if (gun) { const k = Math.min(1, (this.clock - 0.35) / 2.2); r.v = r.target * (0.35 + 0.65 * k) * (1 + Math.sin(this.clock * 2 + r.wobble) * 0.025); }
      if (!r.finished) { r.dist += r.v * dt; if (r.dist >= SPRINT.distance) { r.dist = SPRINT.distance; r.finished = this.clock; } }
    });
    if (me.finished) {
      this.over += dt;
      if (this.over > 1.4) {
        const place = 1 + this.runners.filter((r) => !r.player && (r.finished !== null && r.finished <= me.finished)).length;
        const time = me.finished;
        this.end(sprintScore(place, time), { place, time: +time.toFixed(2), detail: `Place ${place} of 4 - ${time.toFixed(2)} s` });
      }
    }
  }
  drawBackground(ctx) {
    ctx.fillStyle = '#8fd0f0'; ctx.fillRect(0, 0, 320, 60);
    ctx.fillStyle = '#6cc24a'; ctx.fillRect(0, 60, 320, 20);
    for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? '#c9b8e0' : '#9aa8d8'; ctx.fillRect(i * 20, 28, 18, 24); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(i * 20, 46, 18, 6); }
    ctx.fillStyle = '#7a4f2e'; ctx.fillRect(0, 52, 320, 4);
    ctx.fillStyle = '#6cc24a'; ctx.fillRect(0, 196, 320, 44);
    LANES.forEach((y) => { ctx.fillStyle = '#c0603a'; ctx.fillRect(0, y, 320, 28); ctx.fillStyle = '#f6ecd2'; ctx.fillRect(0, y + 27, 320, 1); });
    ctx.fillStyle = '#f6ecd2'; ctx.fillRect(X0, 78, 2, 118);
    for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#141a33' : '#ffffff'; ctx.fillRect(X1, 78 + i * 10, 4, 10); ctx.fillStyle = i % 2 ? '#ffffff' : '#141a33'; ctx.fillRect(X1 + 4, 78 + i * 10, 4, 10); }
  }
  drawRunner(ctx, r) {
    const x = Math.round(X0 + (r.dist / SPRINT.distance) * (X1 - X0)) - 5;
    const y = LANES[r.lane] + 4;
    const ph = Math.floor((r.dist * 1.4) % 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + 1, y + 21, 12, 3);
    ctx.fillStyle = '#f6cfa8'; ctx.fillRect(x + 3, y, 6, 6); // head
    ctx.fillStyle = r.color.hair; ctx.fillRect(x + 3, y - 1, 6, 3); ctx.fillRect(x + 2, y, 1, 3);
    ctx.fillStyle = r.color.shirt; ctx.fillRect(x + 2, y + 6, 8, 7);
    ctx.fillStyle = '#f6cfa8'; ctx.fillRect(x + (ph ? 0 : 9), y + 7, 2, 4); ctx.fillRect(x + (ph ? 9 : 0) + 1, y + 8, 2, 3);
    ctx.fillStyle = '#2f3f77'; ctx.fillRect(x + 3, y + 13, 3, ph ? 7 : 5); ctx.fillRect(x + 6, y + 13, 3, ph ? 5 : 7);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 3, y + (ph ? 20 : 18), 3, 2); ctx.fillRect(x + 6, y + (ph ? 18 : 20), 3, 2);
    if (r.player) { ctx.fillStyle = THEME.gold; ctx.fillRect(x + 4, y - 7, 4, 2); ctx.fillRect(x + 5, y - 5, 2, 2); }
  }
  playDraw(ctx) {
    drawText(ctx, '100 m', 160, 6, { color: '#ffffff', shadow: '#141a33', align: 'center' });
    if (this.runners) {
      [...this.runners].sort((a, b) => a.lane - b.lane).forEach((r) => this.drawRunner(ctx, r));
      const me = this.me;
      drawText(ctx, `${Math.min(100, me.dist).toFixed(0)} m`, 6, 204, { color: '#ffffff', shadow: '#141a33' });
      drawText(ctx, `${this.clock.toFixed(2)} s`, 314, 204, { color: '#ffffff', shadow: '#141a33', align: 'right' });
      drawBar(ctx, 100, 205, 120, 7, me.v, this.top, { fill: me.v > this.top * 0.85 ? THEME.gold : THEME.green });
      if (this.clock < 0.35) drawText(ctx, 'Wait...', 160, 130, { color: '#ffffff', shadow: '#141a33', align: 'center', scale: 2 });
      else if (this.clock < 3 && !me.finished) drawText(ctx, '◄  ►  alternate!', 160, 218, { color: this.clock % 0.4 < 0.2 ? THEME.gold : '#ffffff', shadow: '#141a33', align: 'center' });
      if (this.falseStart && this.penalty > 0) drawText(ctx, 'False start!', 160, 130, { color: THEME.red, shadow: '#141a33', align: 'center', scale: 2 });
      if (me.finished) drawText(ctx, 'FINISH!', 160, 120, { color: THEME.gold, shadow: '#141a33', align: 'center', scale: 3 });
    }
  }
}
