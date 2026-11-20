// Audio dev page. Build: node scripts/build.mjs --entry src/dev/audio_player.js --out dist/dev/audio_player.html
// Buttons play every track / sfx / ambience. window.__audioSelfTest({tracks, sfx, seconds}) renders offline and returns a JSON report.
import { MUSIC_IDS, SFX_IDS, AMBIENCE_IDS } from '../data/ids.js';
import { audio } from '../audio/index.js';
import { renderTrack, renderSfx } from '../audio/offline.js';

document.body.style.cssText = 'margin:0;padding:12px;background:#17121f;color:#f4ead5;font:12px ui-monospace,monospace';
const root = document.getElementById('app') || document.body;
root.innerHTML = '';
root.style.cssText = 'position:static;display:block;overflow:auto;padding:8px';
const sec = (title, ids, fn) => {
  const h = document.createElement('div'); h.textContent = title; h.style.cssText = 'margin:10px 0 4px;color:#f2b84b'; root.appendChild(h);
  for (const id of ids) {
    const b = document.createElement('button'); b.textContent = id; b.style.cssText = 'margin:2px;padding:3px 7px;background:#2b3560;color:#fff;border:1px solid #f6ecd2;cursor:pointer';
    b.onclick = () => { audio.init(); fn(id); }; root.appendChild(b);
  }
};
sec('music', MUSIC_IDS, (id) => audio.music(id, { fadeMs: 500 }));
sec('sfx', SFX_IDS, (id) => audio.sfx(id));
sec('ambience', AMBIENCE_IDS, (id) => audio.ambience(id));
const stop = document.createElement('button'); stop.textContent = 'STOP ALL'; stop.onclick = () => { audio.music(null); audio.ambience(null); }; root.appendChild(stop);

window.__audioSelfTest = async ({ tracks = MUSIC_IDS, sfx = SFX_IDS, seconds = 6 } = {}) => {
  const report = { tracks: {}, sfx: {}, problems: [] };
  for (const id of tracks) {
    try { report.tracks[id] = await renderTrack(id, seconds); } catch (e) { report.tracks[id] = { error: String(e) }; }
    const r = report.tracks[id];
    if (r.error || r.nan || r.silent || r.clipped > 20 || r.peak < 0.05) report.problems.push(`track ${id}: ${JSON.stringify(r)}`);
  }
  for (const id of sfx) {
    try { report.sfx[id] = await renderSfx(id); } catch (e) { report.sfx[id] = { error: String(e) }; }
    const r = report.sfx[id];
    if (r.error || r.nan || r.silent || r.clipped > 20) report.problems.push(`sfx ${id}: ${JSON.stringify(r)}`);
  }
  return report;
};
window.__audio = audio;
