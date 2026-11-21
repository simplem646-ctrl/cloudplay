/** Emote sprites: canvas-drawn icons (lazy, shared textures) shown as a billboard above the head. */
import * as THREE from 'three';
import { EMOTES } from '../core/registry.js';
import { makeCanvas, canvasTexture } from './materials.js';
import { easeOutBack, smoothstep } from '../core/util.js';

export const EMOTE_TIME = 1.6;
const tex = new Map();

function outlined(c, drawPath, fill, line = '#ffffff', lw = 12) {
  c.lineJoin = 'round'; c.lineCap = 'round';
  drawPath(); c.strokeStyle = '#4a2c2a'; c.lineWidth = lw + 7; c.stroke();
  drawPath(); c.strokeStyle = line; c.lineWidth = lw; c.stroke();
  drawPath(); c.fillStyle = fill; c.fill();
}
const text = (c, s, x, y, size, fill) => {
  c.font = `900 ${size}px "Fredoka","Nunito",system-ui,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineJoin = 'round'; c.strokeStyle = '#4a2c2a'; c.lineWidth = 18; c.strokeText(s, x, y);
  c.strokeStyle = '#fff'; c.lineWidth = 9; c.strokeText(s, x, y); c.fillStyle = fill; c.fillText(s, x, y);
};
const starPath = (c, x, y, r) => () => { c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.closePath(); };

const DRAW = {
  heart(c) { const p = () => { c.beginPath(); c.moveTo(64, 108); c.bezierCurveTo(8, 70, 14, 22, 44, 22); c.bezierCurveTo(56, 22, 62, 30, 64, 38); c.bezierCurveTo(66, 30, 72, 22, 84, 22); c.bezierCurveTo(114, 22, 120, 70, 64, 108); c.closePath(); }; outlined(c, p, '#ff4f78'); c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(40, 42, 7, 11, -0.6, 0, 7); c.fill(); },
  music(c) { const p = () => { c.beginPath(); c.ellipse(40, 98, 15, 11, -0.4, 0, 7); c.moveTo(54, 94); c.lineTo(54, 26); c.lineTo(96, 20); c.lineTo(96, 84); c.moveTo(96, 84); c.ellipse(82, 88, 15, 11, -0.4, 0, 7); }; outlined(c, p, '#6a7ff0', '#fff', 10); },
  sweat(c) { const p = () => { c.beginPath(); c.moveTo(64, 14); c.bezierCurveTo(100, 62, 104, 80, 90, 98); c.bezierCurveTo(76, 114, 52, 114, 38, 98); c.bezierCurveTo(24, 80, 28, 62, 64, 14); c.closePath(); }; outlined(c, p, '#7fd0ff'); c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.ellipse(50, 84, 6, 11, 0.4, 0, 7); c.fill(); },
  anger(c) { c.lineCap = 'round'; for (const [w, col] of [[30, '#4a2c2a'], [20, '#fff'], [12, '#ee3030']]) { c.strokeStyle = col; c.lineWidth = w; for (const [x, y, dx, dy] of [[22, 40, 1, 0], [106, 40, -1, 0]]) { c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + dx * 24, y + 4, x + dx * 34, y + 30); c.stroke(); c.beginPath(); c.moveTo(x, 90); c.quadraticCurveTo(x + dx * 24, 86, x + dx * 34, 62); c.stroke(); } } },
  question(c) { text(c, '?', 64, 66, 118, '#8a5ae8'); },
  exclaim(c) { text(c, '!', 64, 66, 124, '#f0442a'); },
  zzz(c) { text(c, 'Z', 38, 88, 56, '#5a8ae8'); text(c, 'Z', 70, 60, 74, '#6a9af0'); text(c, 'z', 98, 32, 40, '#8ab4f8'); },
  sparkle(c) { outlined(c, starPath(c, 54, 66, 44), '#ffe45a', '#fff', 8); outlined(c, starPath(c, 98, 30, 22), '#fff3a0', '#fff', 6); outlined(c, starPath(c, 100, 100, 16), '#fff3a0', '#fff', 5); },
  sad(c) { const p = () => { c.beginPath(); c.arc(44, 56, 24, Math.PI * 0.5, Math.PI * 1.5); c.arc(70, 38, 28, Math.PI * 1.1, Math.PI * 1.95); c.arc(94, 58, 22, Math.PI * 1.5, Math.PI * 0.5); c.closePath(); }; outlined(c, p, '#a6b0c4', '#fff', 8); c.fillStyle = '#7fd0ff'; for (const [x, y] of [[50, 96], [72, 108], [94, 94]]) { c.beginPath(); c.ellipse(x, y, 5, 8, 0, 0, 7); c.fill(); } },
  idea(c) { const p = () => { c.beginPath(); c.arc(64, 54, 34, 0, 7); c.closePath(); }; outlined(c, p, '#ffe45a', '#fff', 8); c.fillStyle = '#9a9aa8'; c.fillRect(48, 86, 32, 16); c.strokeStyle = '#4a2c2a'; c.lineWidth = 4; c.strokeRect(48, 86, 32, 16); c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.ellipse(52, 42, 7, 12, 0.5, 0, 7); c.fill(); c.strokeStyle = '#ffcf3a'; c.lineWidth = 6; c.lineCap = 'round'; for (let i = 0; i < 5; i++) { const a = -2.6 + i * 0.55; c.beginPath(); c.moveTo(64 + Math.cos(a) * 44, 54 + Math.sin(a) * 44); c.lineTo(64 + Math.cos(a) * 56, 54 + Math.sin(a) * 56); c.stroke(); } },
};

export function emoteTexture(name) {
  if (tex.has(name)) return tex.get(name);
  const cv = makeCanvas(128, 128);
  const c = cv && cv.getContext('2d');
  if (!c || !DRAW[name]) { tex.set(name, null); return null; }
  DRAW[name](c);
  const t = canvasTexture(cv);
  tex.set(name, t);
  return t;
}

/** One reusable sprite per rig. */
export function createEmoteSprite() {
  const mat = new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false, fog: false });
  const sprite = new THREE.Sprite(mat);
  sprite.visible = false;
  sprite.renderOrder = 999;
  return {
    sprite,
    name: null, t: 0, active: false,
    start(name, height) {
      const t = emoteTexture(name);
      this.name = name; this.t = 0; this.active = true; this.baseY = height + 0.28;
      if (t) { mat.map = t; mat.needsUpdate = true; }
      sprite.visible = !!t;
    },
    update(dt) {
      if (!this.active) return;
      this.t += dt;
      const u = this.t / EMOTE_TIME;
      if (u >= 1) { this.active = false; sprite.visible = false; return; }
      const pop = Math.min(1, this.t / 0.28);
      const s = 0.42 * (pop < 1 ? easeOutBack(pop) : 1) * (1 + 0.06 * Math.sin(this.t * 9));
      sprite.scale.set(s, s, 1);
      sprite.position.set(0, this.baseY + 0.1 * smoothstep(0, 1, u) + 0.02 * Math.sin(this.t * 6), 0);
      mat.opacity = u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1;
    },
    dispose() { mat.dispose(); },
  };
}
export const EMOTE_NAMES = EMOTES;
