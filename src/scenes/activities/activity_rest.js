// Scenes 'activity:rest' (bench, 30/60 min), 'activity:nap' (1 h) and 'activity:jog' (1 h).
// All pop { minutes, energy, gains }. Guards come from the sim (`canNap`/`canJog`/`rest` results); the scene turns `reason` into a friendly line.
// Pure helpers (Node-testable): guardLine, restOptions, restLines, clockLabel, jogOffset, drawers are canvas-only.
import { ListMenu, drawText, drawWindow, drawBar, THEME } from '../../ui/index.js';
import { rest, nap, jog, canNap, canJog, NAP, JOG } from '../../sim/activities.js';
import { timeTint, tintCss } from '../academics/logic.js';
import { AcademicScene, drawCard } from '../academics/common.js';

const rect = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); };

/** 'HH:MM' for a minute-of-day (>= 1440 wraps). */
export const clockLabel = (minute) => {
  const m = ((Math.round(minute) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

const GUARD = {
  rest: { already_rested: 'You feel fully rested already. No need to sit.', bad_minutes: 'Pick 30 or 60 minutes.' },
  nap: {
    already_napped: 'You already napped today. Once is plenty.',
    not_daytime: 'Naps are for daytime only (09:00 to 17:00).',
    rested: 'You are not tired enough to nap.',
  },
  jog: {
    already_jogged: 'You already jogged today. Let your legs recover.',
    too_tired: 'Too tired to jog. Get some rest first.',
    bad_weather: 'A storm is rolling in. Maybe jog tomorrow.',
  },
  club: {
    no_club: 'You have not joined a club yet.',
    already_practiced: 'You already practised today. Rest your legs!',
    too_late: 'Practice is over for today.',
    too_tired: 'Too tired to practise. Get some rest first.',
  },
  job: {
    already_worked: 'You already worked a shift today.',
    too_late: 'Too late to start a shift today.',
    too_tired: 'Too tired for a shift. Get some rest first.',
  },
};

/** One friendly line for a failed guard. `res` is the sim result ({ reason, opensAt?, window? }). */
export function guardLine(kind, res = {}) {
  const reason = res.reason;
  if (reason === 'too_early') {
    const at = kind === 'job' ? res.window && res.window.open : res.opensAt;
    return at ? (kind === 'job' ? `Not yet. The cafe opens at ${at}.` : `Not yet. Practice starts at ${at}.`) : 'Not yet. Come back a little later.';
  }
  if (kind === 'job' && reason === 'too_late' && res.window) return `Too late to start a shift. The cafe closes at ${res.window.close}.`;
  return (GUARD[kind] && GUARD[kind][reason]) || 'Not right now.';
}

/** Bench choices: 30 / 60 min with the energy each would give (capped by room left). */
export function restOptions(energy, maxEnergy, per30 = 10) {
  return [30, 60].map((minutes) => ({ minutes, gain: Math.max(0, Math.min(maxEnergy - energy, (minutes / 30) * per30)) }));
}

/** Result card lines for a successful rest/nap/jog. */
export function restLines(kind, res) {
  const sign = (n) => (n >= 0 ? `+${n}` : String(n));
  const lines = [];
  if (kind === 'rest') lines.push({ text: 'You sat and watched the clouds drift by.', color: '#ffffff' });
  if (kind === 'nap') lines.push({ text: 'A short nap. You wake up refreshed.', color: '#ffffff' });
  if (kind === 'jog') lines.push({ text: 'A lap around the park. Fresh air and a clear head.', color: '#ffffff' });
  lines.push({ gap: true });
  lines.push({ text: `Energy ${sign(res.energy)}`, color: res.energy >= 0 ? THEME.green : THEME.red });
  for (const [k, v] of Object.entries(res.gains || {})) lines.push({ text: `${k[0].toUpperCase()}${k.slice(1)} +${v}`, color: THEME.gold });
  lines.push({ text: `Time passed: ${res.minutes >= 60 ? `${res.minutes / 60} h` : `${res.minutes} min`}`, color: THEME.cream });
  return lines;
}

/** Scroll offset of the jog backdrop layers at time t (px, per layer speed). */
export const jogOffset = (t, speed) => Math.floor(t * speed);

// ------------------------------------------------------------------ drawing
function tint(ctx, minute, k = 1) {
  const [r, g, b, a] = timeTint(minute);
  if (a > 0) { ctx.fillStyle = tintCss([r, g, b, a * k]); ctx.fillRect(0, 0, 320, 240); }
}

function theoBack(ctx, x, y, sit = true) {
  rect(ctx, '#1d2340', x - 1, y + 17, 14, 2);
  rect(ctx, '#3a6ea5', x + 1, y + 7, 10, sit ? 9 : 11);
  rect(ctx, '#2b3560', x + 1, y + (sit ? 16 : 18), 10, 4);
  rect(ctx, '#f0c8a0', x + 3, y, 6, 7);
  rect(ctx, '#4a3426', x + 2, y - 1, 8, 7);
}

function cloud(ctx, x, y, c = '#ffffff') { rect(ctx, c, x, y + 3, 26, 5); rect(ctx, c, x + 5, y, 14, 4); rect(ctx, c, x + 14, y + 1, 10, 4); }

/** Park bench: sky, hills, pond, tree, bench with Theo from behind. */
export function drawBench(ctx, { t = 0, minute = 600 } = {}) {
  const h = (minute % 1440) / 60, dusk = h >= 17 && h < 20, night = h >= 20 || h < 6;
  rect(ctx, night ? '#1d2748' : dusk ? '#e8905a' : '#8fc8ee', 0, 0, 320, 110);
  rect(ctx, night ? '#26305a' : dusk ? '#f2b27a' : '#a8d8f4', 0, 80, 320, 30);
  if (!night) rect(ctx, '#fff3b0', 250, 18, 14, 14);
  for (let i = 0; i < 3; i++) cloud(ctx, ((t * (3 + i * 2) + i * 120) % 400) - 40, 16 + i * 22, night ? '#3a4470' : '#ffffff');
  rect(ctx, '#5a9a52', 0, 96, 320, 20); rect(ctx, '#4a8a46', 0, 100, 140, 16); rect(ctx, '#4a8a46', 200, 98, 120, 18);
  rect(ctx, '#6cb85a', 0, 116, 320, 124);
  for (let x = 0; x < 320; x += 24) for (let y = 124; y < 240; y += 18) rect(ctx, '#5aa24c', x + ((y / 18) % 2) * 12, y, 3, 2);
  // pond
  rect(ctx, '#5a8ac8', 196, 126, 100, 26); rect(ctx, '#7aaae0', 200, 128, 92, 6);
  for (let i = 0; i < 3; i++) rect(ctx, '#d6ecff', 210 + i * 28 + Math.sin(t * 1.5 + i) * 4, 138 + i * 3, 10, 1);
  // tree
  rect(ctx, '#6a4426', 36, 62, 12, 70); rect(ctx, '#2f7a3e', 12, 20, 60, 50); rect(ctx, '#3f9a4e', 22, 12, 40, 30); rect(ctx, '#4aaa58', 18 + Math.sin(t) * 1, 28, 14, 10);
  rect(ctx, '#f2d27a', 48 + ((t * 5) % 40), 70 + ((t * 11) % 50), 2, 2); // drifting leaf
  // path
  rect(ctx, '#d8c08a', 0, 172, 320, 26);
  // bench
  rect(ctx, '#7a4f2e', 100, 144, 100, 6); rect(ctx, '#9a6a3e', 100, 150, 100, 8); rect(ctx, '#5a3a22', 106, 158, 6, 16); rect(ctx, '#5a3a22', 188, 158, 6, 16);
  theoBack(ctx, 140, 126);
  // birds
  const bx = (t * 14) % 360 - 20;
  if (!night) { rect(ctx, '#3b2a1f', bx, 44 + Math.sin(t * 3) * 3, 2, 1); rect(ctx, '#3b2a1f', bx + 2, 43 + Math.sin(t * 3) * 3, 2, 1); rect(ctx, '#3b2a1f', bx + 4, 44 + Math.sin(t * 3) * 3, 2, 1); }
  tint(ctx, minute, 0.8);
}

/** Jog: three scrolling layers and a two-frame runner. */
export function drawJog(ctx, { t = 0, minute = 600, progress = 0 } = {}) {
  rect(ctx, '#8fc8ee', 0, 0, 320, 120);
  rect(ctx, '#a8d8f4', 0, 84, 320, 36);
  rect(ctx, '#fff3b0', 40, 16, 12, 12);
  for (let i = 0; i < 3; i++) cloud(ctx, 320 - ((jogOffset(t, 6 + i * 3) + i * 130) % 400) + 20 - 40, 14 + i * 20);
  const hill = (c, base, amp, speed, period) => {
    ctx.fillStyle = c;
    const off = jogOffset(t, speed);
    for (let x = 0; x < 320; x++) ctx.fillRect(x, base - Math.round(Math.sin((x + off) / period) * amp + Math.sin((x + off) / (period * 0.43)) * amp * 0.4), 1, 160);
  };
  hill('#7aa8c8', 104, 14, 8, 30);
  hill('#5a9a52', 118, 10, 22, 20);
  rect(ctx, '#6cb85a', 0, 138, 320, 22);
  for (let i = 0; i < 9; i++) { // trees
    const x = 320 - ((jogOffset(t, 70) + i * 61) % 380) + 30 - 30;
    rect(ctx, '#6a4426', x + 6, 108, 5, 34); rect(ctx, '#2f7a3e', x, 90, 17, 24); rect(ctx, '#3f9a4e', x + 3, 84, 11, 12);
  }
  rect(ctx, '#d8c08a', 0, 160, 320, 80);
  rect(ctx, '#c4a874', 0, 160, 320, 3);
  for (let i = 0; i < 12; i++) rect(ctx, '#f3e4b8', 320 - ((jogOffset(t, 120) + i * 40) % 480) + 40 - 40, 196, 22, 3); // lane dashes
  // runner
  const f = Math.floor(t * 8) % 4, bob = f % 2;
  const rx = 90 + Math.round(Math.min(1, progress) * 40), ry = 142 - bob * 2;
  rect(ctx, 'rgba(40,40,60,0.35)', rx - 1, 183, 20, 3);
  rect(ctx, '#3a6ea5', rx + 3, ry + 10, 11, 14);
  rect(ctx, '#f0c8a0', rx + 5, ry + 1, 8, 9); rect(ctx, '#4a3426', rx + 4, ry, 10, 4); rect(ctx, '#1d2340', rx + 11, ry + 5, 1, 2);
  rect(ctx, '#f6ecd2', rx + 3, ry + 9, 11, 2); // headband / collar
  const sw = [[-3, 3], [3, -3], [-4, 4], [4, -4]][f];
  rect(ctx, '#f0c8a0', rx + 8 + sw[0], ry + 13, 3, 6); // arms
  rect(ctx, '#2b3560', rx + 4 + sw[0], ry + 24, 4, 8 - bob); rect(ctx, '#2b3560', rx + 9 + sw[1], ry + 24, 4, 8 - (1 - bob));
  rect(ctx, '#f6ecd2', rx + 3 + sw[0], ry + 31, 6, 2); rect(ctx, '#f6ecd2', rx + 8 + sw[1], ry + 31, 6, 2);
  for (let i = 0; i < 3; i++) rect(ctx, 'rgba(230,220,190,0.7)', rx - 4 - i * 5 - ((t * 20) % 5), 180 - i, 2, 1); // dust
  tint(ctx, minute, 0.8);
}

/** Nap: a dim room with a cot, the player asleep and floating Z's. */
export function drawNap(ctx, { t = 0 } = {}) {
  rect(ctx, '#3a3560', 0, 0, 320, 240); rect(ctx, '#2e2a50', 0, 150, 320, 90);
  rect(ctx, '#7a4f2e', 220, 30, 70, 52); rect(ctx, '#1d2748', 224, 34, 62, 44); rect(ctx, '#fff7de', 272, 42, 6, 6);
  rect(ctx, '#7a4f2e', 254, 34, 2, 44);
  rect(ctx, '#5a3a22', 60, 128, 200, 10); rect(ctx, '#5a3a22', 60, 138, 8, 30); rect(ctx, '#5a3a22', 252, 138, 8, 30);
  rect(ctx, '#7a8ac8', 68, 112, 184, 20); rect(ctx, '#e8e0f0', 68, 106, 40, 12);
  rect(ctx, '#f0c8a0', 76, 102, 22, 12); rect(ctx, '#4a3426', 74, 100, 24, 6);
  rect(ctx, '#5a6aa8', 108, 108, 144, 24); rect(ctx, '#6a7ab8', 108, 108, 144, 4);
  for (let i = 0; i < 3; i++) {
    const k = ((t * 0.5 + i / 3) % 1);
    drawText(ctx, 'z', 104 + k * 26 + i * 4, 92 - k * 40, { color: '#e8e0f0', shadow: null, scale: 1 + (i % 2), alpha: Math.min(1, (1 - k) * 2) });
  }
  const breathe = Math.sin(t * 2) * 1;
  rect(ctx, '#4a5a98', 140, 106 + breathe, 40, 3);
  rect(ctx, 'rgba(10,12,40,0.35)', 0, 0, 320, 240); // dim
}

// ------------------------------------------------------------------ scenes
class FreeTimeScene extends AcademicScene {
  constructor(game, params, kind) {
    super(game, params);
    this.kind = kind;
    this.res = null;
    this.animLen = 3;
  }
  enter() { this.minute0 = this.state.time.minute; this.begin(); }
  begin() { this.guard(); }
  /** Guard failure: show the line, then pop an empty result. */
  fail(res) {
    this.guardText = guardLine(this.kind, res);
    this.sfx('error');
    this.setMode('guard');
  }
  guard() { this.start(); }
  start() { this.setMode('anim'); this.sfx(this.kind === 'nap' ? 'sleep' : 'confirm'); }
  apply() { return { ok: false }; }
  run() {
    const r = this.apply();
    if (!r.ok) { this.fail(r); return; }
    this.res = r;
    this.sfx('success');
    this.setMode('result');
  }
  popEmpty() { this.finish({ minutes: 0, energy: 0, gains: {} }); }
  step(dt, input) {
    if (this.mode === 'anim') {
      if (this.mt > this.animLen || (this.mt > 0.6 && input.pressed('confirm'))) this.run();
    } else if (this.mode === 'guard') {
      if (this.mt > 0.3 && (input.pressed('confirm') || input.pressed('cancel'))) this.popEmpty();
    } else if (this.mode === 'result') {
      if (this.mt > 0.5 && (input.pressed('confirm') || input.pressed('cancel'))) {
        const r = this.res;
        this.advanceClock(r.minutes);
        this.finish({ minutes: r.minutes, energy: r.energy, gains: r.gains || {} });
      }
    } else this.tickWidget(dt, input);
  }
  progress() { return Math.min(1, this.mt / this.animLen); }
  clockNow() { return this.minute0 + (this.mode === 'anim' ? this.progress() * (this.minutes || 60) : 0); }
  drawBack() {}
  draw(ui) {
    const ctx = ui.ctx;
    this.drawBack(ctx);
    if (this.widget) this.widget.draw(ctx);
    if (this.mode === 'anim') {
      const label = this.animLabel || '';
      drawWindow(ctx, 70, 6, 180, 30, 'tooltip');
      drawText(ctx, label, 160, 12, { color: THEME.cream, shadow: THEME.navyDeep, align: 'center' });
      drawText(ctx, clockLabel(this.clockNow()), 160, 23, { color: THEME.gold, shadow: THEME.navyDeep, align: 'center' });
    }
    if (this.mode === 'guard') {
      ctx.fillStyle = 'rgba(12,14,34,0.45)'; ctx.fillRect(0, 0, 320, 240);
      drawCard(ctx, { x: 40, y: 80, w: 240, title: this.title, lines: [{ text: this.guardText, color: '#ffffff' }], t: this.t });
    }
    if (this.mode === 'result') {
      ctx.fillStyle = 'rgba(12,14,34,0.45)'; ctx.fillRect(0, 0, 320, 240);
      drawCard(ctx, { x: 40, y: 50, w: 240, title: this.title, lines: restLines(this.kind, this.res), t: this.t });
    }
  }
}

export class RestScene extends FreeTimeScene {
  constructor(game, params = {}) { super(game, params, 'rest'); this.title = 'Rest'; this.animLabel = 'Sitting on the bench...'; this.minutes = 30; }
  begin() {
    const p = this.state.player;
    if (p.energy >= p.maxEnergy) { this.fail({ reason: 'already_rested' }); return; }
    const per = (this.sim.balance && this.sim.balance.energy.benchRestPer30) || 10;
    const items = restOptions(p.energy, p.maxEnergy, per).map((o) => ({ label: `${o.minutes} minutes`, value: `+${o.gain} energy`, minutes: o.minutes }));
    this.setMode('choose');
    this.ask(new ListMenu({ services: this.services, items, x: 10, y: 150, w: 150, rows: 2, title: 'Sit for how long?', cancellable: true }), (r) => {
      if (!r) { this.popEmpty(); return; }
      this.minutes = r.item.minutes;
      this.animLen = 2.2 + this.minutes / 30 * 0.8;
      this.start();
    });
  }
  apply() { return rest(this.state, { minutes: this.minutes }, { advanceClock: false }); }
  drawBack(ctx) {
    drawBench(ctx, { t: this.t, minute: this.clockNow() });
    if (this.mode === 'choose') {
      const p = this.state.player;
      drawWindow(ctx, 170, 150, 140, 40, 'menu');
      drawText(ctx, 'Energy', 180, 158, { color: THEME.gold, shadow: THEME.navyDeep });
      drawBar(ctx, 180, 170, 120, 8, p.energy, p.maxEnergy, { fill: THEME.green });
      drawText(ctx, `${Math.round(p.energy)} / ${p.maxEnergy}`, 180, 180, { color: THEME.cream, shadow: THEME.navyDeep });
    }
  }
}

export class NapScene extends FreeTimeScene {
  constructor(game, params = {}) { super(game, params, 'nap'); this.title = 'Nap'; this.animLabel = 'Zzz...'; this.minutes = NAP.minutes; this.animLen = 3.2; }
  guard() { const c = canNap(this.state); if (!c.ok) this.fail(c); else this.start(); }
  apply() { return nap(this.state, { advanceClock: false }); }
  drawBack(ctx) { drawNap(ctx, { t: this.t }); }
}

export class JogScene extends FreeTimeScene {
  constructor(game, params = {}) { super(game, params, 'jog'); this.title = 'Jog'; this.animLabel = 'Jogging around the park...'; this.minutes = JOG.minutes; this.animLen = 3.4; }
  guard() { const c = canJog(this.state); if (!c.ok) this.fail(c); else this.start(); }
  apply() { return jog(this.state, { advanceClock: false }); }
  drawBack(ctx) {
    drawJog(ctx, { t: this.t, minute: this.clockNow(), progress: this.mode === 'anim' ? this.progress() : this.mode === 'result' ? 1 : 0 });
    if (this.mode === 'anim') drawBar(ctx, 100, 220, 120, 6, this.progress(), 1, { fill: THEME.gold });
  }
}
