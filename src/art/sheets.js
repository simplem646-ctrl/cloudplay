// Sheet assembly: frames -> a sheet PixelBuffer following src/data/sheet_layout.js exactly.
import { PixelBuffer } from './pixelbuffer.js';
import { CHAR_SHEET } from '../data/sheet_layout.js';
import { renderSpriteFrame } from './sprite.js';

const KINDS = ['stand', 'stepA', 'stepB'];

export function buildCharacterSheet(ch) {
  const L = CHAR_SHEET;
  const sheet = new PixelBuffer(L.cols * L.frameW, L.rows * L.frameH);
  const put = (f, col, row) => sheet.blit(f, col * L.frameW, row * L.frameH);
  for (const [dir, row] of Object.entries(L.dirRow)) {
    KINDS.forEach((k, col) => put(renderSpriteFrame(ch, dir, k), col, row));
  }
  for (const [pose, col] of Object.entries(L.poseCol)) put(renderSpriteFrame(ch, 'down', pose), col, L.poseRow);
  for (const [dir, col] of Object.entries(L.sitCol)) put(renderSpriteFrame(ch, dir, 'sit'), col, L.sitRow);
  return sheet;
}
