// Composes one portrait: back hair -> body -> head (ears, face, features, front hair, brows,
// accessories, marks) with a per-expression head tilt, then a sticker outline.
import { W, H, SS, makeCanvas, setSilhouette } from './util.js';
import { SPECS } from './specs.js';
import { EXPR } from './expressions.js';
import { geom, drawEars, drawFace, drawBlush, drawNose, drawSkinExtras } from './parts/face.js';
import { drawEyes } from './parts/eyes.js';
import { drawBrows, drawMouth } from './parts/features.js';
import { buildHair, drawHairBack, drawHairFront, drawHairAccessories } from './parts/hair.js';
import { drawBody } from './parts/body.js';
import { drawGlasses, drawHoops, drawBeard, drawMoustache } from './parts/accessories.js';
import { drawMarks } from './parts/marks.js';

const hairCache = new Map();
const PIVOT = [256, 430];

/** Draw the portrait art (no outline) into ctx, which must be W*SS x H*SS. */
export function paint(ctx, id, expression, opts = {}) {
  const spec = SPECS[id];
  const E = EXPR[expression] || EXPR.neutral;
  const G = geom(spec);
  let hair = hairCache.get(id);
  if (!hair) { hair = buildHair(spec); hairCache.set(id, hair); }
  const ex = spec.extras || {};

  ctx.save();
  ctx.setTransform(SS, 0, 0, SS, 0, 0);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const head = (fn) => {
    ctx.save();
    ctx.translate(PIVOT[0] + E.dx, PIVOT[1] + E.dy);
    ctx.rotate((E.tilt * Math.PI) / 180);
    ctx.translate(-PIVOT[0], -PIVOT[1]);
    fn();
    ctx.restore();
  };

  head(() => drawHairBack(ctx, hair, spec));
  drawBody(ctx, G, spec, opts);
  head(() => {
    drawEars(ctx, G, spec);
    if (ex.hoops) drawHoops(ctx, G, spec);
    drawFace(ctx, G, spec, hair);
    drawBlush(ctx, G, spec, E.blush);
    drawSkinExtras(ctx, G, spec);
    drawNose(ctx, G, spec);
    drawEyes(ctx, G, spec, E);
    if (ex.beard) drawBeard(ctx, G, spec);
    drawMouth(ctx, G, spec, E);
    if (ex.moustache || ex.beard) drawMoustache(ctx, G, spec, !!ex.moustache);
    drawHairFront(ctx, hair, spec);
    drawHairAccessories(ctx, hair, spec);
    drawBrows(ctx, G, spec, E);
    if (ex.glasses) drawGlasses(ctx, G, spec);
    drawMarks(ctx, G, spec, E);
  });
  ctx.restore();
}

/**
 * Render a finished portrait canvas (W*SS x H*SS). outline adds the warm-white sticker edge:
 * a first vector pass strokes every inked shape thick in the sticker colour, then the art
 * is painted on top (no pixel read-back, so it stays cheap on GPU canvases).
 */
export function renderPortrait(id, expression, opts = {}) {
  const out = makeCanvas(W * SS, H * SS, true);
  const octx = out.getContext('2d');
  if (opts.outline !== false) {
    setSilhouette('rgb(255,248,235)');
    try { paint(octx, id, expression, opts); } finally { setSilhouette(null); }
  }
  paint(octx, id, expression, opts);
  return out;
}
