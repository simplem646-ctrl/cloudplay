// Pure helpers (Node-testable): hearts, pagination, calendar grid, birthdays, sell prices, data extraction.
import { SEASONS, WEEKDAYS, DAYS_PER_SEASON } from './../core/registry.js';
import { AFFECTION } from '../core/constants.js';

/** Affection (0..1000) -> { full: 0..10, half: bool, hearts: 0..10 }. */
export function heartsFor(aff) {
  const a = Math.max(0, Math.min(AFFECTION.max, Number(aff) || 0));
  const per = AFFECTION.perHeart;
  const full = Math.min(AFFECTION.maxHearts, Math.floor(a / per));
  const half = full < AFFECTION.maxHearts && a - full * per >= per / 2;
  return { full, half, hearts: full + (half ? 0.5 : 0) };
}

/** Split lines (paragraphs) into pages of at most `maxChars` characters; a long paragraph is split on spaces. */
export function paginate(lines, maxChars = 280) {
  const pages = [];
  let cur = [];
  let used = 0;
  const flush = () => { if (cur.length) pages.push(cur); cur = []; used = 0; };
  for (const raw of Array.isArray(lines) ? lines : [String(lines || '')]) {
    let para = String(raw == null ? '' : raw);
    while (para.length > maxChars) {
      let cut = para.lastIndexOf(' ', maxChars);
      if (cut < maxChars * 0.5) cut = maxChars;
      const head = para.slice(0, cut).trim();
      if (used + head.length > maxChars) flush();
      cur.push(head); used += head.length;
      flush();
      para = para.slice(cut).trim();
    }
    if (used + para.length > maxChars && cur.length) flush();
    cur.push(para); used += para.length + 20;
  }
  flush();
  return pages.length ? pages : [['']];
}

/** Calendar grid for one season: 4 rows x 7 columns of { day, weekday }. Every season starts on Monday. */
export function calendarGrid() {
  const rows = [];
  for (let r = 0; r < DAYS_PER_SEASON / 7; r++) {
    rows.push(WEEKDAYS.map((wd, c) => ({ day: r * 7 + c + 1, weekday: wd })));
  }
  return rows;
}

const asList = (x) => (Array.isArray(x) ? x : x && typeof x === 'object' ? Object.values(x) : []);

/** Birthdays in a season (index 0..3): [{ day, npc, name }] sorted by day. */
export function birthdaysIn(season, npcs) {
  const sn = SEASONS[season];
  return asList(npcs).filter((n) => n && n.birthday && n.birthday.season === sn)
    .map((n) => ({ day: n.birthday.day, npc: n.id, name: n.name || n.id })).sort((a, b) => a.day - b.day);
}

/** Festivals in a season: [{ day, id, name }] sorted by day. */
export function festivalsIn(season, festivals) {
  const sn = SEASONS[season];
  return asList(festivals).filter((f) => f && f.date && f.date.season === sn)
    .map((f) => ({ day: f.date.day, id: f.id, name: f.name || f.id })).sort((a, b) => a.day - b.day);
}

/** Sell price shown for an item (0 when unsellable). */
export function sellPrice(def) {
  const p = def && def.price && def.price.sell;
  return Number.isFinite(p) ? p : 0;
}
export const isUsable = (def) => !!def && !def.key && (def.category === 'food' || (typeof def.energy === 'number' && def.energy !== 0));

/** Collect forage item ids from a ForageTbl ({area:{season:[{item,weight}]}}); null items skipped. */
export function forageIds(tbl) {
  const out = new Set();
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      if (typeof v.item === 'string') out.add(v.item);
      else Object.values(v).forEach(walk);
    }
  };
  walk(tbl);
  return [...out];
}

/** Which of the 7 exterior areas does an area map to (interiors -> their exterior neighbour)? */
export function mapAreaFor(areaId, areas) {
  const a = areas[areaId];
  if (!a) return null;
  if (a.kind === 'exterior') return areaId;
  const n = (a.neighbors || []).find((id) => areas[id] && areas[id].kind === 'exterior');
  return n || null;
}

/** Format an integer with thousands separators. */
export const fmtNum = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
