// Colour parsing helpers (pure). Everything in the engine passes colours as [r,g,b] floats 0..1.
export function parseColor(c, out = [0, 0, 0]) {
  if (Array.isArray(c)) {
    out[0] = c[0];
    out[1] = c[1];
    out[2] = c[2];
    return out;
  }
  if (typeof c === 'number') {
    out[0] = ((c >> 16) & 255) / 255;
    out[1] = ((c >> 8) & 255) / 255;
    out[2] = (c & 255) / 255;
    return out;
  }
  if (typeof c === 'string') {
    let s = c.trim();
    if (s[0] === '#') s = s.slice(1);
    if (s.length === 3) s = s.split('').map((ch) => ch + ch).join('');
    if (/^[0-9a-fA-F]{6}$/.test(s)) {
      const n = parseInt(s, 16);
      return parseColor(n, out);
    }
  }
  throw new Error(`Bad colour: ${String(c)}`);
}
