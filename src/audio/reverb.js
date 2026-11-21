// reverb.js - generated impulse response (no samples): decaying, progressively damped stereo noise.
export function makeImpulse(ctx, seconds = 2.4, decay = 3.2) {
  const rate = ctx.sampleRate, len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let s = 1234567 + ch * 7919, y = 0;
    for (let i = 0; i < len; i++) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const x = s / 2147483648 - 1;
      const p = i / len;
      y += (x - y) * (0.7 - 0.55 * Math.min(1, p * 1.6)); // high frequencies die first
      const pre = i < rate * 0.012 ? i / (rate * 0.012) : 1;
      d[i] = y * Math.pow(1 - p, decay) * pre * 0.5;
    }
  }
  return buf;
}
export function makeReverb(ctx, seconds = 2.4, decay = 3.2) {
  const c = ctx.createConvolver();
  c.buffer = makeImpulse(ctx, seconds, decay);
  return c;
}
