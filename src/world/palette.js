// Bellhaven season palettes + shared material colours (pure data).
// Reference palette (docs/game/01 section 1): cream #f6ecd2, parchment #e8d5a8, wood #7a4f2e, dark brown #3b2a1f,
// ink navy #1d2340, sky #8fd0f0, grass #6cc24a, deep grass #3f8f3a, blossom #f4b6c8, sunset #f08a4b,
// harbor blue #4a90c8, brick #b5503c, slate roof #4b5a78, gold #f2b84b.

export const SEASON_PAL = {
  spring: {
    winter: false,
    grass: '#74ca4f', grassL: '#93e066', grassD: '#58b042', grassX: '#3f9a3c', speck: '#b4f07c',
    leaf: { l: '#9be870', m: '#62c446', d: '#3d9a3a', o: '#27693a' },
    leaf2: { l: '#b3ee82', m: '#7bd04f', d: '#4aa83e', o: '#2f7a3a' },
    cherry: { l: '#fde0ea', m: '#f6b9cc', d: '#e08fb0', o: '#a84f7c' },
    pine: { l: '#4fae6a', m: '#2f8a58', d: '#1f6a48', o: '#154a3a' },
    bush: { l: '#8fe06a', m: '#5cbf45', d: '#389437', o: '#245f33' },
    bloom: ['#f4b6c8', '#fff3c4', '#ffffff', '#c9a8f0'],
    fallen: ['#f4b6c8', '#fbd0dc'], // petals
    sky: '#8fd0f0',
  },
  summer: {
    winter: false,
    grass: '#5cba3a', grassL: '#7acf4c', grassD: '#459a33', grassX: '#2f7c2e', speck: '#9be25c',
    leaf: { l: '#6fcc48', m: '#3fa536', d: '#2a7a2e', o: '#1a5028' },
    leaf2: { l: '#82d654', m: '#4ab63c', d: '#2f8530', o: '#1d5a2a' },
    cherry: { l: '#6fcc48', m: '#3fa536', d: '#2a7a2e', o: '#1a5028' },
    pine: { l: '#3f9e5c', m: '#257a4c', d: '#175a3a', o: '#0f3c2e' },
    bush: { l: '#6fcc48', m: '#3fa536', d: '#2a7a2e', o: '#1a5028' },
    bloom: ['#ff6b8a', '#ffd23f', '#ffffff', '#ff9f43', '#6ab0ff'],
    fallen: [],
    sky: '#7cc8f4',
  },
  autumn: {
    winter: false,
    grass: '#a9b43f', grassL: '#c6c657', grassD: '#8c9a34', grassX: '#6f8230', speck: '#d9d06a',
    leaf: { l: '#f7c04e', m: '#ee8a3e', d: '#c4582a', o: '#7c3420' },
    leaf2: { l: '#ffd266', m: '#f4a23c', d: '#d8702c', o: '#8c4220' },
    cherry: { l: '#f6a35a', m: '#e0693a', d: '#b54430', o: '#702a28' },
    pine: { l: '#4a9a58', m: '#2f7a4c', d: '#1f5a3e', o: '#143c30' },
    bush: { l: '#d9b84a', m: '#c0883a', d: '#8f5a2c', o: '#5a381f' },
    bloom: ['#ff9f43', '#ffd23f', '#e0583a', '#c56fd9'],
    fallen: ['#ee8a3e', '#f7c04e', '#c4582a', '#8a4e2a'],
    sky: '#9ccbe8',
  },
  winter: {
    winter: true,
    grass: '#eef4fb', grassL: '#ffffff', grassD: '#d3e2f2', grassX: '#b3cae6', speck: '#ffffff',
    leaf: { l: '#fbfdff', m: '#dce9f6', d: '#b4cbe4', o: '#6c5448' },
    leaf2: { l: '#fbfdff', m: '#dce9f6', d: '#b4cbe4', o: '#6c5448' },
    cherry: { l: '#fbfdff', m: '#dce9f6', d: '#b4cbe4', o: '#6c5448' },
    pine: { l: '#3f8a62', m: '#2a6a50', d: '#1b4a3c', o: '#10302c' },
    bush: { l: '#e4eef8', m: '#c3d6ea', d: '#9db7d4', o: '#5e5a66' },
    bloom: ['#ffffff'],
    fallen: [],
    sky: '#b9d8f0',
    snow: '#f6faff', snowS: '#d6e4f3', snowD: '#a9c2e0',
  },
};

export const SNOW = { l: '#ffffff', m: '#f1f6fc', s: '#d3e2f2', d: '#a9c2e0' };

// Water
export const WATER = {
  base: '#58a8e0', light: '#9ad8f6', dark: '#3d80c4', deep: '#2f66a8', foam: '#f4fbff',
  pond: '#5fb4e0', pondDark: '#3f8cc4',
};

// Material colours reused by many painters
export const MAT = {
  wood: '#7a4f2e', woodL: '#a56c3c', woodD: '#4f3220', woodX: '#3b2a1f',
  honey: '#c98b48', honeyL: '#e0a85e', honeyD: '#9a6430',
  cream: '#f6ecd2', parchment: '#e8d5a8', navy: '#1d2340',
  brick: '#b5503c', slate: '#4b5a78', gold: '#f2b84b', sunset: '#f08a4b', harbor: '#4a90c8',
  stone: '#bdb7a8', stoneL: '#d8d2c2', stoneD: '#8e887a',
  iron: '#3e4f48', ironL: '#5d7468', ironD: '#27322e',
  glass: '#bfe6f6', glassL: '#e8f8ff', glassD: '#7fb6d8',
  white: '#f7f3ea',
};
