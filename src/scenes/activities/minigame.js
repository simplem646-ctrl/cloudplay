// Base class for full-screen mini-games: intro (controls) -> 3-2-1 countdown -> play -> result (medal) -> pop({score, rank}).
// Subclasses set `title`, `controls[]`, implement `startPlay()`, `playUpdate(dt, input)`, `playDraw(ctx)` and call `this.end(score, extra)`.
// Scenes paint an OPAQUE full-screen background (the UI canvas is alpha-blended over the world layer).
import { Scene } from '../../engine/scenes.js';
import { drawText, drawWindow, THEME, drawPrompt } from '../../ui/index.js';
import { rankFor, RANK_COMMENT } from './logic.js';

export const MEDAL = { gold: '#f2b84b', silver: '#c8d0dc', bronze: '#c9783a', none: '#6b7090' };

/** 24px pixel disc medal with a ribbon. */
export function drawMedal(ctx, cx, cy, rank, t = 0) {
  const r = 12, col = MEDAL[rank] || MEDAL.none;
  ctx.fillStyle = rank === 'none' ? '#4a4f6e' : '#d0443a';
  ctx.fillRect(cx - 7, cy - r - 10, 5, 12); ctx.fillRect(cx + 2, cy - r - 10, 5, 12);
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y));
    ctx.fillStyle = '#1d2340'; ctx.fillRect(cx - w - 1, cy + y, 2 * w + 2, 1);
    ctx.fillStyle = col; ctx.fillRect(cx - w, cy + y, 2 * w, 1);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(cx - 7, cy - 6, 3, 3); ctx.fillRect(cx - 5, cy - 8, 4, 2);
  if (rank !== 'none') drawText(ctx, '★', cx, cy - 4, { color: '#fff7de', shadow: null, align: 'center' });
  else drawText(ctx, '×', cx, cy - 4, { color: '#9a9fb5', shadow: null, align: 'center' });
  if (rank === 'gold') { const s = Math.floor(t * 6) % 3; ctx.fillStyle = '#ffffff'; ctx.fillRect(cx + 10 + s, cy - 12 - s, 1, 3); ctx.fillRect(cx + 9 + s, cy - 11 - s, 3, 1); }
}

export class MiniGame extends Scene {
  constructor(game, params = {}) {
    super(game);
    this.params = params;
    this.id = 'minigame';
    this.title = 'Mini-game';
    this.controls = [];
    this.mode = 'intro';
    this.t = 0; // time in the current mode
    this.result = null;
    this.rngSeed = params.seed ?? ((Date.now() % 100000) + 1);
  }
  get difficulty() { return this.params.difficulty ?? 0.45; }
  sfx(name) { try { this.game.audio && this.game.audio.sfx && this.game.audio.sfx(name); } catch { /* optional */ } }
  setMode(m) { this.mode = m; this.t = 0; }
  enter() { this.setMode('intro'); }

  // ---- subclass hooks ----
  startPlay() {}
  playUpdate() {}
  playDraw() {}
  drawBackground(ctx) { ctx.fillStyle = '#2b3560'; ctx.fillRect(0, 0, 320, 240); }

  end(score, extra = {}) {
    const rank = rankFor(score);
    this.result = { score, rank, minigame: this.id, context: this.params.context, ...extra };
    this.comment = RANK_COMMENT[rank][Math.floor(Math.abs(Math.sin(this.rngSeed)) * 3) % 3];
    this.setMode('result');
    this.sfx(rank === 'none' ? 'fail' : 'success');
  }

  update(dt, input) {
    this.t += dt;
    if (this.mode === 'intro') {
      if (input.pressed('confirm')) { this.sfx('confirm'); this.setMode('count'); this.lastCount = 4; }
      else if (input.pressed('cancel')) { this.game.scenes.pop({ score: 0, rank: 'none', minigame: this.id, cancelled: true }); }
    } else if (this.mode === 'count') {
      const n = 3 - Math.floor(this.t / 0.75);
      if (n !== this.lastCount) { this.lastCount = n; if (n >= 1) this.sfx('cursor'); else this.sfx('whistle'); }
      if (this.t >= 3.2) { this.startPlay(); this.setMode('play'); }
    } else if (this.mode === 'play') this.playUpdate(dt, input);
    else if (this.mode === 'result' && this.t > 0.6 && (input.pressed('confirm') || input.pressed('cancel'))) {
      this.sfx('confirm');
      this.game.scenes.pop(this.result);
    }
  }

  draw(ui) {
    const ctx = ui.ctx;
    this.drawBackground(ctx);
    if (this.mode === 'play' || this.mode === 'count') this.playDraw(ctx);
    if (this.mode === 'intro') this.drawIntro(ctx);
    else if (this.mode === 'count') {
      const n = 3 - Math.floor(this.t / 0.75);
      const frac = (this.t % 0.75) / 0.75;
      drawText(ctx, n >= 1 ? String(n) : 'GO!', 160, 92 - Math.round(frac * 6), { color: n >= 1 ? '#ffffff' : THEME.gold, shadow: '#141a33', align: 'center', scale: 5, alpha: 1 - frac * 0.4 });
    } else if (this.mode === 'result') this.drawResult(ctx);
  }

  drawIntro(ctx) {
    drawWindow(ctx, 36, 36, 248, 168, 'menu');
    drawText(ctx, this.title, 160, 48, { color: THEME.gold, shadow: '#141a33', align: 'center', scale: 2 });
    this.controls.forEach((c, i) => drawText(ctx, c, 160, 84 + i * 14, { color: '#ffffff', shadow: '#141a33', align: 'center' }));
    drawText(ctx, 'Press Z / Enter to start', 160, 178, { color: THEME.cream, shadow: '#141a33', align: 'center' });
    drawPrompt(ctx, 154, 190, this.t);
  }

  drawResult(ctx) {
    const r = this.result;
    const k = Math.min(1, this.t / 0.5);
    ctx.fillStyle = `rgba(12,14,34,${0.78 * k})`; ctx.fillRect(0, 0, 320, 240);
    drawWindow(ctx, 70, 40, 180, 160, 'menu');
    drawText(ctx, 'RESULT', 160, 50, { color: THEME.gold, shadow: '#141a33', align: 'center', scale: 2 });
    drawMedal(ctx, 160, 108, r.rank, this.t);
    drawText(ctx, `Score  ${r.score}`, 160, 134, { color: '#ffffff', shadow: '#141a33', align: 'center', scale: 2 });
    drawText(ctx, r.detail || '', 160, 156, { color: THEME.cream, shadow: '#141a33', align: 'center' });
    drawText(ctx, this.comment || '', 160, 170, { color: THEME.gold, shadow: '#141a33', align: 'center' });
    if (this.t > 0.6) drawText(ctx, 'Press Z to continue', 160, 186, { color: '#ffffff', shadow: '#141a33', align: 'center' });
  }
}
