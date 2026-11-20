// minigame:music_rhythm - four lanes of falling notes; press the matching arrow as a note crosses the line.
import { drawText, THEME } from '../../ui/index.js';
import { MiniGame } from './minigame.js';
import { makeChart, judgeHit, rhythmScore, RHYTHM } from './logic.js';

const LANE_X = [88, 128, 168, 208], LANE_W = 36, HIT_Y = 190, TOP_Y = 24;
const LANE_ACTION = ['left', 'down', 'up', 'right'];
const LANE_COLOR = ['#e8645a', '#7fb4ff', '#7fd36a', '#f2b84b'];
const ARROW = ['◄', '▼', '▲', '►'];

export class MusicRhythm extends MiniGame {
  constructor(game, params) {
    super(game, params);
    this.id = 'music_rhythm';
    this.title = 'Rhythm Practice';
    this.controls = ['Press the arrow keys as the notes', 'reach the glowing line.', 'Perfect timing scores the most!', 'Left  Down  Up  Right'];
    // defaults so the playfield can be drawn during the countdown, before startPlay()
    this.chart = null; this.song = 0; this.flash = [0, 0, 0, 0]; this.judge = null; this.judgeT = 0;
    this.stats = { perfect: 0, good: 0, miss: 0, combo: 0, maxCombo: 0, total: 0 };
  }
  startPlay() {
    this.chart = makeChart({ seed: this.rngSeed, difficulty: this.difficulty, bpm: this.params.bpm ?? 112, seconds: this.params.seconds ?? 24 }).map((n) => ({ ...n, hit: false, missed: false }));
    this.song = -(RHYTHM.travel - 0.2);
    this.stats = { perfect: 0, good: 0, miss: 0, combo: 0, maxCombo: 0, total: this.chart.length };
    this.flash = [0, 0, 0, 0];
    this.judge = null; this.judgeT = 0;
    this.endAt = this.chart.length ? this.chart[this.chart.length - 1].t + 1.2 : 1;
  }
  setJudge(text, color) { this.judge = { text, color }; this.judgeT = 0.6; }
  playUpdate(dt, input) {
    this.song += dt;
    this.flash = this.flash.map((f) => Math.max(0, f - dt * 4));
    this.judgeT = Math.max(0, this.judgeT - dt);
    const s = this.stats;
    for (let lane = 0; lane < 4; lane++) {
      if (!input.pressed(LANE_ACTION[lane])) continue;
      this.flash[lane] = 1;
      let best = null;
      for (const n of this.chart) if (n.lane === lane && !n.hit && !n.missed && Math.abs(n.t - this.song) <= RHYTHM.good && (!best || Math.abs(n.t - this.song) < Math.abs(best.t - this.song))) best = n;
      if (!best) continue;
      const j = judgeHit(best.t - this.song);
      best.hit = true;
      if (j === 'perfect') { s.perfect++; this.setJudge('PERFECT!', THEME.gold); this.sfx('chime'); } else { s.good++; this.setJudge('Good', '#7fd36a'); this.sfx('cursor'); }
      s.combo++; s.maxCombo = Math.max(s.maxCombo, s.combo);
    }
    for (const n of this.chart) {
      if (!n.hit && !n.missed && this.song - n.t > RHYTHM.good) { n.missed = true; s.miss++; s.combo = 0; this.setJudge('Miss', '#e8645a'); }
    }
    if (this.song > this.endAt) {
      const score = rhythmScore({ perfect: s.perfect, good: s.good, total: s.total, maxCombo: s.maxCombo });
      this.end(score, { perfect: s.perfect, good: s.good, miss: s.miss, maxCombo: s.maxCombo, detail: `${s.perfect} perfect, ${s.good} good, ${s.miss} miss - best combo ${s.maxCombo}` });
    }
  }
  drawBackground(ctx) {
    const beat = this.mode === 'play' ? Math.abs(Math.sin((this.song || 0) * Math.PI * (112 / 60))) : 0;
    ctx.fillStyle = '#1d2340'; ctx.fillRect(0, 0, 320, 240);
    for (let i = 0; i < 12; i++) { ctx.fillStyle = `rgba(${60 + beat * 40},${50},${110},0.35)`; ctx.fillRect(0, i * 20, 320, 10); }
    ctx.fillStyle = 'rgba(8,10,24,0.55)'; ctx.fillRect(LANE_X[0] - 4, 0, LANE_X[3] + LANE_W + 4 - LANE_X[0] + 4, 240);
  }
  playDraw(ctx) {
    drawText(ctx, 'Rhythm Practice', 160, 6, { color: THEME.cream, shadow: '#141a33', align: 'center' });
    for (let lane = 0; lane < 4; lane++) {
      const x = LANE_X[lane];
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x, TOP_Y, LANE_W, HIT_Y - TOP_Y + 14);
      ctx.fillStyle = LANE_COLOR[lane]; ctx.globalAlpha = 0.25 + this.flash[lane] * 0.6; ctx.fillRect(x, HIT_Y - 6, LANE_W, 16); ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff7de'; ctx.fillRect(x, HIT_Y, LANE_W, 1);
      drawText(ctx, ARROW[lane], x + LANE_W / 2, HIT_Y + 14, { color: LANE_COLOR[lane], shadow: '#141a33', align: 'center' });
    }
    if (!this.chart) return;
    for (const n of this.chart) {
      if (n.hit) continue;
      const k = 1 - (n.t - this.song) / RHYTHM.travel; // 0 at spawn, 1 at the line
      if (k < 0 || k > 1.18) continue;
      const y = Math.round(TOP_Y + k * (HIT_Y - TOP_Y)), x = LANE_X[n.lane];
      ctx.globalAlpha = n.missed ? 0.35 : 1;
      ctx.fillStyle = '#141a33'; ctx.fillRect(x + 2, y - 5, LANE_W - 4, 11);
      ctx.fillStyle = LANE_COLOR[n.lane]; ctx.fillRect(x + 3, y - 4, LANE_W - 6, 9);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + 4, y - 3, LANE_W - 8, 2);
      ctx.globalAlpha = 1;
    }
    const s = this.stats;
    drawText(ctx, `Combo ${s.combo}`, 10, 30, { color: '#ffffff', shadow: '#141a33', scale: 1 });
    drawText(ctx, `Best ${s.maxCombo}`, 10, 42, { color: THEME.cream, shadow: '#141a33' });
    drawText(ctx, `${s.perfect}/${s.good}/${s.miss}`, 310, 30, { color: THEME.cream, shadow: '#141a33', align: 'right' });
    if (this.judgeT > 0 && this.judge) drawText(ctx, this.judge.text, 160, 110 - Math.round((0.6 - this.judgeT) * 14), { color: this.judge.color, shadow: '#141a33', align: 'center', scale: 2, alpha: Math.min(1, this.judgeT * 3) });
  }
}
