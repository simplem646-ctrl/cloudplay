// Inline SVG snippets (strings) used by HUD, title and menus.
const S = (vb, body, extra = '') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" ${extra}>${body}</svg>`;
const OUT = 'stroke="#5a3d2b" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';

export const SEASON_SVG = {
  spring: S('0 0 48 48', `<circle cx="24" cy="24" r="22" fill="#d9f2c4" ${OUT}/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="24" cy="12.5" rx="5.2" ry="7.5" fill="#ffb7cf" ${OUT} transform="rotate(${a} 24 24)"/>`).join('')}<circle cx="24" cy="24" r="4.6" fill="#f4c542" ${OUT}/>`),
  summer: S('0 0 48 48', `<circle cx="24" cy="24" r="22" fill="#cdeeff" ${OUT}/>${Array.from({ length: 8 }, (_, i) => `<path d="M24 5 L27 12 L21 12Z" fill="#f9a825" ${OUT} transform="rotate(${i * 45} 24 24)"/>`).join('')}<circle cx="24" cy="24" r="10" fill="#ffd23f" ${OUT}/><circle cx="21" cy="22" r="1.6" fill="#5a3d2b"/><circle cx="27" cy="22" r="1.6" fill="#5a3d2b"/><path d="M21 26.5q3 3 6 0" fill="none" stroke="#5a3d2b" stroke-width="1.8" stroke-linecap="round"/>`),
  autumn: S('0 0 48 48', `<circle cx="24" cy="24" r="22" fill="#fde3bd" ${OUT}/><path d="M24 8 C30 13 38 14 37 22 C41 25 38 31 33 31 C34 36 29 38 24 36 C19 38 14 36 15 31 C10 31 7 25 11 22 C10 14 18 13 24 8Z" fill="#e8923a" ${OUT}/><path d="M24 14 V40 M24 26 L31 21 M24 30 L17 25" fill="none" stroke="#8a3d1a" stroke-width="2" stroke-linecap="round"/>`),
  winter: S('0 0 48 48', `<circle cx="24" cy="24" r="22" fill="#dff1ff" ${OUT}/>${[0, 60, 120].map((a) => `<g transform="rotate(${a} 24 24)"><path d="M24 7V41" stroke="#5aa0d0" stroke-width="3" stroke-linecap="round"/><path d="M19.5 11L24 15.5L28.5 11M19.5 37L24 32.5L28.5 37" fill="none" stroke="#5aa0d0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g>`).join('')}<circle cx="24" cy="24" r="3.2" fill="#fff" stroke="#5aa0d0" stroke-width="2"/>`),
};

const cloud = (fill = '#fff') => `<path d="M14 36h20a8 8 0 0 0 .8-16A11 11 0 0 0 13.5 22 7 7 0 0 0 14 36Z" fill="${fill}" ${OUT}/>`;
export const WEATHER_SVG = {
  sunny: S('0 0 48 48', `${Array.from({ length: 8 }, (_, i) => `<path d="M24 4 L26.5 10 L21.5 10Z" fill="#f9a825" ${OUT} transform="rotate(${i * 45} 24 24)"/>`).join('')}<circle cx="24" cy="24" r="10" fill="#ffd23f" ${OUT}/>`),
  cloudy: S('0 0 48 48', `<circle cx="32" cy="14" r="7" fill="#ffd23f" ${OUT}/>${cloud('#f2f6fa')}`),
  rain: S('0 0 48 48', `${cloud('#cfdbe8')}${[16, 24, 32].map((x) => `<path d="M${x} 39 l-2 6" stroke="#3f8fd0" stroke-width="3" stroke-linecap="round"/>`).join('')}`),
  storm: S('0 0 48 48', `${cloud('#a9b4c6')}<path d="M26 32 l-6 8 h5 l-3 7 9-10 h-5 l3-5Z" fill="#ffd23f" ${OUT}/>`),
  snow: S('0 0 48 48', `${cloud('#eef6ff')}${[15, 24, 33].map((x) => `<circle cx="${x}" cy="42" r="2.4" fill="#fff" stroke="#6aa8d8" stroke-width="1.6"/>`).join('')}`),
};

export const MOON_SVG = S('0 0 32 32', `<path d="M21 4a12 12 0 1 0 7 20A10 10 0 0 1 21 4Z" fill="#ffe9a8" ${OUT}/>`);
export const COIN_SVG = S('0 0 40 40', `<circle cx="20" cy="20" r="16" fill="#f4c542" ${OUT}/><circle cx="20" cy="20" r="11" fill="#ffdf6e" stroke="#c99a1e" stroke-width="2"/><path d="M20 12v16M16 16.5c0-2.5 8-2.5 8 0s-8 3-8 5.500 8 2.500 8 0" fill="none" stroke="#b07f12" stroke-width="2.4" stroke-linecap="round"/>`);
export const FLAME_SVG = S('0 0 40 40', `<defs><radialGradient id="lbfl" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#fff6c0"/><stop offset=".5" stop-color="#ffc844"/><stop offset="1" stop-color="#f08a2a"/></radialGradient></defs><path d="M20 3C24 11 33 16 33 26a13 13 0 0 1-26 0C7 19 12 17 14 11c3 3 3 6 4 7 2-4 1-10 2-15Z" fill="url(#lbfl)" ${OUT}/><path d="M20 22c3 3 5 5 5 8a5 5 0 0 1-10 0c0-3 3-5 5-8Z" fill="#fff6c8" opacity=".85"/>`);
export const LANTERN_SVG = S('0 0 40 40', `<path d="M15 6h10M20 3v4" stroke="#5a3d2b" stroke-width="2.4" stroke-linecap="round"/><path d="M13 9h14l3 4v14l-3 4H13l-3-4V13Z" fill="#ffd978" ${OUT}/><path d="M20 14c3 3 4 5 4 8a4 4 0 0 1-8 0c0-3 2-5 4-8Z" fill="#fff3b0" stroke="#e08a2a" stroke-width="1.5"/><path d="M13 35h14" stroke="#5a3d2b" stroke-width="2.6" stroke-linecap="round"/>`);
export const HEART_SVG = (fill = '#e0607e') => S('0 0 32 32', `<path d="M16 28C5 20 3 13 3 10a6.500 6.500 0 0 1 13-2 6.500 6.500 0 0 1 13 2c0 3-2 10-13 18Z" fill="${fill}" ${OUT}/>${fill === '#e0607e' ? '<ellipse cx="9.500" cy="10" rx="2.200" ry="3" fill="#fff" opacity=".55" transform="rotate(35 9.500 10)"/>' : ''}`);
export const STAR_SVG = S('0 0 32 32', `<path d="M16 3l4 8.500 9 1.200-6.600 6.300 1.700 9L16 23.600 7.900 28l1.700-9L3 12.700l9-1.200Z" fill="#f4c542" ${OUT}/>`);
export const LOCK_SVG = S('0 0 32 32', `<rect x="7" y="14" width="18" height="14" rx="3" fill="#c79a6b" ${OUT}/><path d="M11 14v-3a5 5 0 0 1 10 0v3" fill="none" stroke="#5a3d2b" stroke-width="2.4"/>`);
export const CAKE_SVG = S('0 0 32 32', `<path d="M6 17h20v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z" fill="#ffd0dc" ${OUT}/><path d="M6 17c3 3 5-1 7 2s4-2 6 1 5-1 7 0v-3a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3Z" fill="#fff" ${OUT}/><path d="M16 13V8" stroke="#5a3d2b" stroke-width="2.200" stroke-linecap="round"/><path d="M16 3c2 2 2 3 2 4a2 2 0 0 1-4 0c0-1 1-2 2-4Z" fill="#ffc844" stroke="#e08a2a" stroke-width="1.200"/>`);
export const BOOK_SVG = S('0 0 32 32', `<path d="M5 6h9a2 2 0 0 1 2 2v19a3 3 0 0 0-3-3H5ZM27 6h-9a2 2 0 0 0-2 2v19a3 3 0 0 1 3-3h8Z" fill="#fff9ea" ${OUT}/>`);
