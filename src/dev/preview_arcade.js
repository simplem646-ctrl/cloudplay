// "Bellhaven Days: Preview Build": a small launcher used for the EARLY Artifact preview. It runs on the real engine, UI toolkit,
// audio engine and the three mini-games, so it exercises the whole publishing path before the full game is assembled.
// Build: node scripts/build.mjs --entry src/dev/preview_arcade.js --out dist/preview.html --artifact --title "Bellhaven Days"
import { createApp, Scene } from '../engine/index.js';
import { UICanvas, ListMenu, drawText, drawWindow, THEME } from '../ui/index.js';
import { audio } from '../audio/index.js';
import { registerActivityScenes } from '../scenes/activities/index.js';
import { openScene } from '../scenes/registry.js';

const GAMES = [
  { id: 'minigame:track_sprint', label: '100 m Dash', value: 'Track Club', desc: 'Alternate LEFT and RIGHT to race. Do not jump the gun!' },
  { id: 'minigame:music_rhythm', label: 'Rhythm Practice', value: 'Music Club', desc: 'Hit the arrow keys as the notes reach the line.' },
  { id: 'minigame:cafe_serve', label: 'Cafe Rush', value: 'Part-time job', desc: 'Serve the right order before patience runs out.' },
];
const MEDAL_TEXT = { gold: '{y}Gold', silver: '{k}Silver', bronze: '{#c9783a}Bronze', none: '{k}No medal' };

class PreviewMenu extends Scene {
  enter() { this.t = 0; this.last = null; this.index = 0; this.busy = false; this.build(); audio.music('title'); }
  build() {
    this.menu = new ListMenu({ services: this.game.ui.services, x: 58, y: 118, w: 204, rows: 3, cursor: this.index, cancellable: false, descBox: true, descH: 32,
      items: GAMES.map((g) => ({ label: g.label, value: g.value, desc: g.desc })) });
  }
  resume() { audio.music('title'); }
  async launch(i) {
    this.busy = true; this.index = i;
    audio.music(null, { fadeMs: 300 });
    const r = await openScene(this.game, GAMES[i].id, { context: 'festival', difficulty: 0.5, fitness: 40 });
    if (r && !r.cancelled) this.last = { game: GAMES[i].label, ...r };
    this.build(); this.busy = false; audio.music('title');
  }
  update(dt, input) {
    this.t += dt;
    if (this.busy) return;
    this.menu.update(dt, input);
    if (this.menu.done) { const i = this.menu.result ? this.menu.result.index : this.index; this.menu.done = false; this.launch(i); }
    else this.index = this.menu.cursor;
  }
  draw(ui) {
    const ctx = ui.ctx;
    const bands = ['#1d2340', '#262e5a', '#34407a', '#5a5a9a', '#9a6aa0', '#e0889a', '#f4b47a'];
    bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * 18, 320, 19); });
    for (let i = 0; i < 40; i++) { const x = (i * 97) % 320, y = (i * 53) % 70; if ((i + Math.floor(this.t * 2)) % 7) { ctx.fillStyle = '#fff7de'; ctx.fillRect(x, y, 1, 1); } }
    const disc = (cx, cy, r, colorAt) => { for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); ctx.fillStyle = colorAt(cy + y); ctx.fillRect(cx - w, cy + y, 2 * w, 1); } };
    disc(24, 22, 9, () => '#fff7de'); disc(29, 19, 8, (y) => bands[Math.min(bands.length - 1, Math.floor(y / 18))]); // crescent moon
    ctx.fillStyle = '#2f5a3a'; ctx.fillRect(0, 100, 320, 140);
    for (let x = 0; x < 320; x += 2) { const h = Math.round(18 + Math.sin(x / 38) * 8 + Math.sin(x / 15) * 3); ctx.fillStyle = '#3f8f3a'; ctx.fillRect(x, 108 - h + 14, 2, h); }
    const sx = 240; // school group x offset
    ctx.fillStyle = '#b5503c'; ctx.fillRect(sx, 84, 52, 22); ctx.fillStyle = '#4b5a78'; ctx.fillRect(sx - 4, 78, 60, 8); // school
    ctx.fillStyle = '#cdb27a'; ctx.fillRect(sx + 18, 56, 14, 30); ctx.fillStyle = '#4b5a78'; ctx.fillRect(sx + 16, 52, 18, 6); ctx.fillStyle = '#f2b84b'; ctx.fillRect(sx + 22, 62, 6, 8); // bell tower
    ctx.fillStyle = '#f2b84b'; for (let i = 0; i < 4; i++) ctx.fillRect(sx + 4 + i * 12, 92, 4, 5);
    drawText(ctx, 'Bellhaven Days', 160, 22, { color: THEME.gold, shadow: '#141a33', align: 'center', scale: 3 });
    drawText(ctx, 'Preview Build', 160, 54, { color: THEME.cream, shadow: '#141a33', align: 'center', scale: 1 });
    drawText(ctx, 'Mini-game sampler', 160, 68, { color: '#fff7de', shadow: '#141a33', align: 'center' });
    drawWindow(ctx, 58, 106 - 0, 204, 12, 'dim');
    drawText(ctx, 'Pick an activity', 160, 108, { color: '#ffffff', shadow: '#141a33', align: 'center' });
    this.menu.draw(ctx);
    if (this.last) {
      drawWindow(ctx, 58, 200, 204, 18, 'menu');
      drawText(ctx, `Last: ${this.last.game} - ${MEDAL_TEXT[this.last.rank]}{/}  (score ${this.last.score})`, 160, 205, { color: '#ffffff', shadow: '#141a33', align: 'center' });
    }
    drawText(ctx, 'Arrows move   Z / Enter confirm   X back', 160, 226, { color: '#fff7de', shadow: '#141a33', align: 'center' });
  }
}

const ui = new UICanvas();
const app = createApp({ container: document.getElementById('app'), ui });
app.game.audio = audio;
registerActivityScenes();
const unlock = () => { audio.init(); audio.music('title'); };
['keydown', 'pointerdown', 'touchstart'].forEach((e) => addEventListener(e, unlock, { once: false, passive: true }));
addEventListener('pointerdown', () => window.focus());
app.game.scenes.push(new PreviewMenu(app.game));
window.__preview = { app };
