// credits: scrolling credits (TextPage) -> stats screen -> back to the title. Params { endingId? }. Returns { toTitle: true }.
import { TextPage, drawText, drawWindow, THEME } from '../../ui/index.js';
import { MenuScene, drawBands, drawHints, music, goToTitle, saveApi } from './common.js';
import { hasScene } from '../registry.js';
import { CREDITS, buildStats } from './data.js';

const SKY = ['#0a0e24', '#10163a', '#18224a', '#222f5c', '#2e3d70', '#3a4a80'];
const STARS = Array.from({ length: 36 }, (_, i) => ({ x: (i * 89 + 11) % 316 + 2, y: (i * 47 + 5) % 200 + 4, p: i % 5 }));

export class CreditsScene extends MenuScene {
  constructor(game, params = {}) {
    super(game, params);
    this.mode = 'roll';
    this.page = new TextPage({ services: this.services, lines: CREDITS, speed: 20, top: 6, bottom: 234 });
    let meta = {};
    try { meta = saveApi(game).meta(); } catch { /* optional */ }
    this.stats = buildStats(game.sim.state, meta);
  }
  enter() { music(this.game, 'credits', 1000); }
  finish() {
    // With a registered 'title' the whole stack is replaced by it; otherwise just pop with { toTitle: true }.
    if (hasScene('title')) goToTitle(this.game);
    else this.game.scenes.pop({ toTitle: true });
  }
  update(dt, input) {
    this.t += dt;
    if (this.mode === 'roll') {
      this.page.update(dt, input);
      if (this.page.done) { this.mode = 'stats'; this.t = 0; }
    } else if (this.t > 0.5 && (input.pressed('confirm') || input.pressed('cancel'))) { this.sfx('confirm'); this.finish(); }
  }
  draw(ui) {
    const ctx = ui.ctx;
    drawBands(ctx, SKY);
    STARS.forEach((s) => { ctx.fillStyle = Math.sin(this.t * 2 + s.p) > 0 ? '#ffffff' : '#6b7090'; ctx.fillRect(s.x, s.y, 1, 1); });
    ctx.fillStyle = '#0c1228'; ctx.fillRect(0, 214, 320, 26);
    if (this.mode === 'roll') { this.page.draw(ctx); return; }
    drawWindow(ctx, 40, 20, 240, 190, 'menu');
    drawText(ctx, 'Your Three Years', 160, 30, { color: THEME.gold, shadow: THEME.navyDeep, align: 'center', scale: 2 });
    this.stats.forEach(([k, v], i) => {
      const y = 62 + i * 18;
      drawText(ctx, k, 62, y, { color: '#cfd3ec', shadow: THEME.navyDeep });
      drawText(ctx, v, 258, y, { color: '#ffffff', shadow: THEME.navyDeep, align: 'right' });
      ctx.fillStyle = '#3a4678'; ctx.fillRect(60, y + 11, 200, 1);
    });
    drawText(ctx, 'Thank you for playing!', 160, 192, { color: THEME.gold, shadow: THEME.navyDeep, align: 'center' });
    drawHints(this.game, ctx, 'Confirm: return to title');
  }
}
