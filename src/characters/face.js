/** Painted anime face: eye decal atlas (10 expressions x open/blink) + mouth decal atlas (10 closed + 3 talk frames).
 *  Canvas is created lazily; without any canvas support (Node) createFaceAtlas returns null. */
import * as THREE from 'three';
import { EXPRESSIONS } from '../core/registry.js';
import { makeCanvas, canvasTexture } from './materials.js';
import { hexOf, mix, TAU, DEG } from './kit.js';

export const EYE_CELL = { w: 192, h: 104, cols: 5, rows: 4 };
export const MOUTH_CELL = { w: 96, h: 64, cols: 5, rows: 3 };
export const TALK_FRAME0 = 10; // mouth cells 10..12 are open-mouth talk frames
export const EXPR_INDEX = Object.fromEntries(EXPRESSIONS.map((e, i) => [e, i]));
const LASH = '#2a1824';
const MOUTH_LINE = '#8a3a3e';
const MOUTH_DARK = '#5a1d26';

const STY = {
  big: { w: 46, h: 58, lash: 5.2, hl: 2 },
  mid: { w: 33, h: 41, lash: 3.4, hl: 1 },
  round: { w: 32, h: 36, lash: 0, hl: 2, dark: true },
  small: { w: 16, h: 17, lash: 0, hl: 1, dot: true },
};

// expression parameter table
const EXPR = {
  neutral: { eye: {}, brow: { l: { r: 0, t: 0 }, r: { r: 0, t: 0 } }, blush: 0.4, mouth: 'neutral' },
  happy: { eye: { glint: true }, brow: { l: { r: 4, t: 0.05 }, r: { r: 4, t: 0.05 } }, blush: 0.75, mouth: 'happy' },
  sad: { eye: { lid: 0.1, tilt: -0.4, look: [0, 0.25], wet: true }, brow: { l: { r: 2, t: 0.5 }, r: { r: 2, t: 0.5 } }, blush: 0.2, mouth: 'sad' },
  angry: { eye: { lid: 0.28, tilt: 0.5, sy: 0.94 }, brow: { l: { r: -4, t: -0.55 }, r: { r: -4, t: -0.55 } }, blush: 0.15, mouth: 'angry', mark: 'vein' },
  surprised: { eye: { sx: 1.1, sy: 1.14, pupil: 0.55 }, brow: { l: { r: 10, t: 0 }, r: { r: 10, t: 0 } }, blush: 0.2, mouth: 'surprised' },
  shy: { eye: { look: [-0.55, 0.65], lid: 0.06 }, brow: { l: { r: 3, t: 0.3 }, r: { r: 3, t: 0.3 } }, blush: 1.0, mouth: 'shy', hatch: true },
  thinking: { eye: { look: [0.7, -0.7] }, brow: { l: { r: 8, t: 0.2 }, r: { r: -1, t: -0.1 } }, blush: 0.25, mouth: 'thinking' },
  laugh: { closed: 'up', brow: { l: { r: 6, t: 0.1 }, r: { r: 6, t: 0.1 } }, blush: 0.85, mouth: 'laugh' },
  worried: { eye: { lid: 0.04, tilt: -0.22, look: [0, 0.1], wet: true }, brow: { l: { r: 5, t: 0.65 }, r: { r: 5, t: 0.65 } }, blush: 0.2, mouth: 'worried' },
  smug: { eye: { lid: 0.42, tilt: 0.05 }, brow: { l: { r: 7, t: 0.2 }, r: { r: -3, t: -0.28 } }, blush: 0.3, mouth: 'smug' },
};

function ellipse(c, x, y, rx, ry, rot = 0) {
  c.beginPath();
  c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU);
}

function drawGlasses(c, kind, color, lx, rx, cy) {
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = color;
  if (kind === 'round') {
    c.lineWidth = 3.4;
    for (const x of [lx, rx]) {
      ellipse(c, x, cy - 1, 29, 28);
      c.fillStyle = 'rgba(255,255,255,0.13)';
      c.fill();
      c.stroke();
      c.beginPath(); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2.2;
      c.arc(x, cy - 1, 21, Math.PI * 1.15, Math.PI * 1.4); c.stroke();
      c.strokeStyle = color; c.lineWidth = 3.4;
    }
    c.beginPath(); c.moveTo(lx + 29, cy - 8); c.quadraticCurveTo((lx + rx) / 2, cy - 14, rx - 29, cy - 8); c.stroke();
    c.beginPath(); c.moveTo(lx - 29, cy - 4); c.lineTo(lx - 38, cy - 8); c.moveTo(rx + 29, cy - 4); c.lineTo(rx + 38, cy - 8); c.stroke();
  } else {
    c.lineWidth = 2.6;
    for (const x of [lx, rx]) {
      c.beginPath();
      c.roundRect ? c.roundRect(x - 30, cy - 20, 60, 40, 11) : c.rect(x - 30, cy - 20, 60, 40);
      c.fillStyle = 'rgba(255,255,255,0.1)'; c.fill(); c.stroke();
    }
    c.beginPath(); c.moveTo(lx + 30, cy - 8); c.quadraticCurveTo((lx + rx) / 2, cy - 12, rx - 30, cy - 8); c.stroke();
    c.beginPath(); c.moveTo(lx - 30, cy - 8); c.lineTo(lx - 38, cy - 10); c.moveTo(rx + 30, cy - 8); c.lineTo(rx + 38, cy - 10); c.stroke();
  }
  c.restore();
}

function drawEye(c, cx, cy, side, S, app, st, closed) {
  const E = app.eyes;
  const w = S.w * (st.sx || 1) * (E.scale || 1), h = S.h * (st.sy || 1) * (E.scale || 1);
  const innerX = cx - side * w * 0.5, outerX = cx + side * w * 0.5;
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (closed) {
    c.strokeStyle = LASH;
    c.lineWidth = Math.max(3, S.lash * 1.1 || 3.6);
    c.beginPath();
    if (closed === 'up') {
      c.moveTo(outerX, cy + h * 0.14); c.quadraticCurveTo(cx, cy - h * 0.42, innerX, cy + h * 0.14);
    } else {
      c.moveTo(outerX, cy + h * 0.04); c.quadraticCurveTo(cx, cy + h * 0.22, innerX, cy + h * 0.02);
    }
    c.stroke();
    if (E.lash && closed !== 'up') {
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(outerX, cy + h * 0.04); c.lineTo(outerX + side * 6, cy - h * 0.06); c.stroke();
    }
    c.restore();
    return;
  }
  const lid = st.lid ?? E.lid ?? 0, tilt = st.tilt ?? 0;
  const lidBase = (E.sleepy || E.tired) ? Math.max(lid, 0.16) : lid;
  // clip to eye shape
  ellipse(c, cx, cy, w / 2, h / 2);
  c.save();
  c.clip();
  if (lidBase > 0 || tilt) {
    const yTop = cy - h / 2 + lidBase * h;
    const yOuter = yTop - side * 0 + (-tilt * w * 0.5), yInner = yTop + tilt * w * 0.5;
    c.beginPath();
    c.moveTo(outerX, yOuter); c.lineTo(innerX, yInner); c.lineTo(innerX, cy + h); c.lineTo(outerX, cy + h); c.closePath();
    c.clip();
  }
  if (S.dot) {
    c.fillStyle = '#2a1a1c';
    c.fillRect(cx - w, cy - h, w * 2, h * 2);
  } else {
    c.fillStyle = S.dark ? '#fffaf5' : '#fffaf5';
    c.fillRect(cx - w, cy - h, w * 2, h * 2);
    const look = st.look || [0, 0];
    const ix = cx + look[0] * w * 0.15, iy = cy + look[1] * h * 0.13;
    const irx = w * (S.dark ? 0.5 : 0.47), iry = h * 0.54;
    const col = E.color;
    const g = c.createLinearGradient(0, iy - iry, 0, iy + iry);
    if (S.dark) {
      g.addColorStop(0, hexOf(mix(col, '#000000', 0.2))); g.addColorStop(0.65, hexOf(col)); g.addColorStop(1, hexOf(mix(col, '#ffffff', 0.25)));
    } else {
      g.addColorStop(0, hexOf(mix(col, '#000000', 0.6))); g.addColorStop(0.4, hexOf(mix(col, '#000000', 0.12))); g.addColorStop(0.7, hexOf(col)); g.addColorStop(1, hexOf(mix(col, '#ffffff', 0.5)));
    }
    c.fillStyle = g;
    ellipse(c, ix, iy, irx, iry); c.fill();
    c.fillStyle = '#150c14';
    const p = st.pupil || 1;
    ellipse(c, ix, iy + iry * 0.04, irx * (S.dark ? 0.7 : 0.42) * p, iry * (S.dark ? 0.72 : 0.5) * p); c.fill();
    // iris rim darkening
    c.strokeStyle = hexOf(mix(col, '#000000', 0.55)); c.lineWidth = 1.6; ellipse(c, ix, iy, irx - 0.8, iry - 0.8); c.stroke();
    // highlights
    c.fillStyle = '#ffffff';
    const hr = w * (S.hl === 2 ? 0.17 : 0.13);
    ellipse(c, ix - w * 0.14, iy - h * 0.15, hr, hr * 1.05); c.fill();
    if (S.hl >= 2 || st.glint || E.sparkle) { ellipse(c, ix + w * 0.15, iy + h * 0.2, hr * 0.5, hr * 0.5); c.fill(); }
    if (E.sparkle || st.glint) {
      c.fillStyle = 'rgba(255,255,255,0.95)';
      const sx = ix + w * 0.17, sy = iy - h * 0.1, r = w * 0.1;
      c.beginPath(); c.moveTo(sx, sy - r * 1.5); c.lineTo(sx + r * 0.3, sy - r * 0.3); c.lineTo(sx + r * 1.5, sy); c.lineTo(sx + r * 0.3, sy + r * 0.3); c.lineTo(sx, sy + r * 1.5); c.lineTo(sx - r * 0.3, sy + r * 0.3); c.lineTo(sx - r * 1.5, sy); c.lineTo(sx - r * 0.3, sy - r * 0.3); c.closePath(); c.fill();
    }
    if (st.wet) { c.fillStyle = 'rgba(190,225,255,0.55)'; ellipse(c, cx, cy + h * 0.38, w * 0.4, h * 0.1); c.fill(); }
  }
  c.restore();
  c.restore();
  // top lash line / lid line
  c.save();
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = LASH; c.fillStyle = LASH;
  const lw = S.lash || (S.dot ? 0 : 2);
  const yTop = cy - h / 2 + lidBase * h;
  const yO = lidBase > 0 || tilt ? yTop - tilt * w * 0.5 : null;
  const yI = lidBase > 0 || tilt ? yTop + tilt * w * 0.5 : null;
  if (lw > 0) {
    c.lineWidth = lw;
    c.beginPath();
    if (yO !== null) { c.moveTo(outerX, yO + 1); c.quadraticCurveTo(cx, Math.min(yO, yI) - 2, innerX, yI + 1); }
    else { c.ellipse(cx, cy, w / 2 + 0.5, h / 2 + 0.5, 0, Math.PI * 1.04, Math.PI * 1.96); }
    c.stroke();
    if (E.lash) {
      c.lineWidth = lw * 0.8;
      const oy = yO !== null ? yO : cy - h * 0.18;
      c.beginPath(); c.moveTo(outerX - side * 1, oy + 2); c.quadraticCurveTo(outerX + side * 6, oy - 2, outerX + side * (E.liner ? 17 : 9), oy - (E.liner ? 14 : 7)); c.stroke();
      c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(outerX - side * 3, cy - h * 0.1); c.lineTo(outerX + side * 5, cy - h * 0.22); c.stroke();
      c.lineWidth = 1.6; c.strokeStyle = 'rgba(80,40,40,0.5)';
      c.beginPath(); c.ellipse(cx, cy, w / 2, h / 2, 0, 0.2, Math.PI - 0.2); c.stroke();
    }
    if (E.liner) {
      c.strokeStyle = LASH; c.lineWidth = lw * 0.9;
      c.beginPath(); c.moveTo(outerX, cy - h * 0.2); c.lineTo(outerX + side * 15, cy - h * 0.46); c.stroke();
    }
  } else if (S.dot) {
    c.fillStyle = '#ffffff';
    ellipse(c, cx - w * 0.15, cy - h * 0.18, w * 0.2, w * 0.2); c.fill();
  }
  if (E.sleepy || E.tired) {
    c.strokeStyle = 'rgba(110,70,80,0.35)'; c.lineWidth = 3;
    c.beginPath(); c.ellipse(cx, cy + h * 0.1, w / 2 + 1, h / 2 + 4, 0, 0.3, Math.PI - 0.3); c.stroke();
  }
  c.restore();
}

function drawBrow(c, cx, cy, side, S, app, b, mood) {
  const bw = app.eyes.brow.w || 1;
  const len = 36 * (S.w / 40 > 0.9 ? 1 : 0.9) * (app.eyes.brow.long || 1);
  const half = len / 2;
  const y = cy - S.h * 0.5 - 12 - (S.dot ? 4 : 0) - b.r;
  const innerLift = b.t * half * 0.55;
  const ox = cx + side * half, ix = cx - side * half;
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = hexOf(app.eyes.brow.color);
  c.lineWidth = (S.dot ? 3.6 : 3.4) * bw;
  c.beginPath();
  c.moveTo(ox, y + 1.5 + innerLift * 0.2);
  c.quadraticCurveTo(cx, y - 4 - innerLift * 0.4 - (mood.arch || 0), ix, y - innerLift + 1);
  c.stroke();
  if (bw > 1.5) { // fluffy
    c.lineWidth = 2.2 * bw * 0.6;
    c.beginPath(); c.moveTo(ox, y - 1); c.quadraticCurveTo(cx, y - 8 - innerLift * 0.4, ix, y - innerLift - 3); c.stroke();
  }
  c.restore();
}

function drawMarks(c, app, ex) {
  const marks = app.marks || [];
  const lx = 56, rx = 136, ey = 60;
  if (marks.includes('freckles')) {
    c.fillStyle = 'rgba(150,90,50,0.55)';
    const pts = [[-52, 84], [-44, 90], [-58, 91], [-36, 84], [52, 84], [44, 90], [58, 91], [36, 84], [-6, 76], [6, 78], [0, 72]];
    for (const [dx, dy] of pts) { ellipse(c, 96 + dx, dy, 1.8, 1.8); c.fill(); }
  }
  if (marks.includes('flour')) {
    c.fillStyle = 'rgba(255,255,255,0.85)';
    ellipse(c, 150, 78, 9, 4, 0.5); c.fill();
    ellipse(c, 142, 84, 5, 2.5, 0.3); c.fill();
  }
  if (marks.includes('bandaid')) {
    c.save();
    c.translate(144, 84); c.rotate(-0.45);
    c.fillStyle = '#f4d6a8'; c.strokeStyle = '#c89a68'; c.lineWidth = 1.2;
    c.beginPath(); c.roundRect ? c.roundRect(-13, -5, 26, 10, 3) : c.rect(-13, -5, 26, 10); c.fill(); c.stroke();
    c.fillStyle = '#e0b888'; c.fillRect(-4, -5, 8, 10);
    c.restore();
  }
  if (marks.includes('mole')) {
    c.fillStyle = '#4a2a28';
    ellipse(c, 158, 90, 2.4, 2.4); c.fill();
  }
}

function drawEyeCell(c, ox, oy, app, expName, blink) {
  const cell = EYE_CELL;
  c.save();
  c.translate(ox, oy);
  c.beginPath(); c.rect(0, 0, cell.w, cell.h); c.clip();
  const S = STY[app.eyes.style];
  const E = EXPR[expName];
  const cy = 52;
  const lx = 56, rx = 136;
  const st = { ...E.eye };
  const closed = E.closed || (blink ? 'down' : null);
  // blush
  const cheek = app.cheek;
  const strength = (E.blush ?? 0.4) * (app.cheekStrength || 1);
  for (const x of [lx - 4, rx + 4]) {
    const g = c.createRadialGradient(x, 85, 0, x, 85, 22);
    const a = Math.min(0.92, 0.62 * strength);
    g.addColorStop(0, hexOf(cheek).replace('#', '#') + '');
    c.save();
    c.globalAlpha = Math.min(1, a);
    const g2 = c.createRadialGradient(x, 85, 1, x, 85, 20);
    g2.addColorStop(0, hexOf(cheek)); g2.addColorStop(0.65, hexOf(cheek)); g2.addColorStop(1, hexOf(cheek) + '00');
    c.fillStyle = g2;
    ellipse(c, x, 85, 21, 10); c.fill();
    c.restore();
  }
  if (E.hatch) {
    c.strokeStyle = 'rgba(230,80,100,0.65)'; c.lineWidth = 2; c.lineCap = 'round';
    for (const x of [lx - 4, rx + 4]) for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(x + i * 8 - 3, 80); c.lineTo(x + i * 8 + 3, 88); c.stroke(); }
  }
  drawMarks(c, app);
  // eyes (left on screen = -1)
  drawEye(c, lx, cy, -1, S, app, st, closed);
  drawEye(c, rx, cy, 1, S, app, st, closed);
  // brows
  const bl = E.brow.l, br = E.brow.r;
  drawBrow(c, lx, cy, -1, S, app, bl, E);
  drawBrow(c, rx, cy, 1, S, app, br, E);
  if (app.eyes.glasses) drawGlasses(c, app.eyes.glasses, hexOf(app.eyes.glassColor || '#b0763c'), lx, rx, cy);
  if (E.mark === 'vein' && !blink) {
    c.strokeStyle = '#e03a3a'; c.lineWidth = 3; c.lineCap = 'round';
    const vx = 168, vy = 18;
    c.beginPath(); c.moveTo(vx - 8, vy - 3); c.lineTo(vx - 3, vy - 3); c.lineTo(vx - 3, vy - 8); c.moveTo(vx + 8, vy - 3); c.lineTo(vx + 3, vy - 3); c.lineTo(vx + 3, vy - 8);
    c.moveTo(vx - 8, vy + 3); c.lineTo(vx - 3, vy + 3); c.lineTo(vx - 3, vy + 8); c.moveTo(vx + 8, vy + 3); c.lineTo(vx + 3, vy + 3); c.lineTo(vx + 3, vy + 8);
    c.stroke();
  }
  c.restore();
}

function drawMouthCell(c, ox, oy, kind) {
  c.save();
  c.translate(ox, oy);
  c.beginPath(); c.rect(0, 0, MOUTH_CELL.w, MOUTH_CELL.h); c.clip();
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = MOUTH_LINE; c.lineWidth = 3.4; c.fillStyle = MOUTH_DARK;
  const x = 48, y = 26;
  const P = () => c.stroke();
  switch (kind) {
    case 'neutral': c.beginPath(); c.moveTo(x - 9, y + 2); c.quadraticCurveTo(x, y + 7, x + 9, y + 2); P(); break;
    case 'happy':
      c.beginPath(); c.moveTo(x - 15, y - 2); c.quadraticCurveTo(x, y + 4, x + 15, y - 2); c.quadraticCurveTo(x + 8, y + 22, x, y + 22); c.quadraticCurveTo(x - 8, y + 22, x - 15, y - 2); c.closePath();
      c.fill(); c.stroke();
      c.fillStyle = '#e8707e'; c.beginPath(); c.ellipse(x, y + 17, 6, 3.5, 0, 0, TAU); c.fill();
      break;
    case 'sad': c.beginPath(); c.moveTo(x - 9, y + 9); c.quadraticCurveTo(x, y + 0, x + 9, y + 9); P(); break;
    case 'angry': c.beginPath(); c.moveTo(x - 11, y + 8); c.quadraticCurveTo(x - 4, y + 2, x, y + 5); c.quadraticCurveTo(x + 4, y + 2, x + 11, y + 8); P(); break;
    case 'surprised': c.beginPath(); c.ellipse(x, y + 8, 7, 9, 0, 0, TAU); c.fill(); c.stroke(); break;
    case 'shy': c.beginPath(); c.moveTo(x - 10, y + 5); c.quadraticCurveTo(x - 5, y + 10, x, y + 5); c.quadraticCurveTo(x + 5, y + 0, x + 10, y + 5); c.lineWidth = 3; P(); break;
    case 'thinking': c.beginPath(); c.moveTo(x - 4, y + 7); c.quadraticCurveTo(x + 6, y + 4, x + 14, y + 0); P(); break;
    case 'laugh':
      c.beginPath(); c.moveTo(x - 17, y - 1); c.quadraticCurveTo(x, y + 4, x + 17, y - 1); c.quadraticCurveTo(x + 14, y + 25, x, y + 25); c.quadraticCurveTo(x - 14, y + 25, x - 17, y - 1); c.closePath();
      c.fill(); c.stroke();
      c.fillStyle = '#fffaf5'; c.beginPath(); c.moveTo(x - 13, y); c.quadraticCurveTo(x, y + 4, x + 13, y); c.lineTo(x + 12, y + 5); c.quadraticCurveTo(x, y + 8, x - 12, y + 5); c.closePath(); c.fill();
      c.fillStyle = '#e8707e'; c.beginPath(); c.ellipse(x, y + 20, 8, 4.5, 0, 0, TAU); c.fill();
      break;
    case 'worried': c.beginPath(); c.moveTo(x - 11, y + 8); c.quadraticCurveTo(x - 6, y + 2, x - 2, y + 7); c.quadraticCurveTo(x + 3, y + 12, x + 7, y + 6); c.quadraticCurveTo(x + 9, y + 3, x + 11, y + 6); P(); break;
    case 'smug': c.beginPath(); c.moveTo(x - 9, y + 7); c.quadraticCurveTo(x + 2, y + 9, x + 13, y + 0); P(); c.beginPath(); c.moveTo(x + 13, y + 0); c.lineTo(x + 16, y - 3); P(); break;
    case 'talk0': c.beginPath(); c.ellipse(x, y + 6, 6, 6, 0, 0, TAU); c.fill(); c.stroke(); break;
    case 'talk1':
      c.beginPath(); c.ellipse(x, y + 8, 11, 9, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#e8707e'; c.beginPath(); c.ellipse(x, y + 13, 6, 3.5, 0, 0, TAU); c.fill();
      break;
    case 'talk2': c.beginPath(); c.ellipse(x, y + 5, 12, 4.5, 0, 0, TAU); c.fill(); c.stroke(); break;
    default: break;
  }
  c.restore();
}

export const MOUTH_KINDS = [...EXPRESSIONS.map((e) => EXPR[e].mouth), 'talk0', 'talk1', 'talk2'];

const cache = new Map();

/** Face atlas for an appearance. Returns null when no canvas is available. */
export function createFaceAtlas(app, key) {
  if (cache.has(key)) return cache.get(key);
  const eyeCv = makeCanvas(EYE_CELL.w * EYE_CELL.cols, EYE_CELL.h * EYE_CELL.rows);
  const mouthCv = makeCanvas(MOUTH_CELL.w * MOUTH_CELL.cols, MOUTH_CELL.h * MOUTH_CELL.rows);
  if (!eyeCv || !mouthCv) { cache.set(key, null); return null; }
  const ec = eyeCv.getContext('2d'), mc = mouthCv.getContext('2d');
  if (!ec || !mc) { cache.set(key, null); return null; }
  EXPRESSIONS.forEach((name, i) => {
    for (const blink of [false, true]) {
      const k = i + (blink ? 10 : 0);
      drawEyeCell(ec, (k % EYE_CELL.cols) * EYE_CELL.w, Math.floor(k / EYE_CELL.cols) * EYE_CELL.h, app, name, blink);
    }
  });
  MOUTH_KINDS.forEach((kind, k) => drawMouthCell(mc, (k % MOUTH_CELL.cols) * MOUTH_CELL.w, Math.floor(k / MOUTH_CELL.cols) * MOUTH_CELL.h, kind));
  const atlas = { eye: canvasTexture(eyeCv), mouth: canvasTexture(mouthCv), eyeCv, mouthCv };
  cache.set(key, atlas);
  return atlas;
}

/** Per-instance view of an atlas: texture clones share the GPU image but have their own offsets. */
export function instanceFace(atlas) {
  const eye = atlas.eye.clone(), mouth = atlas.mouth.clone();
  eye.needsUpdate = true; mouth.needsUpdate = true;
  eye.repeat.set(1 / EYE_CELL.cols, 1 / EYE_CELL.rows);
  mouth.repeat.set(1 / MOUTH_CELL.cols, 1 / MOUTH_CELL.rows);
  return {
    eye, mouth,
    setEye(exprIdx, blink) {
      const k = exprIdx + (blink ? 10 : 0);
      eye.offset.set((k % EYE_CELL.cols) / EYE_CELL.cols, 1 - (Math.floor(k / EYE_CELL.cols) + 1) / EYE_CELL.rows);
    },
    setMouth(k) {
      mouth.offset.set((k % MOUTH_CELL.cols) / MOUTH_CELL.cols, 1 - (Math.floor(k / MOUTH_CELL.cols) + 1) / MOUTH_CELL.rows);
    },
    dispose() { eye.dispose(); mouth.dispose(); },
  };
}

/** Decal patch geometry (ellipsoid section slightly above the skull, with uv). */
export function decalGeometry(skull, jaw, o) {
  const { rx, ry, rz } = skull;
  const g = new THREE.SphereGeometry(1, o.ws, o.hs, Math.PI / 2 - o.span / 2, o.span, o.th0, o.th1 - o.th0);
  const pos = g.attributes.position, nor = g.attributes.normal;
  const grow = 1.03;
  for (let i = 0; i < pos.count; i++) {
    const ux = pos.getX(i), uy = pos.getY(i), uz = pos.getZ(i);
    const t = Math.max(0, -uy);
    const k = 1 + (jaw - 1) * Math.pow(t, 1.2) * 1.6;
    pos.setXYZ(i, ux * k * rx * grow, uy * ry * grow, uz * k * rz * grow);
    const nx = ux / rx, ny = uy / ry + (t > 0 ? (1 - jaw) * t * 0.5 : 0), nz = uz / rz;
    const l = Math.hypot(nx, ny, nz) || 1;
    nor.setXYZ(i, nx / l, ny / l, nz / l);
  }
  return g;
}
export const EYE_DECAL = { span: 116 * DEG, th0: 62 * DEG, th1: 118 * DEG, ws: 28, hs: 12 };
export const MOUTH_DECAL = { span: 50 * DEG, th0: 108 * DEG, th1: 134 * DEG, ws: 10, hs: 6 };
