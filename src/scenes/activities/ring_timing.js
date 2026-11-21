// Ring-timing mini-games: targets appear one after another, a ring closes in on each; press confirm as the ring meets it.
//   minigame:astronomy_stars  "Star Gazing"  (Moon Viewing Night telescope, Astronomy Club practice)
//   activity:shell_hunt       "Shell Hunt"   (Beach Day); pays Spiral Shells by medal
// Pure helpers (Node-testable): ringProgress, ringAccuracy, ringScore, makeTargets. The scenes share RingTiming.
import { drawText, THEME } from '../../ui/index.js';
import { RNG } from '../../core/rng.js';
import { MiniGame } from './minigame.js';
import { clampScore } from './logic.js';

export const RING = { targets: 8, gap: 1.35, life: 1.25, early: 0.55, late: 1.35, startR: 30, endR: 8 };

/** 0 when a target appears, 1 when its ring has closed on it; > 1 afterwards. */
export const ringProgress = (t, start, life = RING.life) => (t - start) / life;
/** 0..1 for a press at progress `p`: 1 at p == 1, falling off linearly; null when the press is too early to count. */
export function ringAccuracy(p) {
  if (p < RING.early) return null;
  if (p > RING.late) return 0;
  return Math.max(0, 1 - Math.abs(p - 1) / 0.4);
}
/** Mean accuracy of all targets (a missed target counts 0), 0..100. */
export const ringScore = (accs, total = RING.targets) => clampScore(Math.round((accs.reduce((s, a) => s + (a || 0), 0) / Math.max(1, total)) * 100));
/** Deterministic target layout: [{ x, y, start, life }]. Harder games close the ring faster. */
export function makeTargets(seed = 1, difficulty = 0.45, n = RING.targets) {
  const rng = new RNG(seed);
  const life = +(RING.life - difficulty * 0.35).toFixed(3);
  const out = [];
  for (let i = 0; i < n; i++) out.push({ x: 44 + Math.floor(rng.next() * 232), y: 58 + Math.floor(rng.next() * 112), start: +(0.5 + i * RING.gap).toFixed(3), life });
  return out;
}

const ring = (ctx, cx, cy, r, color) => {
  const n = Math.max(16, Math.round(r * 5));
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1); }
};
const disc = (ctx, cx, cy, r, color) => { ctx.fillStyle = color; for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); ctx.fillRect(cx - w, cy + y, 2 * w + 1, 1); } };

const SKINS = {
  stars: {
    id: 'astronomy_stars', title: 'Star Gazing',
    controls: ['Eight stars twinkle into view.', 'Press Z / Enter just as the ring', 'closes on each one to focus the scope.', 'Perfect timing scores the most!'],
    background(ctx, seed) {
      ctx.fillStyle = '#0b1030'; ctx.fillRect(0, 0, 320, 240);
      for (let i = 0; i < 6; i++) { ctx.fillStyle = `rgba(60,50,120,${0.10 + i * 0.03})`; ctx.fillRect(0, 120 + i * 20, 320, 20); }
      const r = new RNG(seed || 7);
      for (let i = 0; i < 70; i++) { ctx.fillStyle = r.next() < 0.2 ? '#dfe6ff' : '#6f78b8'; ctx.fillRect(Math.floor(r.next() * 320), Math.floor(r.next() * 200), 1, 1); }
      ctx.fillStyle = '#05071a'; ctx.fillRect(0, 214, 320, 26); for (let x = 0; x < 320; x += 16) ctx.fillRect(x, 206, 3, 8); // rooftop fence
    },
    target(ctx, x, y, t) {
      const tw = 0.6 + 0.4 * Math.sin(t * 9);
      ctx.fillStyle = '#fff7c0'; ctx.fillRect(x - 1, y - 4, 3, 9); ctx.fillRect(x - 4, y - 1, 9, 3); ctx.fillRect(x - 2, y - 2, 5, 5);
      ctx.globalAlpha = 0.35 * tw; ctx.fillStyle = '#fff7c0'; ctx.fillRect(x - 6, y - 6, 13, 13); ctx.globalAlpha = 1;
    },
    ringColor: '#7fb4ff', hitColor: '#f2b84b',
  },
  shells: {
    id: 'shell_hunt', title: 'Shell Hunt',
    controls: ['Shells glint in the wet sand.', 'Press Z / Enter just as the ring', 'closes on each one to grab it.', 'Perfect timing finds the most!'],
    background(ctx, seed) {
      ctx.fillStyle = '#7fc8e8'; ctx.fillRect(0, 0, 320, 40);
      ctx.fillStyle = '#4f9ccb'; ctx.fillRect(0, 40, 320, 18);
      ctx.fillStyle = '#e9f7ff'; for (let x = 0; x < 320; x += 24) ctx.fillRect(x + ((x / 24) % 2) * 8, 56, 14, 2);
      ctx.fillStyle = '#e8cf94'; ctx.fillRect(0, 58, 320, 182);
      const r = new RNG(seed || 9);
      for (let i = 0; i < 60; i++) { ctx.fillStyle = r.next() < 0.5 ? '#d2b676' : '#f2dfae'; ctx.fillRect(Math.floor(r.next() * 320), 62 + Math.floor(r.next() * 176), 2, 1); }
    },
    target(ctx, x, y) {
      disc(ctx, x, y, 5, '#fff3e3'); disc(ctx, x, y, 3, '#f4b6a0'); ctx.fillStyle = '#c97c6a'; ctx.fillRect(x - 1, y - 1, 2, 2); ctx.fillRect(x + 1, y, 1, 1);
    },
    ringColor: '#ffffff', hitColor: '#e8645a',
  },
};

export class RingTiming extends MiniGame {
  constructor(game, params, skin) {
    super(game, params);
    this.skin = skin;
    this.id = skin.id; this.title = skin.title; this.controls = skin.controls;
    this.targets = []; this.accs = []; this.clock = 0; this.fb = null; this.fbT = 0;
  }
  startPlay() {
    this.targets = makeTargets(this.rngSeed, this.difficulty).map((t) => ({ ...t, done: false, acc: 0 }));
    this.accs = []; this.clock = 0; this.fb = null; this.fbT = 0;
    this.endAt = this.targets[this.targets.length - 1].start + this.targets[this.targets.length - 1].life * RING.late + 0.6;
  }
  active() { return this.targets.find((t) => !t.done && this.clock >= t.start && ringProgress(this.clock, t.start, t.life) <= RING.late); }
  say(text, color) { this.fb = { text, color }; this.fbT = 0.7; }
  playUpdate(dt, input) {
    this.clock += dt;
    this.fbT = Math.max(0, this.fbT - dt);
    for (const t of this.targets) {
      if (!t.done && ringProgress(this.clock, t.start, t.life) > RING.late) { t.done = true; t.acc = 0; this.accs.push(0); this.say('Missed', '#e8645a'); }
    }
    if (input.pressed('confirm')) {
      const t = this.active();
      if (t) {
        const a = ringAccuracy(ringProgress(this.clock, t.start, t.life));
        if (a === null) { this.say('Too early', '#9a9fb5'); this.sfx('error'); }
        else {
          t.done = true; t.acc = a; this.accs.push(a);
          if (a >= 0.85) { this.say('PERFECT!', THEME.gold); this.sfx('chime'); } else if (a >= 0.4) { this.say('Good', '#7fd36a'); this.sfx('cursor'); } else { this.say('Close', '#9a9fb5'); this.sfx('cursor'); }
        }
      }
    }
    if (this.clock > this.endAt) {
      const score = ringScore(this.accs, this.targets.length);
      const good = this.accs.filter((a) => a >= 0.4).length;
      this.end(score, { detail: `${good} of ${this.targets.length} on target` });
    }
  }
  drawBackground(ctx) { this.skin.background(ctx, this.rngSeed); }
  playDraw(ctx) {
    drawText(ctx, this.title, 160, 6, { color: THEME.cream, shadow: '#141a33', align: 'center' });
    const done = this.targets.filter((t) => t.done).length;
    drawText(ctx, `${done}/${this.targets.length || RING.targets}`, 310, 6, { color: THEME.cream, shadow: '#141a33', align: 'right' });
    for (const t of this.targets) {
      const p = ringProgress(this.clock, t.start, t.life);
      if (t.done) { if (t.acc > 0 && p < RING.late + 0.6) { ctx.globalAlpha = 0.35; this.skin.target(ctx, t.x, t.y, this.clock); ctx.globalAlpha = 1; } continue; }
      if (p < 0) continue;
      this.skin.target(ctx, t.x, t.y, this.clock);
      const r = RING.endR + (RING.startR - RING.endR) * Math.max(0, 1 - p);
      const near = Math.abs(p - 1) < 0.12;
      ring(ctx, t.x, t.y, r, near ? this.skin.hitColor : this.skin.ringColor); ring(ctx, t.x, t.y, r + 1, near ? this.skin.hitColor : this.skin.ringColor);
    }
    if (this.fbT > 0 && this.fb) drawText(ctx, this.fb.text, 160, 214, { color: this.fb.color, shadow: '#141a33', align: 'center', scale: 2, alpha: Math.min(1, this.fbT * 3) });
  }
}

export class StarGazing extends RingTiming { constructor(game, params) { super(game, params, SKINS.stars); } }

/** Beach Day shell hunt: the same game, paying one Spiral Shell per bronze step (bronze 1, silver 2, gold 3). */
export class ShellHunt extends RingTiming {
  constructor(game, params) { super(game, params, SKINS.shells); }
  end(score, extra = {}) {
    super.end(score, extra);
    const n = { gold: 3, silver: 2, bronze: 1, none: 0 }[this.result.rank] || 0;
    if (n) {
      try { this.game.sim.inventory.add('seashell', n); } catch { /* inventory unavailable */ }
      this.result.detail = `Found ${n} Spiral Shell${n > 1 ? 's' : ''}!`;
    } else this.result.detail = 'No shells this time.';
    this.result.shells = n;
  }
}
