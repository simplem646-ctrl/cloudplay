// Expression parameter table. Each entry tweaks eyes, brows, mouth, blush, marks and head pose.
// Eye fields: type ('open'|'happy'|'closed'), open (lid height 0..1.2), lookX/lookY (-1..1, world),
//   innerDrop (angry slant), droop (sad slant), lowerUp (cheek push), iris/pupil scale, watery.
// Brow fields: raise (px up), angle (deg, + = inner end up), curve; browL/browR override per side (viewer's left/right).

export const EXPRESSIONS = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'shy', 'thinking', 'laugh', 'worried', 'smug'];

export const EXPR = {
  neutral: {
    eye: { open: 1, lookX: 0.05, lookY: 0.05 },
    brow: { raise: 0, angle: 2, curve: 3 },
    mouth: 'smile', blush: 0.28, tilt: 0, dx: 0, dy: 0, marks: [],
  },
  happy: {
    eye: { type: 'happy' },
    brow: { raise: 6, angle: 4, curve: 5 },
    mouth: 'grin', blush: 0.65, tilt: -3.5, dx: -2, dy: -4, marks: ['sparkle'],
  },
  sad: {
    eye: { open: 0.78, droop: 0.55, lookX: 0.15, lookY: 0.55, watery: true, lowerUp: 0.02 },
    brow: { raise: 3, angle: 16, curve: -1 },
    mouth: 'frown', blush: 0.18, tilt: 4, dx: 3, dy: 8, marks: ['tear'],
  },
  angry: {
    eye: { open: 0.74, innerDrop: 0.7, iris: 0.9, pupil: 0.85, lookX: 0, lookY: 0.1 },
    brow: { raise: -5, angle: -20, curve: 1 },
    mouth: 'shout', blush: 0.3, tilt: -1.5, dx: 0, dy: 2, marks: ['vein'],
  },
  surprised: {
    eye: { open: 1.16, iris: 0.8, pupil: 0.45, lookX: 0, lookY: 0 },
    brow: { raise: 13, angle: 3, curve: 6 },
    mouth: 'o', blush: 0.15, tilt: -1.5, dx: 0, dy: -8, marks: ['shock'],
  },
  shy: {
    eye: { open: 0.82, lookX: 0.75, lookY: 0.5, lowerUp: 0.08, watery: true },
    brow: { raise: 4, angle: 12, curve: 2 },
    mouth: 'wobble', blush: 1, tilt: 6, dx: 4, dy: 5, marks: ['shyLines'],
  },
  thinking: {
    eye: { open: 0.9, lookX: -0.7, lookY: -0.75 },
    brow: { raise: 0, angle: 0, curve: 3 },
    browL: { raise: 10, angle: -6, curve: 6 }, browR: { raise: -2, angle: 6, curve: 1 },
    mouth: 'side', blush: 0.18, tilt: -6, dx: -4, dy: 0, marks: ['dots'],
  },
  laugh: {
    eye: { type: 'laugh' },
    brow: { raise: 8, angle: 8, curve: 4 },
    mouth: 'laugh', blush: 0.75, tilt: -6, dx: -3, dy: -6, marks: ['joyTear', 'sparkle'],
  },
  worried: {
    eye: { open: 0.95, droop: 0.3, lookX: 0.25, lookY: 0.2, iris: 0.9 },
    brow: { raise: 7, angle: 18, curve: -2 },
    mouth: 'wavy', blush: 0.22, tilt: 2.5, dx: 2, dy: 3, marks: ['sweat'],
  },
  smug: {
    eye: { open: 0.52, lookX: 0.35, lookY: 0.05, lowerUp: 0.12 },
    brow: { raise: 0, angle: -4, curve: 4 },
    browL: { raise: 9, angle: -2, curve: 5 }, browR: { raise: -3, angle: -10, curve: 2 },
    mouth: 'smirk', blush: 0.35, tilt: 4.5, dx: 3, dy: 0, marks: [],
  },
};
