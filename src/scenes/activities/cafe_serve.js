// minigame:cafe_serve - customers order drinks and treats; press the arrow that matches before their patience runs out.
import { drawText, drawBar, drawWindow, drawIconSafe, THEME } from '../../ui/index.js';
import { MiniGame } from './minigame.js';
import { CAFE_ITEMS, CAFE, makeOrders, cafeScore } from './logic.js';

const SEATS = [26, 94, 162, 230];
const KEY_ACTION = ['left', 'down', 'up', 'right']; // item index -> arrow
const ARROW = ['◄', '▼', '▲', '►'];
const FACE = ['#f6cfa8', '#e8b890', '#d9a073', '#f8d2b4'], HAIR = ['#5b3a29', '#2a2332', '#b8562a', '#e3b95a', '#8d8d99'];

export class CafeServe extends MiniGame {
  constructor(game, params) {
    super(game, params);
    this.id = 'cafe_serve';
    this.title = 'Cafe Rush';
    this.controls = ['Customers want a coffee, tea, cake', 'or sandwich: press the matching arrow', 'before their patience runs out!', 'Left coffee, Down tea,', 'Up cake, Right sandwich.'];
    this.limit = params.seconds ?? CAFE.seconds; this.clock = 0; this.seats = null; this.served = []; this.combo = 0; this.pop = []; this.pressFlash = [0, 0, 0, 0];
  }
  startPlay() {
    this.orders = makeOrders({ seed: this.rngSeed, difficulty: this.difficulty, seconds: this.params.seconds ?? CAFE.seconds });
    this.limit = this.params.seconds ?? CAFE.seconds;
    this.clock = 0; this.next = 0;
    this.seats = [null, null, null, null];
    this.served = []; this.spawned = 0; this.mistakes = 0; this.walkedOut = 0; this.combo = 0;
    this.pop = []; // floating texts
    this.pressFlash = [0, 0, 0, 0];
  }
  playUpdate(dt, input) {
    this.clock += dt;
    this.pressFlash = this.pressFlash.map((f) => Math.max(0, f - dt * 5));
    while (this.next < this.orders.length && this.orders[this.next].at <= this.clock) {
      const free = this.seats.findIndex((s) => !s);
      if (free < 0) break; // wait for a seat
      const o = this.orders[this.next++];
      this.seats[free] = { item: o.item, patience: o.patience, remaining: o.patience, face: free % 4, hair: (this.next + free) % HAIR.length, born: this.clock };
      this.spawned++;
      this.sfx('door_open');
    }
    for (let i = 0; i < 4; i++) {
      const c = this.seats[i];
      if (!c) continue;
      c.remaining -= dt;
      if (c.remaining <= 0) { this.seats[i] = null; this.walkedOut++; this.combo = 0; this.say(i, 'Hmph!', THEME.red); this.sfx('wrong'); }
    }
    for (let item = 0; item < 4; item++) {
      if (!input.pressed(KEY_ACTION[item])) continue;
      this.pressFlash[item] = 1;
      let target = -1;
      this.seats.forEach((c, i) => { if (c && c.item === item && (target < 0 || c.remaining < this.seats[target].remaining)) target = i; });
      if (target >= 0) {
        const c = this.seats[target];
        this.served.push({ remaining: c.remaining, patience: c.patience });
        this.seats[target] = null; this.combo++;
        this.say(target, c.remaining / c.patience > 0.5 ? 'Yum! +tip' : 'Thanks!', THEME.gold);
        this.sfx(this.combo % 3 === 0 ? 'coin' : 'correct');
      } else { this.mistakes++; this.combo = 0; this.sfx('error'); this.popText(160, 150, 'Wrong order!', THEME.red); }
    }
    this.pop = this.pop.filter((p) => (p.age += dt) < 1);
    if (this.clock >= this.limit) {
      const score = cafeScore({ served: this.served, spawned: this.spawned, mistakes: this.mistakes, walkedOut: this.walkedOut });
      this.end(score, { served: this.served.length, spawned: this.spawned, tips: Math.round(this.served.reduce((s, o) => s + (o.remaining / o.patience) * 3, 0)), detail: `Served ${this.served.length} of ${this.spawned} customers` });
    }
  }
  say(seat, text, color) { this.popText(SEATS[seat] + 24, 60, text, color); }
  popText(x, y, text, color) { this.pop.push({ x, y, text, color, age: 0 }); }
  drawBackground(ctx) {
    ctx.fillStyle = '#e8d5a8'; ctx.fillRect(0, 0, 320, 110);
    ctx.fillStyle = '#c9a97a'; for (let i = 0; i < 10; i++) ctx.fillRect(i * 32, 0, 2, 110);
    ctx.fillStyle = '#8fd0f0'; ctx.fillRect(130, 12, 60, 40); ctx.fillStyle = '#f6ecd2'; ctx.fillRect(158, 12, 4, 40); ctx.fillRect(130, 30, 60, 3);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = '#f2b84b'; ctx.fillRect(20 + i * 70, 8, 8, 12); ctx.fillStyle = '#c98a22'; ctx.fillRect(20 + i * 70, 20, 8, 2); }
    ctx.fillStyle = '#7a4f2e'; ctx.fillRect(0, 108, 320, 6);
    ctx.fillStyle = '#b5834a'; ctx.fillRect(0, 114, 320, 126);
    ctx.fillStyle = '#9a6a38'; for (let i = 0; i < 8; i++) ctx.fillRect(0, 130 + i * 14, 320, 1);
    ctx.fillStyle = '#7a4f2e'; ctx.fillRect(0, 150, 320, 10); ctx.fillStyle = '#9a6a38'; ctx.fillRect(0, 150, 320, 2); // counter
  }
  drawItem(ctx, item, x, y) {
    const name = CAFE_ITEMS[item];
    if (this.game.ui && this.game.ui.services && this.game.ui.services.drawIcon) { this.game.ui.services.drawIcon(ctx, name, x, y); return; }
    const col = ['#7a4f2e', '#7fd36a', '#f4a6c8', '#f2b84b'][item];
    ctx.fillStyle = '#141a33'; ctx.fillRect(x + 1, y + 1, 14, 14); ctx.fillStyle = col; ctx.fillRect(x + 2, y + 2, 12, 12);
    drawText(ctx, name[0].toUpperCase(), x + 8, y + 4, { color: '#141a33', shadow: null, align: 'center' });
  }
  playDraw(ctx) {
    drawText(ctx, `Cafe Rush   ${Math.max(0, Math.ceil(this.limit - (this.clock || 0)))} s`, 160, 6, { color: '#3b2a1f', shadow: null, align: 'center' });
    if (!this.seats) return;
    this.seats.forEach((c, i) => {
      const x = SEATS[i];
      if (!c) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + 10, 112, 28, 8); return; }
      const bob = Math.round(Math.sin((this.clock + i) * 3) * 1);
      ctx.fillStyle = '#4a5a8a'; ctx.fillRect(x + 12, 96 + bob, 24, 16); // body
      ctx.fillStyle = FACE[c.face]; ctx.fillRect(x + 14, 76 + bob, 20, 20);
      ctx.fillStyle = HAIR[c.hair]; ctx.fillRect(x + 13, 73 + bob, 22, 9); ctx.fillRect(x + 12, 76 + bob, 3, 10);
      const urgent = c.remaining / c.patience < 0.3;
      ctx.fillStyle = '#141a33'; ctx.fillRect(x + 18, 85 + bob, 3, 3); ctx.fillRect(x + 27, 85 + bob, 3, 3);
      ctx.fillRect(x + 21, (urgent ? 93 : 92) + bob, 6, 1);
      drawWindow(ctx, x + 6, 36, 36, 30, 'hud');
      this.drawItem(ctx, c.item, x + 16, 40);
      ctx.fillStyle = '#141a33'; ctx.fillRect(x + 20, 62, 4, 4);
      drawBar(ctx, x + 6, 70, 36, 5, c.remaining, c.patience, { fill: c.remaining / c.patience > 0.5 ? THEME.green : c.remaining / c.patience > 0.25 ? THEME.gold : THEME.red, back: '#7a6a50' });
    });
    // tray with the four buttons
    for (let item = 0; item < 4; item++) {
      const x = 40 + item * 62;
      drawWindow(ctx, x, 176, 54, 46, 'menu');
      ctx.fillStyle = `rgba(242,184,75,${this.pressFlash[item] * 0.55})`; ctx.fillRect(x + 3, 179, 48, 40);
      this.drawItem(ctx, item, x + 19, 183);
      drawText(ctx, ARROW[item], x + 27, 203, { color: THEME.gold, shadow: '#141a33', align: 'center' });
      drawText(ctx, CAFE_ITEMS[item], x + 27, 211, { color: '#ffffff', shadow: '#141a33', align: 'center' });
    }
    drawText(ctx, `Served ${this.served.length}   Combo ${this.combo}`, 160, 164, { color: '#fff7de', shadow: '#3b2a1f', align: 'center' });
    for (const p of this.pop) drawText(ctx, p.text, p.x, p.y - Math.round(p.age * 18), { color: p.color, shadow: '#141a33', align: 'center', alpha: 1 - p.age });
  }
}
void drawIconSafe;
