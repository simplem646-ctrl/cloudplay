// Offline rendering for objective checks (browser only): peak/rms/NaN/clipping for music tracks and SFX.
import { createGraph, playRecipe, compileSong, scheduleRange, recipeDuration } from './engine.js';
import { SFX } from './sfx.js';
import { resolveSong } from './songs.js';

const OAC = () => (typeof window !== 'undefined' ? window.OfflineAudioContext || window.webkitOfflineAudioContext : null);

function stats(buf) {
  let peak = 0, sum = 0, n = 0, clipped = 0, nan = false;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < d.length; i++) {
      const v = d[i];
      if (!Number.isFinite(v)) { nan = true; continue; }
      const a = Math.abs(v);
      if (a > peak) peak = a;
      if (a >= 0.999) clipped++;
      sum += v * v; n++;
    }
  }
  const rms = Math.sqrt(sum / Math.max(1, n));
  return { peak: +peak.toFixed(3), rms: +rms.toFixed(4), clipped, nan, silent: rms < 1e-4 };
}

export async function renderTrack(id, seconds = 6, sampleRate = 22050) {
  const AC = OAC();
  if (!AC) throw new Error('OfflineAudioContext unavailable');
  const ctx = new AC(2, Math.ceil(seconds * sampleRate), sampleRate);
  const g = createGraph(ctx);
  g.master.gain.value = 0.8; g.musicBus.gain.value = 0.6;
  scheduleRange(g, g.musicBus, compileSong(resolveSong(id)), 0.02, 0, seconds);
  return stats(await ctx.startRendering());
}

export async function renderSfx(id, sampleRate = 22050) {
  const AC = OAC();
  if (!AC) throw new Error('OfflineAudioContext unavailable');
  const dur = recipeDuration(SFX[id]) + 0.2;
  const ctx = new AC(2, Math.ceil(dur * sampleRate), sampleRate);
  const g = createGraph(ctx);
  g.master.gain.value = 0.8; g.sfxBus.gain.value = 0.9;
  playRecipe(g, SFX[id], 0.01, g.sfxBus, () => 0.5);
  return { ...stats(await ctx.startRendering()), dur: +dur.toFixed(2) };
}
