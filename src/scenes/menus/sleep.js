// Sleep: day summary card -> night transition (moon, stars) -> new-day banner. Params { summary } from sim.clock.sleep;
// optional { before } (a takeSnapshot() from the morning) else the day ledger. Returns {}.
import { drawText, drawWindow, drawHeartsRow, THEME, wrapText, LINE_H } from '../../ui/index.js';
import { getEvent } from '../../sim/events.js';
import { MenuScene, drawPortrait, drawBands, drawHints, music } from './common.js';
import { takeSnapshot, diffSnapshots, buildSleepCard } from './data.js';

/** Idempotent: keeps a start-of-day snapshot on game.menus (call at boot / after load). `time:day` rotates it. */
export function startDayTracking(game) {
  if (!game.sim || !game.bus) return null;
  const m = (game.menus ||= {});
  if (m.tracking) return m;
  m.tracking = true;
  m.current = takeSnapshot(game.sim.state);
  game.bus.on('time:day', () => { m.finished = m.current; m.current = takeSnapshot(game.sim.state); });
  return m;
}

const NIGHT = ['#0a0e24', '#0e1330', '#121a3c', '#18224a', '#1e2c58', '#26366a'];
const DAWN = ['#2b3a78', '#52568f', '#8a6a9a', '#d58a8a', '#f0b27a', '#f8d89a'];
const STARS = Array.from({ length: 40 }, (_, i) => ({ x: (i * 97 + 13) % 316 + 2, y: (i * 53 + 7) % 130 + 4, p: (i % 7) * 0.9 }));

export class SleepScene extends MenuScene {
  constructor(game, params = {}) {
    super(game, params);
    const summary = params.summary || { from: null, date: { season: 'spring', day: 1, absDay: 0 } };
    const m = game.menus || {};
    const before = params.before || m.finished || null;
    const after = takeSnapshot(game.sim.state);
    const diff = diffSnapshots(before, after, { isMet: (id) => game.sim.state.relationships[id] && game.sim.state.relationships[id].met });
    this.card = buildSleepCard(summary, diff, { titleOf: (id) => { const e = getEvent(id); return (e && (e.title || e.name)) || id.replace(/_/g, ' '); } });
    this.mode = 'card';
    this.mt = 0;
  }
  enter() { music(this.game, 'home_morning', 700); }
  setMode(m) { this.mode = m; this.mt = 0; }
  update(dt, input) {
    this.t += dt; this.mt += dt;
    const ok = input.pressed('confirm') || input.pressed('cancel');
    if (this.mode === 'card' && ok && this.mt > 0.3) { this.sfx('confirm'); if (this.card.gameEnd) this.game.scenes.pop({}); else { this.setMode('night'); music(this.game, 'town_night', 1200); } }
    else if (this.mode === 'night' && (this.mt > 3.6 || (ok && this.mt > 0.8))) this.setMode('banner');
    else if (this.mode === 'banner' && (this.mt > 3 || (ok && this.mt > 0.7))) this.game.scenes.pop({});
  }
  draw(ui) {
    const ctx = ui.ctx;
    if (this.mode === 'card') return this.drawCard(ctx);
    if (this.mode === 'night') return this.drawNight(ctx);
    this.drawBanner(ctx);
  }
  drawCard(ctx) {
    const c = this.card;
    drawBands(ctx, NIGHT);
    drawWindow(ctx, 12, 8, 296, 214, 'menu');
    drawText(ctx, c.title, 160, 16, { color: THEME.gold, shadow: THEME.navyDeep, align: 'center', scale: 2 });
    drawText(ctx, c.forced ? 'You collapsed into bed.' : 'Another day in Bellhaven is done.', 160, 36, { color: '#cfd3ec', shadow: THEME.navyDeep, align: 'center' });
    ctx.fillStyle = '#4a5896'; ctx.fillRect(20, 48, 280, 1);
    // left column: money + subjects
    const mv = c.money, mc = mv > 0 ? '#7fd36a' : mv < 0 ? '#e8645a' : '#cfd3ec';
    drawText(ctx, 'Money', 22, 54, { color: '#9aa4d0', shadow: THEME.navyDeep });
    drawText(ctx, `${mv >= 0 ? '+' : '-'}$${Math.abs(mv)}`, 130, 54, { color: mc, shadow: THEME.navyDeep, align: 'right' });
    drawText(ctx, 'Studied', 22, 68, { color: '#9aa4d0', shadow: THEME.navyDeep });
    if (!c.subjects.length) drawText(ctx, 'nothing new', 22, 80, { color: '#6b7090', shadow: THEME.navyDeep });
    c.subjects.slice(0, 4).forEach((s, i) => drawText(ctx, `${s.label} +${s.delta}`, 22, 80 + i * 11, { color: '#7fd36a', shadow: THEME.navyDeep }));
    drawText(ctx, 'Events', 22, 128, { color: '#9aa4d0', shadow: THEME.navyDeep });
    if (!c.events.length) drawText(ctx, 'a quiet day', 22, 140, { color: '#6b7090', shadow: THEME.navyDeep });
    c.events.slice(0, 3).forEach((e, i) => drawText(ctx, wrapText(e.title, 118)[0], 22, 140 + i * 11, { color: '#ffffff', shadow: THEME.navyDeep }));
    ctx.fillStyle = '#4a5896'; ctx.fillRect(150, 54, 1, 100);
    // right column: hearts
    drawText(ctx, 'Friends', 158, 54, { color: '#9aa4d0', shadow: THEME.navyDeep });
    if (!c.hearts.length) drawText(ctx, 'no one new today', 158, 68, { color: '#6b7090', shadow: THEME.navyDeep });
    c.hearts.slice(0, 4).forEach((h, i) => {
      const y = 66 + i * 22;
      drawPortrait(this.game, ctx, h.id, 158, y, 20, 'happy');
      drawText(ctx, `${h.name} ${h.delta > 0 ? '+' : ''}${h.delta}`, 182, y + 1, { color: h.delta > 0 ? '#f4a6c8' : '#e8645a', shadow: THEME.navyDeep });
      drawHeartsRow(ctx, 182, y + 11, { points: h.to });
    });
    if (c.hearts.length > 4) drawText(ctx, `+${c.hearts.length - 4} more`, 300, 158, { color: '#9aa4d0', shadow: THEME.navyDeep, align: 'right' });
    // tomorrow
    ctx.fillStyle = '#4a5896'; ctx.fillRect(20, 168, 280, 1);
    drawText(ctx, 'Tomorrow', 22, 174, { color: THEME.gold, shadow: THEME.navyDeep });
    drawText(ctx, c.weatherLabel || '-', 298, 174, { color: '#7fb4ff', shadow: THEME.navyDeep, align: 'right' });
    if (c.energyPct !== null) drawText(ctx, `Rested ${Math.round(c.energyPct * (c.energyPct <= 1 ? 100 : 1))}%`, 160, 174, { color: '#cfd3ec', shadow: THEME.navyDeep, align: 'center' });
    const notes = c.notices.length ? c.notices : [{ kind: 'none', text: 'No special plans.' }];
    notes.slice(0, 3).forEach((n, i) => drawText(ctx, `${n.kind === 'none' ? '' : '* '}${n.text}`, 22, 187 + i * LINE_H, { color: n.kind === 'exam' ? '#e8645a' : n.kind === 'festival' ? THEME.gold : '#ffffff', shadow: THEME.navyDeep }));
    drawHints(this.game, ctx, 'Confirm: go to sleep');
  }
  drawNight(ctx) {
    const t = this.mt, fade = Math.min(1, t / 0.6);
    drawBands(ctx, NIGHT);
    for (const s of STARS) {
      const tw = Math.sin(this.t * 2 + s.p) > 0.2;
      ctx.fillStyle = tw ? '#ffffff' : '#7f8ab8'; ctx.fillRect(s.x, s.y, 1, 1);
      if (tw && s.p > 4) { ctx.fillRect(s.x - 1, s.y, 3, 1); ctx.fillRect(s.x, s.y - 1, 1, 3); }
    }
    // moon arcing up
    const mx = 70 + t * 38, my = 96 - Math.sin(Math.min(1, t / 3.6) * Math.PI * 0.6) * 62;
    for (let y = -14; y <= 14; y++) { const w = Math.floor(Math.sqrt(196 - y * y)); ctx.fillStyle = '#f6ecd2'; ctx.fillRect(Math.round(mx - w), Math.round(my + y), w * 2, 1); }
    for (let y = -12; y <= 12; y++) { const w = Math.floor(Math.sqrt(144 - y * y)); ctx.fillStyle = NIGHT[1]; ctx.fillRect(Math.round(mx - w + 8), Math.round(my + y - 3), w * 2, 1); }
    // shooting star
    const sp = (t % 2.4) / 0.5;
    if (sp < 1) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(250 - sp * 90), Math.round(20 + sp * 40), 2, 1); ctx.fillStyle = '#9aa4d0'; ctx.fillRect(Math.round(252 - sp * 90), Math.round(19 + sp * 40), 6, 1); }
    // hills + house
    ctx.fillStyle = '#0c1228'; ctx.fillRect(0, 170, 320, 70);
    for (let x = 0; x < 320; x += 2) ctx.fillRect(x, 160 + Math.round(Math.sin(x / 40) * 6), 2, 12);
    ctx.fillStyle = '#080c1c'; ctx.fillRect(130, 168, 60, 40); ctx.fillRect(124, 160, 72, 8); ctx.fillRect(134, 152, 52, 8);
    const lit = t < 1.8;
    ctx.fillStyle = lit ? '#f2b84b' : '#1a2040'; ctx.fillRect(150, 178, 10, 10); ctx.fillRect(170, 178, 10, 10);
    ctx.fillStyle = '#080c1c'; ctx.fillRect(154, 178, 1, 10); ctx.fillRect(174, 178, 1, 10);
    const z = Math.floor(this.t * 1.5) % 3;
    for (let i = 0; i <= z; i++) drawText(ctx, 'z', 170 + i * 6, 170 - i * 7 - (this.t * 4 % 4), { color: '#cfd3ec', shadow: null });
    drawText(ctx, 'Good night...', 160, 214, { color: '#cfd3ec', shadow: THEME.navyDeep, align: 'center' });
    ctx.fillStyle = `rgba(0,0,0,${1 - fade})`; ctx.fillRect(0, 0, 320, 240);
  }
  drawBanner(ctx) {
    const t = this.mt, b = this.card.banner || { text: 'A new day', sub: '' };
    const k = Math.min(1, t / 1.2);
    drawBands(ctx, DAWN);
    ctx.fillStyle = '#f8e8a0'; const sy = 160 - k * 60;
    for (let y = -12; y <= 12; y++) { const w = Math.floor(Math.sqrt(144 - y * y)); ctx.fillRect(Math.round(160 - w), Math.round(sy + y), w * 2, 1); }
    ctx.fillStyle = '#3a3a6a'; ctx.fillRect(0, 170, 320, 70);
    for (let x = 0; x < 320; x += 2) ctx.fillRect(x, 160 + Math.round(Math.sin(x / 40 + 1) * 6), 2, 12);
    const a = Math.min(1, Math.max(0, (t - 0.5) / 0.6));
    ctx.fillStyle = `rgba(12,14,34,${0.8 * a})`; ctx.fillRect(0, 88, 320, 56);
    ctx.fillStyle = `rgba(242,184,75,${a})`; ctx.fillRect(0, 88, 320, 1); ctx.fillRect(0, 143, 320, 1);
    ctx.globalAlpha = a;
    drawText(ctx, b.text, 160, 96, { color: THEME.cream, shadow: THEME.navyDeep, align: 'center', scale: 2 });
    drawText(ctx, b.sub, 160, 124, { color: THEME.gold, shadow: THEME.navyDeep, align: 'center' });
    ctx.globalAlpha = 1;
  }
}
