// Street furniture painters (lamp posts, benches, fountain, clock post, planters, boards, vending...).
import { Canvas, shade, hash2, SNOW, snowCaps } from './paint_common.js';

const IRON = { o: '#1f2a28', m: '#3e5a52', l: '#6f9a8c' };

export const SHEETS = {
  // 1x3: head (above), mid, base
  lamp: {
    w: 1, h: 3,
    draw(C, ctx) {
      C.rect(7, 16, 2, 28, IRON.o); C.vline(7, 16, 28, IRON.m); C.vline(8, 16, 28, IRON.o);
      // base
      C.rect(5, 38, 6, 8, IRON.m); C.frame(5, 38, 6, 8, IRON.o); C.hline(4, 45, 8, IRON.o); C.hline(6, 40, 4, IRON.l);
      C.ellipse(8, 46, 6, 1.5, '#1d2340', 50);
      // head: lantern
      C.rect(4, 3, 8, 10, IRON.o); C.rect(5, 4, 6, 8, '#fff0a8'); C.rect(6, 5, 4, 6, '#ffd25a'); C.px(6, 5, '#ffffff');
      C.hline(3, 2, 10, IRON.m); C.hline(4, 1, 8, IRON.o); C.px(7, 0, IRON.o); C.px(8, 0, IRON.o);
      C.hline(4, 13, 8, IRON.o); C.vline(7, 4, 8, IRON.o);
      if (ctx.S.winter) { C.hline(4, 0, 8, SNOW.l); C.hline(5, 1, 6, SNOW.m); }
    },
  },
  bench: {
    w: 2, h: 1,
    draw(C, ctx) {
      const w = '#b87c46', wl = '#d89a60', wd = '#7a4f2e', wo = '#3b2a1f';
      C.ellipse(16, 14, 15, 2.2, '#1d2340', 50);
      // back rest
      C.rect(2, 2, 28, 5, wo); C.rect(3, 3, 26, 3, w); C.hline(3, 3, 26, wl); C.hline(3, 5, 26, wd);
      // seat
      C.rect(1, 7, 30, 4, wo); C.rect(2, 8, 28, 2, wl); C.hline(2, 9, 28, w);
      // legs
      for (const x of [3, 27]) { C.rect(x, 11, 2, 4, wo); C.px(x, 11, wd); }
      C.hline(4, 12, 24, wd);
      for (const x of [3, 27]) C.rect(x, 2, 2, 6, '#3e5a52');
      if (ctx.S.winter) { C.hline(3, 1, 26, SNOW.l); C.hline(3, 2, 26, SNOW.m); C.hline(2, 7, 28, SNOW.m); C.hline(4, 8, 24, SNOW.l); }
    },
  },
  fountain: {
    w: 5, h: 5,
    draw(C, ctx) {
      const st = '#cfc8b6', stl = '#ece6d4', std = '#9a9484', sto = '#5f5a4c';
      // outer basin (rim), interior left transparent for animated water tiles below
      C.ellipse(40, 72, 38, 6, '#1d2340', 40);
      const inside = (x, y) => x > 10 && x < 69 && y > 10 && y < 62;
      for (let y = 4; y < 76; y++) for (let x = 2; x < 78; x++) {
        const dx = Math.max(0, Math.abs(x - 40) - 28), dy = Math.max(0, Math.abs(y - 38) - 22);
        if ((dx * dx) / (10 * 10) + (dy * dy) / (10 * 10) > 1) continue; // rounded corners
        if (inside(x, y)) continue;
        let c = st;
        if (y > 62) c = y > 72 ? std : st; // front face
        if (y < 10 || x < 12) c = stl;
        if (y > 62 && (y - 62) % 5 === 4) c = std;
        if (y > 62 && ((x + ((y - 62) >> 2) * 6) % 12 === 0)) c = std;
        C.px(x, y, c);
      }
      C.addOutline(() => sto);
      // inner shadow rim line
      for (let x = 11; x < 69; x++) { C.px(x, 10, std); C.px(x, 62, '#7a98b0'); }
      for (let y = 11; y < 62; y++) { C.px(10, y, std); C.px(69, y, std); }
      // pedestal
      C.ellipse(40, 44, 9, 4, sto); C.ellipse(40, 43, 8, 3.2, st); C.ellipse(40, 42, 6, 2, stl);
      C.rect(35, 30, 10, 12, sto); C.rect(36, 30, 8, 11, st); C.vline(36, 30, 11, stl); C.vline(43, 30, 11, std);
      C.ellipse(40, 30, 6, 2.4, sto); C.ellipse(40, 29.5, 5, 1.8, stl);
      // spout stem + plume (plume lives in tile row 1 = above layer)
      C.rect(39, 22, 2, 8, '#bfe6f6'); C.vline(40, 20, 10, '#ffffff');
      const wc = ['#d8f4ff', '#a8e2f8', '#ffffff'];
      for (let k = 0; k < 9; k++) {
        const t = k / 8, yy = 18 + Math.sin(t * Math.PI) * -8 + t * 12;
        C.px(40 - 2 - k * 1.2, yy + 2, wc[1]); C.px(40 + 2 + k * 1.2, yy + 2, wc[1]);
        C.px(40 - 1 - k * 1.2, yy + 1, wc[0]); C.px(40 + 1 + k * 1.2, yy + 1, wc[0]);
      }
      C.disc(40, 17, 3.5, '#a8e2f8'); C.disc(40, 16, 2.4, '#ffffff');
      if (ctx.S.winter) { for (let x = 10; x < 70; x += 1) { if (hash2(x, 1, 3) > 0.3) { C.px(x, 3, SNOW.l); C.px(x, 4, SNOW.m); } } C.hline(12, 63, 56, null); }
    },
  },
  clockpost: {
    w: 1, h: 3,
    draw(C, ctx) {
      const b = '#3e5a52', bl = '#6f9a8c', bo = '#1f2a28';
      C.ellipse(8, 46, 7, 1.8, '#1d2340', 50);
      C.rect(6, 14, 4, 26, bo); C.vline(7, 14, 26, bl); C.vline(8, 14, 26, b);
      C.rect(3, 36, 10, 10, b); C.frame(3, 36, 10, 10, bo); C.hline(4, 38, 8, bl); C.hline(2, 45, 12, bo);
      // clock face
      C.rect(1, 1, 14, 14, bo); C.rect(2, 2, 12, 12, '#d8a040'); C.disc(8, 8, 5.2, '#f7f3ea'); C.disc(8, 8, 5.2, '#f7f3ea');
      C.vline(8, 4, 5, '#3b2a1f'); C.hline(8, 8, 3, '#3b2a1f');
      for (const [x, y] of [[8, 3], [8, 12], [3, 8], [13, 8]]) C.px(x, y, '#8a6a20');
      C.px(8, 8, '#c8402c');
      C.hline(3, 0, 10, bo); C.px(8, -1, bo);
      if (ctx.S.winter) { C.hline(1, 0, 14, SNOW.l); C.hline(2, 1, 12, SNOW.m); }
    },
  },
  noticeboard: {
    w: 2, h: 1,
    draw(C, ctx) {
      const wd = '#7a4f2e', wo = '#3b2a1f', wl = '#a56c3c';
      C.ellipse(16, 14.5, 14, 1.8, '#1d2340', 50);
      C.rect(3, 9, 3, 6, wo); C.rect(26, 9, 3, 6, wo); C.vline(4, 9, 6, wd);
      C.rect(1, 1, 30, 11, wo); C.rect(2, 2, 28, 9, wl); C.rect(3, 3, 26, 7, '#c9975a');
      const paper = [['#f7f3ea', 4, 4, 5, 5], ['#f6dc88', 11, 4, 4, 4], ['#bcd8ee', 17, 5, 5, 4], ['#f4c4c0', 23, 4, 4, 5], ['#f7f3ea', 8, 7, 4, 3], ['#cfe8d0', 14, 8, 6, 2]];
      for (const [c, x, y, w, h] of paper) { C.rect(x, y, w, h, c); C.hline(x, y, w, '#ffffff'); C.px(x + (w >> 1), y, '#d8453a'); C.hline(x + 1, y + 2, w - 2, '#a8a090'); }
      if (ctx.S.winter) { C.hline(1, 0, 30, SNOW.l); C.hline(2, 1, 28, SNOW.m); }
    },
  },
  vending: {
    w: 1, h: 2,
    draw(C, ctx, color) {
      const c = color === 'red' ? '#d8453a' : '#3f78b8';
      const o = shade(c, -0.6);
      C.ellipse(8, 30.5, 8, 1.8, '#1d2340', 50);
      C.rect(1, 1, 14, 30, o); C.rect(2, 2, 12, 28, c); C.hline(2, 2, 12, shade(c, 0.35)); C.vline(2, 2, 28, shade(c, 0.2)); C.vline(13, 2, 28, shade(c, -0.25));
      C.rect(3, 4, 8, 14, '#1d2340'); C.rect(4, 5, 6, 12, '#bfe6f6');
      const cans = ['#f08a4b', '#f0b83c', '#8a5aa8', '#4d9a5c', '#d8453a', '#f7f3ea'];
      for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) { C.rect(4 + k * 2, 6 + r * 4, 2, 3, cans[(r * 3 + k) % 6]); C.px(4 + k * 2, 6 + r * 4, '#ffffff'); }
      C.rect(12, 5, 2, 6, '#e8e0c8'); C.px(12, 6, '#d8453a'); C.px(12, 8, '#4d9a5c'); C.px(13, 6, '#3b2a1f');
      C.rect(4, 22, 8, 4, o); C.rect(5, 23, 6, 2, '#0e1220'); C.hline(5, 23, 6, '#3a4260');
      C.hline(3, 19, 8, '#ffd25a');
      if (ctx.S.winter) { C.hline(1, 0, 14, SNOW.l); C.hline(2, 1, 12, SNOW.m); }
    },
  },
  busstop: {
    w: 1, h: 2,
    draw(C, ctx) {
      C.ellipse(8, 30.5, 5, 1.6, '#1d2340', 50);
      C.rect(7, 12, 2, 20, IRON.o); C.vline(7, 12, 20, IRON.l);
      C.rect(2, 1, 12, 11, IRON.o); C.rect(3, 2, 10, 9, '#3f78b8'); C.hline(3, 2, 10, '#7fb0e8');
      C.disc(8, 6.5, 3.2, '#f7f3ea'); C.disc(8, 6.5, 2.2, '#3f78b8'); C.rect(7, 5, 2, 3, '#f7f3ea'); C.hline(5, 8, 6, '#f7f3ea');
      C.rect(5, 13, 6, 3, '#f7f3ea'); C.frame(5, 13, 6, 3, '#8a8272'); C.hline(6, 14, 4, '#3b2a1f');
      if (ctx.S.winter) { C.hline(2, 0, 12, SNOW.l); C.hline(3, 1, 10, SNOW.m); }
    },
  },
  bikerack: {
    w: 2, h: 1,
    draw(C, ctx) {
      C.ellipse(16, 14, 14, 1.8, '#1d2340', 45);
      for (let i = 0; i < 5; i++) { const x = 4 + i * 6; C.vline(x, 6, 8, IRON.o); C.vline(x + 1, 6, 8, IRON.l); C.px(x, 5, IRON.o); C.px(x + 1, 5, IRON.o); }
      C.hline(3, 14, 26, IRON.o);
      const bike = (x, c) => { C.disc(x + 2, 11, 2.6, '#1d2340'); C.disc(x + 2, 11, 1.6, '#aab4c0'); C.disc(x + 11, 11, 2.6, '#1d2340'); C.disc(x + 11, 11, 1.6, '#aab4c0'); C.hline(x + 2, 8, 9, c); C.px(x + 6, 7, c); C.hline(x + 6, 6, 4, '#3b2a1f'); C.vline(x + 11, 7, 3, '#3b2a1f'); };
      bike(1, '#d8453a'); bike(14, '#3f78b8');
      if (ctx.S.winter) { C.hline(3, 5, 26, SNOW.m); }
    },
  },
};

export function planter(T, ctx, v = 0) {
  const body = v ? '#a56c3c' : '#cfc8b6', o = shade(body, -0.6);
  T.ellipse(8, 14, 7.5, 1.6, '#1d2340', 50);
  T.rect(2, 8, 12, 7, o); T.rect(3, 9, 10, 5, body); T.hline(3, 9, 10, shade(body, 0.3)); T.hline(3, 13, 10, shade(body, -0.25)); T.vline(12, 9, 5, shade(body, -0.2));
  if (v) for (let x = 5; x < 12; x += 3) T.vline(x, 9, 5, shade(body, -0.3));
  T.rect(2, 6, 12, 3, o); T.rect(3, 7, 10, 2, ctx.S.winter ? '#f1f6fc' : '#3f9a3c');
  if (ctx.S.winter) { T.hline(3, 6, 10, '#fff'); T.px(6, 5, '#e8403c'); T.px(10, 5, '#e8403c'); return; }
  const cols = ctx.S.bloom;
  for (let i = 0; i < 6; i++) { const x = 3 + i * 2, c = cols[i % cols.length]; T.px(x, 5 - (i % 2), c); T.px(x + 1, 6 - (i % 2), shade(c, -0.2)); T.px(x, 6, '#5bbf45'); }
  T.px(7, 4, '#ffffff');
}

export function mailbox(T, ctx, v = 0) {
  const c = v ? '#3f78b8' : '#d8453a', o = shade(c, -0.6);
  T.ellipse(8, 14, 5, 1.4, '#1d2340', 50);
  T.rect(7, 9, 2, 6, '#3b2a1f'); T.vline(7, 9, 6, '#7a4f2e');
  T.rect(3, 2, 10, 8, o); T.rect(4, 3, 8, 6, c); T.hline(4, 3, 8, shade(c, 0.35)); T.hline(4, 8, 8, shade(c, -0.25));
  T.rect(5, 5, 5, 1, '#1d2340'); T.rect(11, 1, 2, 4, '#f0b83c'); T.px(11, 1, '#fff0a8');
  if (ctx.S.winter) { T.hline(3, 1, 10, SNOW.l); T.hline(4, 2, 8, SNOW.m); }
}

export function trash(T, ctx) {
  T.ellipse(8, 14, 5.5, 1.5, '#1d2340', 50);
  T.rect(4, 4, 8, 10, IRON.o); T.rect(5, 5, 6, 8, IRON.m); T.vline(5, 5, 8, IRON.l);
  for (let y = 6; y < 13; y += 2) T.hline(5, y, 6, IRON.o);
  T.rect(3, 3, 10, 2, IRON.o); T.hline(4, 3, 8, IRON.l);
  if (ctx.S.winter) { T.hline(3, 2, 10, SNOW.l); T.hline(4, 3, 8, SNOW.m); }
}

export function signpost(T, ctx) {
  T.ellipse(8, 14, 4, 1.3, '#1d2340', 50);
  T.rect(7, 2, 2, 13, '#4f3220'); T.vline(7, 2, 13, '#7a4f2e');
  T.rect(2, 3, 10, 4, '#3b2a1f'); T.rect(3, 4, 8, 2, '#d8a860'); T.px(12, 4, '#3b2a1f'); T.px(12, 5, '#3b2a1f'); T.px(1, 5, null);
  T.rect(5, 8, 9, 4, '#3b2a1f'); T.rect(6, 9, 7, 2, '#d8a860'); T.px(4, 9, '#3b2a1f'); T.px(4, 10, '#3b2a1f'); T.px(3, 10, '#3b2a1f');
  T.hline(4, 4, 5, '#7a4f2e'); T.hline(7, 10, 4, '#7a4f2e');
  if (ctx.S.winter) { T.hline(2, 2, 10, SNOW.l); T.hline(5, 7, 9, SNOW.m); }
}

export const PAINTERS = { planter, mailbox, trash, signpost };
