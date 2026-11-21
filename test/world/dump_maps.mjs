// Dev tool (not a test): writes one PNG per (map, season) without a browser.
//   node test/world/dump_maps.mjs <outDir> [mapId ...] [--overlay] [--seasons=spring,winter] [--scale=2]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderMapPixels } from '../../src/world/render.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const flag = (n, d) => (args.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1] || d;
const out = args.find((a) => !a.startsWith('--')) || 'dist/world_png';
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const seasons = flag('seasons', 'spring,summer,autumn,winter').split(',');
const scale = Number(flag('scale', 1));
const overlay = args.includes('--overlay');

const crcT = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
function png(file, w, h, rgba, s) {
  const W = w * s, H = h * s, raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0;
    for (let x = 0; x < W; x++) { const si = (((y / s) | 0) * w + ((x / s) | 0)) * 4, di = y * (W * 4 + 1) + 1 + x * 4; raw[di] = rgba[si]; raw[di + 1] = rgba[si + 1]; raw[di + 2] = rgba[si + 2]; raw[di + 3] = 255; }
  }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

fs.mkdirSync(out, { recursive: true });
const dir = path.join(root, 'src/world/maps');
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js') && x !== 'index.js')) {
  const id = f.replace(/\.js$/, '');
  if (only.length && !only.includes(id)) continue;
  const mod = await import(pathToFileURL(path.join(dir, f)).href);
  const def = typeof mod.default === 'function' ? mod.default() : mod.default;
  for (const season of seasons) {
    const px = renderMapPixels(def, season, { overlay });
    const file = path.join(out, `${id}_${season}${overlay ? '_overlay' : ''}.png`);
    png(file, px.width, px.height, px.data, scale);
    console.log(file);
  }
}
