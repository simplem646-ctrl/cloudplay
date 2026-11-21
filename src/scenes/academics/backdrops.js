// Opaque full-screen backdrops drawn with canvas primitives (320x240): classroom, field, study desk, library.
import { drawText, THEME } from '../../ui/index.js';
import { tintCss, timeTint, SUBJECT_LABEL } from './logic.js';

const rect = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); };

function person(ctx, x, y, { hair = '#3b2a1f', shirt = '#3a6ea5', skin = '#f0c8a0', back = false } = {}) {
  rect(ctx, '#1d2340', x - 1, y + 9, 12, 2); // shadow-ish base
  rect(ctx, shirt, x + 1, y + 8, 8, 10);
  rect(ctx, '#2b3560', x + 2, y + 18, 3, 5); rect(ctx, '#2b3560', x + 5, y + 18, 3, 5);
  rect(ctx, skin, x + 2, y + 1, 6, 7);
  rect(ctx, hair, x + 1, y, 8, back ? 8 : 3);
  if (!back) { rect(ctx, '#1d2340', x + 3, y + 4, 1, 2); rect(ctx, '#1d2340', x + 6, y + 4, 1, 2); }
}

function chalkSketch(ctx, subject, x, y, t) {
  const c = '#e9efe6';
  switch (subject) {
    case 'math':
      drawText(ctx, 'a2 + b2 = c2', x + 30, y + 22, { color: c, shadow: null });
      ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 6, y + 56); ctx.lineTo(x + 6, y + 30); ctx.lineTo(x + 28, y + 56); ctx.closePath(); ctx.stroke();
      drawText(ctx, 'sin 30 = 1/2', x + 70, y + 40, { color: '#f2d27a', shadow: null });
      break;
    case 'literature':
      drawText(ctx, '"Once upon a time..."', x + 20, y + 24, { color: c, shadow: null });
      rect(ctx, c, x + 90, y + 38, 24, 1); rect(ctx, c, x + 96, y + 36, 2, 5); // quill
      drawText(ctx, 'who? where? why?', x + 14, y + 44, { color: '#f2d27a', shadow: null });
      break;
    case 'science':
      ctx.strokeStyle = c; ctx.beginPath(); ctx.ellipse(x + 30, y + 42, 14, 5, 0.5, 0, 6.3); ctx.ellipse(x + 30, y + 42, 14, 5, -0.5, 0, 6.3); ctx.stroke();
      rect(ctx, '#f2d27a', x + 29, y + 41, 3, 3);
      drawText(ctx, 'H2O  CO2  O2', x + 56, y + 26, { color: c, shadow: null });
      break;
    case 'history':
      rect(ctx, c, x + 8, y + 42, 120, 1);
      [0, 30, 60, 90, 120].forEach((d, i) => { rect(ctx, '#f2d27a', x + 8 + d, y + 39, 2, 7); drawText(ctx, ['300', '800', '1200', '1600', '1900'][i], x + 2 + d, y + 50, { color: c, shadow: null }); });
      drawText(ctx, 'TIMELINE', x + 44, y + 20, { color: c, shadow: null });
      break;
    case 'art':
      ['#e8645a', '#f2b84b', '#7fb4ff', '#7fd36a'].forEach((col, i) => { rect(ctx, col, x + 14 + i * 16, y + 36, 11, 11); });
      drawText(ctx, 'red + yellow = ?', x + 14, y + 20, { color: c, shadow: null });
      break;
    default:
      drawText(ctx, 'Team play: pass, move, pass', x + 10, y + 24, { color: c, shadow: null });
      rect(ctx, c, x + 20, y + 44, 3, 3); rect(ctx, c, x + 60, y + 38, 3, 3); rect(ctx, c, x + 100, y + 46, 3, 3);
  }
  if (Math.floor(t * 2) % 2) rect(ctx, '#ffffff', x + 118, y + 56, 2, 2); // chalk dust blink
}

/** Classroom: wall, blackboard with the subject title and sketch, teacher, desk rows. */
export function drawClassroom(ctx, { subject = 'math', teacher = null, t = 0 } = {}) {
  rect(ctx, '#b8c9c0', 0, 0, 320, 150); // wall
  rect(ctx, '#a1b5ab', 0, 0, 320, 10);
  rect(ctx, '#9a6a3c', 0, 150, 320, 90); // floor
  for (let y = 150; y < 240; y += 10) rect(ctx, '#8a5c32', 0, y, 320, 1);
  // window
  rect(ctx, '#7a4f2e', 250, 18, 56, 52); rect(ctx, '#9fd0ee', 253, 21, 50, 46); rect(ctx, '#7a4f2e', 277, 21, 2, 46); rect(ctx, '#7a4f2e', 253, 43, 50, 2);
  rect(ctx, '#ffffff', 258 + Math.floor(t * 3) % 20, 28, 12, 4);
  // blackboard
  rect(ctx, '#7a4f2e', 20, 14, 216, 86); rect(ctx, '#27412f', 24, 18, 208, 78); rect(ctx, '#2f4d38', 24, 18, 208, 6);
  drawText(ctx, (SUBJECT_LABEL[subject] || subject).toUpperCase(), 128, 24, { color: '#ffffff', shadow: null, align: 'center', scale: 2 });
  chalkSketch(ctx, subject, 52, 40, t);
  rect(ctx, '#c9b27a', 24, 98, 208, 3); rect(ctx, '#ffffff', 60, 96, 8, 2); rect(ctx, '#e8a8a8', 72, 96, 6, 2); // chalk tray
  // clock
  rect(ctx, '#f6ecd2', 156, 3, 12, 12); rect(ctx, '#3b2a1f', 161, 5, 1, 5); rect(ctx, '#3b2a1f', 161, 9, 4, 1);
  // teacher + desk
  rect(ctx, '#7a4f2e', 238, 100, 66, 22); rect(ctx, '#9a6a3c', 238, 100, 66, 4);
  person(ctx, 262, 86, { hair: '#6b4a3a', shirt: teacher && teacher.color ? teacher.color : '#7a3a5a' });
  // pupils' desks (backs of heads)
  const cols = ['#3b2a1f', '#d7a45a', '#2a2a3a', '#9a4a2a', '#6b6b7a'];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
    const x = 28 + c * 70 + r * 12, y = 150 + r * 46;
    person(ctx, x + 22, y - 4 - (r ? 0 : 6), { hair: cols[(c + r * 2) % cols.length], shirt: c === 1 && r === 1 ? '#3a6ea5' : '#8a8fb0', back: true });
    rect(ctx, '#b07a44', x, y + 12, 50, 14); rect(ctx, '#7a4f2e', x, y + 24, 50, 3); rect(ctx, '#7a4f2e', x + 3, y + 27, 3, 10); rect(ctx, '#7a4f2e', x + 44, y + 27, 3, 10);
  }
}

/** PE field: sky, grass, track curve, goal, clouds. */
export function drawField(ctx, { t = 0 } = {}) {
  rect(ctx, '#8ecaf0', 0, 0, 320, 90); rect(ctx, '#b4def5', 0, 60, 320, 30);
  for (let i = 0; i < 3; i++) { const x = ((t * 6 + i * 120) % 380) - 40; rect(ctx, '#ffffff', x, 18 + i * 14, 36, 8); rect(ctx, '#ffffff', x + 8, 14 + i * 14, 20, 6); }
  rect(ctx, '#4a8a4a', 0, 90, 320, 150);
  for (let y = 90; y < 240; y += 16) rect(ctx, '#55984f', 0, y, 320, 8);
  // hedges / school silhouette
  rect(ctx, '#3a6a3a', 0, 80, 320, 12); rect(ctx, '#c9b27a', 20, 54, 90, 30); rect(ctx, '#a8503a', 14, 48, 102, 8);
  [0, 1, 2, 3].forEach((i) => rect(ctx, '#7fb4d8', 28 + i * 20, 62, 12, 10));
  // track + lines
  rect(ctx, '#b0643a', 0, 168, 320, 34); rect(ctx, '#ffffff', 0, 168, 320, 1); rect(ctx, '#ffffff', 0, 185, 320, 1); rect(ctx, '#ffffff', 0, 201, 320, 1);
  // goal
  rect(ctx, '#ffffff', 250, 104, 3, 34); rect(ctx, '#ffffff', 296, 104, 3, 34); rect(ctx, '#ffffff', 250, 104, 49, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let x = 253; x < 296; x += 4) ctx.fillRect(x, 107, 1, 31);
  // coach and cones
  person(ctx, 160, 124, { hair: '#2a2a3a', shirt: '#e8645a' });
  [60, 90, 120].forEach((x) => { rect(ctx, '#f2802a', x, 150, 5, 6); rect(ctx, '#ffffff', x + 1, 152, 3, 1); });
  const bx = 220 + Math.round(Math.abs(Math.sin(t * 3)) * 0), by = 214 - Math.round(Math.abs(Math.sin(t * 3)) * 10);
  rect(ctx, '#ffffff', bx, by, 6, 6); rect(ctx, '#2a2a3a', bx + 2, by + 2, 2, 2);
}

function tint(ctx, minute, alpha = 1) {
  const [r, g, b, a] = timeTint(minute);
  if (a > 0) { ctx.fillStyle = tintCss([r, g, b, a * alpha]); ctx.fillRect(0, 0, 320, 240); }
}

/** Home study desk: window with time-of-day sky, desk, lamp glow, books, a scratching pencil. */
export function drawStudyHome(ctx, { t = 0, minute = 600, writing = false, subjectColor = '#e8645a' } = {}) {
  rect(ctx, '#6a5a8a', 0, 0, 320, 160); rect(ctx, '#5a4a7a', 0, 150, 320, 10);
  for (let x = 0; x < 320; x += 20) rect(ctx, '#74649a', x, 0, 2, 150);
  const h = (minute % 1440) / 60, night = h < 6.5 || h >= 19;
  rect(ctx, '#7a4f2e', 28, 18, 90, 74); rect(ctx, night ? '#1d2748' : h >= 17 ? '#e8905a' : '#9fd0ee', 32, 22, 82, 66);
  if (night) { [[40, 30], [70, 40], [96, 28], [58, 62], [100, 70]].forEach(([x, y], i) => { if ((Math.floor(t * 2) + i) % 5) rect(ctx, '#fff7de', x, y, 1, 1); }); rect(ctx, '#f6ecd2', 90, 34, 8, 8); }
  else rect(ctx, '#ffffff', 40 + Math.floor(t * 4) % 40, 36, 16, 5);
  rect(ctx, '#7a4f2e', 72, 22, 2, 66); rect(ctx, '#7a4f2e', 32, 54, 82, 2);
  rect(ctx, '#4a3426', 0, 160, 320, 80); // floor
  rect(ctx, '#8a5c32', 0, 160, 320, 4);
  // shelf
  rect(ctx, '#7a4f2e', 214, 40, 80, 4); [0, 1, 2, 3, 4, 5].forEach((i) => rect(ctx, ['#e8645a', '#7fb4ff', '#f2b84b', '#7fd36a', '#f4a6c8', '#9a8aff'][i], 218 + i * 12, 28, 9, 12));
  person(ctx, 140, 126, { hair: '#4a3426', shirt: '#3a6ea5', back: true }); // Theo seen from behind
  // desk
  rect(ctx, '#b07a44', 40, 150, 240, 12); rect(ctx, '#8a5c32', 40, 162, 240, 6); rect(ctx, '#7a4f2e', 52, 168, 8, 56); rect(ctx, '#7a4f2e', 260, 168, 8, 56);
  // lamp + glow
  rect(ctx, '#3b2a1f', 232, 150, 18, 3); rect(ctx, '#3b2a1f', 240, 110, 2, 40); rect(ctx, '#f2b84b', 228, 100, 26, 10);
  const g = ctx.createRadialGradient(241, 112, 4, 241, 140, 90); g.addColorStop(0, 'rgba(255,220,130,0.38)'); g.addColorStop(1, 'rgba(255,220,130,0)');
  ctx.fillStyle = g; ctx.fillRect(130, 90, 220, 150);
  // books + open book
  rect(ctx, subjectColor, 70, 138, 36, 6); rect(ctx, '#3a6ea5', 72, 132, 32, 6); rect(ctx, '#7fd36a', 74, 126, 28, 6);
  rect(ctx, '#fff7de', 122, 138, 52, 12); rect(ctx, '#e8dcb8', 148, 138, 2, 12);
  for (let i = 0; i < 4; i++) { rect(ctx, '#8a8fb0', 126, 140 + i * 2, 18, 1); rect(ctx, '#8a8fb0', 153, 140 + i * 2, 18, 1); }
  // pencil + hand
  const px = 160 + (writing ? Math.round(Math.sin(t * 22) * 4 + Math.sin(t * 7) * 5) : 0);
  rect(ctx, '#f0c8a0', px + 4, 128, 8, 8); rect(ctx, '#f2b84b', px, 134, 10, 2); rect(ctx, '#3b2a1f', px - 2, 136, 2, 2);
  if (writing) { rect(ctx, '#3b2a1f', 155 + (Math.floor(t * 6) % 12), 148, 2, 1); }
  tint(ctx, minute, 0.8);
}

/** Library: tall shelves, reading table, a lamp. */
export function drawStudyLibrary(ctx, { t = 0, minute = 900, writing = false, subjectColor = '#e8645a' } = {}) {
  rect(ctx, '#c9a77a', 0, 0, 320, 240);
  rect(ctx, '#7a4f2e', 0, 0, 320, 8);
  const colors = ['#e8645a', '#3a6ea5', '#f2b84b', '#4a8a5a', '#9a5a9a', '#d0804a', '#5a7a9a'];
  for (let s = 0; s < 3; s++) {
    const x = 12 + s * 104;
    rect(ctx, '#5a3a22', x, 14, 92, 112);
    for (let r = 0; r < 4; r++) {
      rect(ctx, '#7a4f2e', x + 2, 40 + r * 27, 88, 3);
      for (let b = 0; b < 12; b++) {
        const bh = 14 + ((b * 7 + r * 5 + s * 3) % 10);
        rect(ctx, colors[(b + r * 3 + s) % colors.length], x + 4 + b * 7, 40 + r * 27 - bh, 6, bh);
      }
    }
  }
  rect(ctx, '#7a4f2e', 100, 14, 4, 112); // ladder rail
  rect(ctx, '#8a5c32', 0, 128, 320, 112);
  for (let y = 128; y < 240; y += 12) rect(ctx, '#7a4f2e', 0, y, 320, 1);
  person(ctx, 154, 142, { hair: '#4a3426', shirt: '#3a6ea5', back: true });
  // reading table
  rect(ctx, '#b07a44', 50, 164, 220, 14); rect(ctx, '#8a5c32', 50, 178, 220, 6); rect(ctx, '#7a4f2e', 62, 184, 8, 44); rect(ctx, '#7a4f2e', 250, 184, 8, 44);
  rect(ctx, '#2f7a4a', 218, 142, 22, 12); rect(ctx, '#f2b84b', 222, 150, 14, 14); rect(ctx, '#3b2a1f', 228, 154, 2, 10); // green banker lamp
  rect(ctx, subjectColor, 80, 156, 36, 8); rect(ctx, '#3a6ea5', 82, 150, 32, 6);
  rect(ctx, '#fff7de', 140, 156, 54, 10); rect(ctx, '#e8dcb8', 166, 156, 2, 10);
  const px = 172 + (writing ? Math.round(Math.sin(t * 22) * 4 + Math.sin(t * 7) * 4) : 0);
  rect(ctx, '#f0c8a0', px + 4, 146, 8, 8); rect(ctx, '#f2b84b', px, 152, 10, 2);
  // dust motes
  for (let i = 0; i < 6; i++) rect(ctx, 'rgba(255,255,230,0.5)', (i * 53 + t * 8) % 320, 20 + ((i * 37 + t * 5) % 110), 1, 1);
  tint(ctx, minute, 0.5);
}

export { THEME };
