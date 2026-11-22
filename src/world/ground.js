/**
 * Ground painter: bakes an area's ground (base pattern + painted strokes of ground kinds + rugs + baked contact
 * shadows) into ONE canvas texture, per season. Pure canvas code; shapes come from shapes.js.
 */
import { mulberry32 } from '../core/util.js';
import { opToPoly, perimeterPoints, polyBounds, pointInPoly } from './shapes.js';
import { makeCanvas, SEASON_GRASS, shade, jitterHex, hexToRgb, rgbStr, mixHex } from './textures.js';

/** ground kind metadata: surface type for walking sounds, edge style for painting */
export const GROUND_KINDS = {
  grass: { surface: 'grass', edge: 'none' },
  meadow: { surface: 'grass', edge: 'soft', fuzz: true, shadow: 'rgba(40,90,40,0.0)' },
  moss: { surface: 'grass', edge: 'soft', fuzz: true },
  forest: { surface: 'grass', edge: 'soft', fuzz: true },
  dirt: { surface: 'dirt', edge: 'soft', fuzz: true, rim: '#e6c58f', halo: 'rgba(86,60,28,0.38)' },
  gravel: { surface: 'dirt', edge: 'soft', fuzz: true, rim: '#d8d0c0', halo: 'rgba(70,64,56,0.35)' },
  sand: { surface: 'sand', edge: 'soft', fuzz: true, rim: '#fff3cf', halo: 'rgba(150,120,70,0.3)' },
  cobble: { surface: 'stone', edge: 'raised', rim: '#efe6d4' },
  flagstone: { surface: 'stone', edge: 'raised', rim: '#f2ebdb' },
  stone: { surface: 'stone', edge: 'raised', rim: '#efe9dc' },
  tile: { surface: 'stone', edge: 'raised', rim: '#fff0d0' },
  planks: { surface: 'wood', edge: 'raised', rim: '#efc58f' },
  planks_dark: { surface: 'wood', edge: 'raised', rim: '#c58d5c' },
  planks_pale: { surface: 'wood', edge: 'raised', rim: '#f4d9ad' },
  deck: { surface: 'wood', edge: 'raised', rim: '#d9c0a0' },
  water: { surface: 'water', edge: 'water' },
  carpet: { surface: 'carpet', edge: 'raised', rim: '#ffffff' },
};

export const surfaceOfKind = (k) => (GROUND_KINDS[k] ? GROUND_KINDS[k].surface : 'grass');

function pathFromPoly(ctx, poly, px, ox, oz) {
  ctx.beginPath();
  poly.forEach(([x, z], i) => (i ? ctx.lineTo((x + ox) * px, (z + oz) * px) : ctx.moveTo((x + ox) * px, (z + oz) * px)));
  ctx.closePath();
}

function grassBlade(ctx, x, y, len, ang, col, w) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + Math.cos(ang) * len * 0.5 + len * 0.15, y + Math.sin(ang) * len * 0.5, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
  ctx.stroke();
}

/** soft dark blurred rectangle / ellipse (contact shadow baked into ground). */
function softShadow(ctx, kind, a, b, c, d, strength, px, ox, oz, blur, color = '30,22,40') {
  const far = 20000;
  ctx.save();
  ctx.shadowColor = `rgba(${color},${strength})`;
  ctx.shadowBlur = blur * px;
  ctx.shadowOffsetX = far;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  if (kind === 'rect') ctx.roundRect((a + ox) * px - far, (b + oz) * px, c * px, d * px, Math.min(c, d) * 0.3 * px);
  else ctx.ellipse((a + ox) * px - far, (b + oz) * px, c * px, d * px, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function paintRug(ctx, r, px, ox, oz, seed) {
  const rng = mulberry32(seed);
  const [x, z, w, h] = r.rect;
  const cols = r.colors || ['#b4533f', '#f1dfb4', '#4f7a6a'];
  const style = r.style || 'floral';
  const X = (x + ox) * px, Z = (z + oz) * px, W = w * px, H = h * px;
  const round = style === 'round';
  // soft shadow
  ctx.save();
  ctx.shadowColor = 'rgba(40,24,18,0.35)';
  ctx.shadowBlur = 0.2 * px;
  ctx.shadowOffsetY = 0.05 * px;
  ctx.fillStyle = cols[0];
  ctx.beginPath();
  if (round) ctx.ellipse(X + W / 2, Z + H / 2, W / 2, H / 2, 0, 0, Math.PI * 2);
  else ctx.roundRect(X, Z, W, H, 0.12 * px);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  if (round) ctx.ellipse(X + W / 2, Z + H / 2, W / 2, H / 2, 0, 0, Math.PI * 2);
  else ctx.roundRect(X, Z, W, H, 0.12 * px);
  ctx.clip();
  ctx.fillStyle = cols[0];
  ctx.fillRect(X, Z, W, H);
  const inset = (k) => {
    const m = k * px;
    ctx.beginPath();
    if (round) ctx.ellipse(X + W / 2, Z + H / 2, W / 2 - m, H / 2 - m, 0, 0, Math.PI * 2);
    else ctx.roundRect(X + m, Z + m, W - m * 2, H - m * 2, 0.08 * px);
  };
  inset(0.16);
  ctx.fillStyle = cols[1];
  ctx.fill();
  inset(0.3);
  ctx.fillStyle = cols[2];
  ctx.fill();
  inset(0.44);
  ctx.fillStyle = cols[0];
  ctx.fill();
  // field pattern
  if (style === 'striped') {
    ctx.fillStyle = cols[1];
    const n = Math.floor(h * 2);
    for (let i = 0; i < n; i++) if (i % 2 === 0) ctx.fillRect(X + 0.5 * px, Z + (0.5 + (i / n) * (h - 1)) * px, W - 1 * px, (h - 1) * px / n * 0.6);
  } else {
    const nx = Math.max(2, Math.round(w / 0.9));
    const nz = Math.max(2, Math.round(h / 0.9));
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const cx = X + (0.55 + ((i + 0.5) / nx) * (w - 1.1)) * px;
        const cz = Z + (0.55 + ((j + 0.5) / nz) * (h - 1.1)) * px;
        const s = 0.24 * px;
        ctx.fillStyle = (i + j) % 2 ? cols[1] : cols[2];
        ctx.beginPath();
        ctx.moveTo(cx, cz - s); ctx.lineTo(cx + s, cz); ctx.lineTo(cx, cz + s); ctx.lineTo(cx - s, cz);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = cols[0];
        ctx.beginPath();
        ctx.arc(cx, cz, s * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // woven texture
  for (let i = 0; i < 120 + w * h * 20; i++) {
    ctx.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(X + rng() * W, Z + rng() * H, 2, 2);
  }
  ctx.restore();
  // fringe
  if (!round) {
    ctx.strokeStyle = cols[1];
    ctx.lineWidth = Math.max(1, 0.025 * px);
    for (let i = 0; i < w * 5; i++) {
      const fx = X + ((i + 0.5) / (w * 5)) * W;
      for (const fy of [Z, Z + H]) {
        const dir = fy === Z ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + (rng() - 0.5) * 3, fy + dir * 0.1 * px);
        ctx.stroke();
      }
    }
  }
}

/**
 * @param {object} p
 * @param {number} p.width @param {number} p.height  area size in tiles
 * @param {number} p.margin  extra tiles painted around the area
 * @param {number} p.px  pixels per tile
 * @param {string} p.season
 * @param {object} p.def  area def ground block { base, ops }
 * @param {Array} p.bakes baked shadows/rugs collected from props: {type:'rect'|'ellipse'|'rug', ...}
 * @param {object} p.tex texture library
 * @param {'exterior'|'interior'} p.kind
 */
export function paintGround(p) {
  const { width, height, margin, season, def, bakes = [], tex, kind } = p;
  let px = p.px;
  const maxSide = 4096;
  const totalW = width + margin * 2;
  const totalH = height + margin * 2;
  while (Math.max(totalW, totalH) * px > maxSide) px -= 2;
  const canvas = makeCanvas(Math.round(totalW * px), Math.round(totalH * px));
  const ctx = canvas.getContext('2d');
  const rng = mulberry32(def.seed || 5);
  const ox = margin;
  const oz = margin;
  const patternFor = (k) => {
    const pk = k === 'meadow' ? 'meadow' : k;
    const c = tex.groundPattern(pk === 'carpet' ? 'planks_dark' : pk, season, px, 8);
    return ctx.createPattern(c, 'repeat');
  };

  // 1. base
  const baseKind = def.base || (kind === 'interior' ? 'planks' : 'grass');
  ctx.fillStyle = patternFor(baseKind);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // large-scale painterly variation to hide pattern repeat (exterior grass only)
  if (kind === 'exterior' && baseKind === 'grass') {
    const P = SEASON_GRASS[season];
    const lightc = hexToRgb(P.light), darkc = hexToRgb(P.dark);
    for (let i = 0; i < 46; i++) {
      const x = rng() * canvas.width, y = rng() * canvas.height, r = (3 + rng() * 7) * px;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const c = rng() < 0.5 ? lightc : darkc;
      g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${season === 'winter' ? 0.2 : 0.2})`);
      g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. ops
  const ops = def.ops || [];
  const edges = [];
  const covers = []; // later raised/solid ops hide fuzz of earlier ones
  ops.forEach((op, idx) => {
    if (op.rug) {
      paintRug(ctx, op.rug, px, ox, oz, (def.seed || 5) + idx * 13);
      return;
    }
    const k = op.kind;
    const meta = GROUND_KINDS[k];
    if (!meta) throw new Error(`unknown ground kind "${k}"`);
    const poly = opToPoly(op, idx + 3);
    const style = op.edge || meta.edge;
    if (style === 'raised' || style === 'water') covers.push({ idx, poly });
    ctx.save();
    if (style === 'water') {
      paintWaterBed(ctx, poly, px, ox, oz, season);
      ctx.restore();
      return;
    }
    if (style === 'raised') {
      ctx.shadowColor = 'rgba(28,20,34,0.5)';
      ctx.shadowBlur = 0.26 * px;
      ctx.shadowOffsetX = 0.05 * px;
      ctx.shadowOffsetY = 0.08 * px;
    } else if (style === 'soft') {
      ctx.shadowColor = meta.halo || 'rgba(60,50,30,0.3)';
      ctx.shadowBlur = 0.4 * px;
    }
    ctx.fillStyle = patternFor(k);
    pathFromPoly(ctx, poly, px, ox, oz);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    // inner rim light + dark outer line
    pathFromPoly(ctx, poly, px, ox, oz);
    ctx.lineJoin = 'round';
    if (style === 'raised') {
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(40,28,22,0.38)';
      ctx.lineWidth = 0.1 * px;
      pathFromPoly(ctx, poly, px, ox, oz);
      ctx.stroke();
      ctx.strokeStyle = (meta.rim || '#fff') ;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 0.04 * px;
      ctx.translate(-0.03 * px, -0.04 * px);
      pathFromPoly(ctx, poly, px, ox, oz);
      ctx.stroke();
      ctx.restore();
    } else if (style === 'soft') {
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = meta.rim || '#fff';
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 0.14 * px;
      pathFromPoly(ctx, poly, px, ox, oz);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    if (meta.fuzz && op.fuzz !== false && style !== 'none') edges.push({ poly, kind: k, idx });
  });

  // 3. grass fuzz along soft edges (drawn after every op so later paths do not hide it)
  if (kind === 'exterior') {
    const P = SEASON_GRASS[season];
    const gcols = [P.dark, P.base, P.light].map((c) => c);
    const r2 = mulberry32((def.seed || 5) * 31);
    for (const { poly, kind: k, idx: eIdx } of edges) {
      const pts = perimeterPoints(poly, 0.17);
      const later = covers.filter((c) => c.idx > eIdx);
      for (const [x, z, nx, nz] of pts) {
        if (later.some((c) => pointInPoly(x, z, c.poly))) continue;
        // skip fuzz that lies inside another raised/solid kind later (cheap: random thinning)
        if (r2() < 0.18) continue;
        const bx = (x + ox + nx * (0.02 + r2() * 0.1)) * px;
        const bz = (z + oz + nz * (0.02 + r2() * 0.1)) * px;
        const n = 2 + ((r2() * 3) | 0);
        for (let q = 0; q < n; q++) {
          const ang = -Math.PI / 2 + (r2() - 0.5) * 1.4;
          grassBlade(ctx, bx + (r2() - 0.5) * 0.12 * px, bz + (r2() - 0.5) * 0.1 * px, (0.1 + r2() * 0.13) * px, ang, jitterHex(gcols[(r2() * 3) | 0], r2, 0.06), Math.max(1.2, 0.04 * px));
        }
        if (r2() < 0.1 && season !== 'winter' && (k === 'dirt' || k === 'gravel')) {
          ctx.fillStyle = jitterHex(P.accent[(r2() * P.accent.length) | 0], r2, 0.05);
          ctx.beginPath();
          ctx.arc(bx + nx * 0.05 * px, bz + nz * 0.05 * px, Math.max(1.2, 0.03 * px), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // 4. baked contact shadows / rugs from props
  for (const b of bakes) {
    if (b.type === 'rect') softShadow(ctx, 'rect', b.x, b.z, b.w, b.d, b.a ?? 0.45, px, ox, oz, b.blur ?? 0.35, b.color);
    else if (b.type === 'ellipse') softShadow(ctx, 'ellipse', b.x, b.z, b.rx, b.rz, b.a ?? 0.4, px, ox, oz, b.blur ?? 0.4, b.color);
    else if (b.type === 'rug') paintRug(ctx, b.rug, px, ox, oz, b.seed || 1);
    else if (b.type === 'paint') b.fn(ctx, px, ox, oz, season);
  }

  // 5. outer skirt: gently darken + cool the margin so the diorama edge falls away softly
  if (kind === 'exterior' && margin > 0) {
    ctx.save();
    const x0 = ox * px, z0 = oz * px, x1 = (ox + width) * px, z1 = (oz + height) * px;
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.rect(x0, z0, x1 - x0, z1 - z0);
    ctx.clip('evenodd');
    ctx.fillStyle = season === 'winter' ? 'rgba(150,175,205,0.22)' : 'rgba(30,70,40,0.28)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  if (kind === 'interior' && margin > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.rect(ox * px, oz * px, width * px, height * px);
    ctx.clip('evenodd');
    ctx.fillStyle = '#1b1312';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  return { canvas, px, margin };
}

function paintWaterBed(ctx, poly, px, ox, oz, season) {
  // bank: wet earth halo, then foam + bed gradient clipped to the water shape
  ctx.save();
  ctx.lineJoin = 'round';
  pathFromPoly(ctx, poly, px, ox, oz);
  ctx.shadowColor = season === 'winter' ? 'rgba(120,140,160,0.6)' : 'rgba(76,58,34,0.62)';
  ctx.shadowBlur = 0.55 * px;
  ctx.fillStyle = '#1d6b7c';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.restore();
  ctx.save();
  pathFromPoly(ctx, poly, px, ox, oz);
  ctx.clip();
  const b = polyBounds(poly);
  const g = ctx.createLinearGradient(0, (b.z0 + oz) * px, 0, (b.z1 + oz) * px);
  g.addColorStop(0, '#2c8da0');
  g.addColorStop(1, '#1f7388');
  ctx.fillStyle = g;
  ctx.fillRect((b.x0 + ox) * px, (b.z0 + oz) * px, (b.x1 - b.x0) * px, (b.z1 - b.z0) * px);
  // shallow rim: wide pale stroke clipped
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(150,224,214,0.55)';
  ctx.lineWidth = 0.9 * px;
  pathFromPoly(ctx, poly, px, ox, oz);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(190,240,232,0.55)';
  ctx.lineWidth = 0.42 * px;
  ctx.stroke();
  ctx.restore();
  // foam line
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = Math.max(1.5, 0.07 * px);
  ctx.lineJoin = 'round';
  pathFromPoly(ctx, poly, px, ox, oz);
  ctx.stroke();
  ctx.restore();
  // pebbles on bank
  const r = mulberry32(poly.length * 7 + 3);
  const pts = perimeterPoints(poly, 0.55);
  for (const [x, z, nx, nz] of pts) {
    if (r() < 0.45) continue;
    const bx = (x + ox + nx * (0.12 + r() * 0.3)) * px;
    const bz = (z + oz + nz * (0.12 + r() * 0.3)) * px;
    const rad = (0.04 + r() * 0.06) * px;
    ctx.fillStyle = 'rgba(70,55,40,0.4)';
    ctx.beginPath();
    ctx.ellipse(bx + rad * 0.3, bz + rad * 0.3, rad * 1.2, rad * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = jitterHex(['#cbbfa8', '#a8a095', '#d8cdb8'][(r() * 3) | 0], r, 0.08);
    ctx.beginPath();
    ctx.ellipse(bx, bz, rad * 1.2, rad * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
