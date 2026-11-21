// Dev harness (Canvas2D, no engine): ?map=town_square&season=autumn&overlay=1&scale=3
//   overlay=1 shows collision (red), anchors (green + labels), warps (blue), interactables (yellow)
//   anim=0 freezes animated tiles (default animates), crop=x,y,w,h shows only a tile rectangle
//   ?sheet=winter[&labels=1]  draws the whole tileset atlas (labels=1 prints indices)
import { getMap, getTileset, listMaps } from '../world/index.js';

const q = new URLSearchParams(location.search);
const season = q.get('season') || 'spring';
const scale = Number(q.get('scale') || 2);

const app = document.getElementById('app');
app.style.cssText = 'position:static;display:block;overflow:auto';
document.documentElement.style.overflow = 'auto';
document.body.style.cssText = 'overflow:auto;height:auto;touch-action:auto;user-select:auto;background:#17121f';
const cv = document.createElement('canvas');
app.replaceChildren(cv);
const g = cv.getContext('2d');
g.imageSmoothingEnabled = false;

if (q.get('sheet')) {
  const ts = getTileset(q.get('sheet'));
  cv.width = ts.canvas.width * scale; cv.height = ts.canvas.height * scale;
  g.fillStyle = '#4a4660'; g.fillRect(0, 0, cv.width, cv.height);
  g.imageSmoothingEnabled = false;
  g.drawImage(ts.canvas, 0, 0, cv.width, cv.height);
  if (q.get('labels')) {
    g.font = '8px monospace'; g.fillStyle = '#fff'; g.strokeStyle = '#000';
    for (let i = 1; i < ts.meta.length; i++) { const x = (i % ts.cols) * 16 * scale, y = Math.floor(i / ts.cols) * 16 * scale; g.strokeText(i, x + 1, y + 9); g.fillText(i, x + 1, y + 9); }
  }
} else {
  const id = q.get('map') || listMaps()[0];
  const def = getMap(id);
  const ts = getTileset(season);
  const [cx, cy, cw, ch] = (q.get('crop') || `0,0,${def.width},${def.height}`).split(',').map(Number);
  cv.width = cw * 16 * scale; cv.height = ch * 16 * scale;
  const overlay = q.get('overlay') === '1';
  const draw = (t) => {
    const frame = q.get('anim') === '0' ? 0 : Math.floor(t / 250);
    g.setTransform(scale, 0, 0, scale, -cx * 16 * scale, -cy * 16 * scale);
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#17121f'; g.fillRect(cx * 16, cy * 16, cw * 16, ch * 16);
    const layer = (L) => {
      for (let y = cy; y < cy + ch; y++) for (let x = cx; x < cx + cw; x++) {
        let i = def.layers[L][y * def.width + x];
        if (!i) continue;
        const m = ts.meta[i];
        if (m.anim) i = m.anim.frames[Math.floor(frame * m.anim.fps / 4) % m.anim.frames.length];
        g.drawImage(ts.canvas, (i % ts.cols) * 16, Math.floor(i / ts.cols) * 16, 16, 16, x * 16, y * 16, 16, 16);
      }
    };
    layer('ground'); layer('deco'); layer('above');
    if (overlay) {
      g.fillStyle = 'rgba(255,40,40,0.28)';
      for (let y = cy; y < cy + ch; y++) for (let x = cx; x < cx + cw; x++) if (def.collision[y * def.width + x]) g.fillRect(x * 16, y * 16, 16, 16);
      g.lineWidth = 1;
      for (const w of def.warps) { g.fillStyle = 'rgba(60,120,255,0.45)'; g.fillRect(w.x * 16, w.y * 16, w.w * 16, w.h * 16); }
      g.strokeStyle = '#ffdc28';
      for (const it of def.interactables) g.strokeRect(it.x * 16 + 0.5, it.y * 16 + 0.5, it.w * 16 - 1, it.h * 16 - 1);
      g.font = '5px monospace'; g.textBaseline = 'top';
      for (const [n, a] of Object.entries(def.anchors)) {
        g.fillStyle = 'rgba(40,255,120,0.55)'; g.fillRect(a.x * 16 + 3, a.y * 16 + 3, 10, 10);
        g.fillStyle = '#000'; g.fillText(n, a.x * 16 + 1, a.y * 16 + 4);
        g.fillStyle = '#fff'; g.fillText(n, a.x * 16, a.y * 16 + 3);
      }
    }
    if (q.get('anim') !== '0') requestAnimationFrame(draw);
  };
  draw(0);
  document.title = `${id} / ${season}`;
}
