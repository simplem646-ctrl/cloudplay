// Pure data builders for the menu screens (no DOM, no canvas): importable in Node and tests.
// Scenes call these and only draw the result. See docs/game/api/menus.md.
import {
  SEASONS, SEASON_LABEL, WEEKDAYS, WEEKDAY_LABEL, SUBJECTS, SUBJECT_LABEL, TRAITS, TRAIT_LABEL, CLUB_LABEL,
  MAX_HEARTS, POINTS_PER_HEART, DAYS_PER_SEASON,
} from '../../core/constants.js';
import { formatTime12 } from '../../core/util.js';
import { wrapText } from '../../ui/font.js';
import { CAST, CAST_BY_ID, FRIEND_IDS, ROMANCE_IDS } from '../../data/cast.js';
import { FESTIVALS, EXAMS, EXAM_DAY_SUBJECTS, BREAKS } from '../../data/calendar.js';
import { ITEM_BY_ID } from '../../data/items.js';

const CAT_ORDER = ['food', 'study', 'gift', 'sport', 'misc', 'key'];
export const WEATHER_LABEL = { sunny: 'Sunny', cloudy: 'Cloudy', rain: 'Rainy', storm: 'Stormy', snow: 'Snowy' };
export const TEXT_SPEEDS = ['slow', 'normal', 'fast'];

export const heartsOf = (points) => Math.max(0, Math.min(MAX_HEARTS, Math.floor((points || 0) / POINTS_PER_HEART)));
export const prettify = (id) => String(id || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
export const dateText = (t, { weekday = true } = {}) => `${SEASON_LABEL[t.season]} ${t.day}${weekday ? ` (${WEEKDAYS[(t.day - 1) % 7]})` : ''}`;
export const weekdayName = (day) => WEEKDAY_LABEL[WEEKDAYS[(day - 1) % 7]] || WEEKDAYS[(day - 1) % 7];

export function formatPlayTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

// ------------------------------------------------------------------ friends
const GROUP_RANK = { partner: 0, romance: 1, friend: 2, other: 3 };

/** Romance status label for the friends tab. */
export function romanceStatus(state, id) {
  const r = state.romance || {};
  if (r.partner === id) return 'Dating';
  if ((r.exes || []).includes(id)) return 'Ex';
  const c = CAST_BY_ID[id];
  if (c && c.romanceable) {
    if (r.confessed && r.confessed[id]) return 'Confessed';
    return 'Crush?';
  }
  return '';
}

/**
 * Met characters sorted: partner, romance options, friends, others (then hearts desc, then name).
 * Entry: { id, name, short, group, points, hearts, birthday:{season,day}|null, birthdayLabel, bio, status, kind }.
 */
export function buildFriends(state, { cast = CAST } = {}) {
  const partner = state.romance && state.romance.partner;
  const out = [];
  for (const c of cast) {
    if (c.kind === 'player') continue;
    const rel = state.relationships && state.relationships[c.id];
    if (!rel || !rel.met) continue;
    const group = partner === c.id ? 'partner' : (c.romanceable || ROMANCE_IDS.includes(c.id)) ? 'romance' : FRIEND_IDS.includes(c.id) ? 'friend' : 'other';
    out.push({
      id: c.id, name: c.name, short: c.short || c.name, kind: c.kind, group,
      points: rel.friendship || 0, hearts: heartsOf(rel.friendship),
      birthday: c.birthday || null,
      birthdayLabel: c.birthday ? `${SEASON_LABEL[c.birthday.season]} ${c.birthday.day}` : '-',
      bio: c.role || '', status: romanceStatus(state, c.id),
    });
  }
  return out.sort((a, b) => GROUP_RANK[a.group] - GROUP_RANK[b.group] || b.points - a.points || a.name.localeCompare(b.name));
}

// ------------------------------------------------------------------ items
/** Bag as grid items sorted by category then name. */
export function buildItemList(inventory) {
  const rows = [];
  for (const [id, qty] of Object.entries(inventory || {})) {
    if (!(qty > 0)) continue;
    const it = ITEM_BY_ID[id] || { id, name: prettify(id), category: 'misc', icon: 'star', desc: '' };
    rows.push({
      id, label: it.name, icon: it.icon, qty, desc: it.desc || '', category: it.category,
      usable: !!(it.use && (it.category === 'food' || it.category === 'study')),
    });
  }
  const ci = (c) => { const i = CAT_ORDER.indexOf(c); return i < 0 ? CAT_ORDER.length : i; };
  return rows.sort((a, b) => ci(a.category) - ci(b.category) || a.label.localeCompare(b.label));
}

/** Human line for the result of `inventory.use`. */
export function useResultText(res, item) {
  if (!res || !res.ok) {
    const why = { not_usable: 'Nothing happens.', no_item: 'You do not have any.', not_found: 'You do not have any.' }[res && res.reason];
    return why || "Can't use that now.";
  }
  const e = res.effects || {};
  const bits = [];
  if (e.energy) bits.push(`Energy +${e.energy}`);
  if (e.stat) for (const [k, v] of Object.entries(e.stat)) bits.push(`${SUBJECT_LABEL[k] || TRAIT_LABEL[k] || prettify(k)} +${v}`);
  return `${item ? item.label : 'Item'}: ${bits.length ? bits.join(', ') : 'used'}.`;
}

// ------------------------------------------------------------------ status
export function buildStatus(state) {
  const p = state.player, s = state.school, t = state.time;
  const partner = state.romance && state.romance.partner;
  const pc = partner && CAST_BY_ID[partner];
  return {
    name: CAST_BY_ID.theo.name,
    dateLine: `Year ${t.year}  ${dateText(t)}`,
    time: formatTime12(t.minute),
    energy: { value: p.energy, max: p.maxEnergy },
    money: p.money,
    conduct: p.conduct,
    subjects: SUBJECTS.map((k) => ({ key: k, label: SUBJECT_LABEL[k], value: Math.round(p.subjects[k] || 0) })),
    traits: TRAITS.map((k) => ({ key: k, label: TRAIT_LABEL[k], value: Math.round(p.traits[k] || 0) })),
    club: s.club ? `${CLUB_LABEL[s.club] || prettify(s.club)}  rank ${s.clubRank}` : 'No club',
    job: s.job ? `${prettify(s.job)} (${s.jobShifts} shifts)` : 'No job',
    standing: `${prettify(s.standing)}, avg ${Math.round(s.average || 0)}`,
    spirit: s.spirit || 0,
    partner: pc ? { id: partner, name: pc.short, hearts: heartsOf(state.relationships[partner] && state.relationships[partner].friendship) } : null,
  };
}

// ------------------------------------------------------------------ journal
/** Quests (main first, then active, complete, failed; newest first inside a group). `defs` = { id: {title, summary, main, steps} }. */
export function buildJournal(state, defs = {}) {
  const ORDER = { active: 0, complete: 1, failed: 2 };
  const rows = Object.entries(state.quests || {}).map(([id, q]) => {
    const d = defs[id] || {};
    return {
      id, title: d.title || prettify(id), summary: d.summary || '', main: !!d.main, steps: d.steps || [],
      state: q.state || 'active', notes: q.notes || [], startedAbsDay: q.startedAbsDay || 0,
    };
  });
  return rows.sort((a, b) => (b.main - a.main) || (ORDER[a.state] - ORDER[b.state]) || (b.startedAbsDay - a.startedAbsDay) || a.title.localeCompare(b.title));
}

// ------------------------------------------------------------------ calendar
/** { [day]: { festival?, festivalBlurb?, festivalPlace?, exam?, examDay?, results?, breakDay?, breakName?, birthdays?: [names] } } for a season. */
export function buildCalendarData(state, season) {
  const data = {};
  const at = (d) => (data[d] ||= {});
  for (const f of FESTIVALS) {
    if (f.season !== season) continue;
    const [a, b = a] = f.days;
    for (let d = a; d <= b; d++) Object.assign(at(d), { festival: f.name, festivalBlurb: f.blurb, festivalCancels: !!f.classesCancelled });
  }
  for (const e of EXAMS) {
    if (e.season === season) e.days.forEach((d, i) => Object.assign(at(d), { exam: e.label.replace(/ \(Term \d\)/, ''), examId: e.id, examDay: i }));
  }
  for (const e of EXAMS) {
    // results can land in another season than the exams (never in the current data, kept generic)
    if (e.season === season && e.resultsDay) Object.assign(at(e.resultsDay), { results: `${e.label.replace(/ \(Term \d\)/, '')} results` });
  }
  for (const b of BREAKS) {
    if (b.season !== season) continue;
    for (let d = b.from; d <= b.to; d++) Object.assign(at(d), { breakDay: true, breakName: b.name });
  }
  for (const c of CAST) {
    if (!c.birthday || c.birthday.season !== season) continue;
    const met = c.kind === 'player' || (state.relationships && state.relationships[c.id] && state.relationships[c.id].met);
    if (!met) continue;
    (at(c.birthday.day).birthdays ||= []).push(c.kind === 'player' ? 'You' : c.short || c.name);
  }
  return data;
}

/** Detail lines (colour markup) for one day of a season. */
export function calendarDayLines(season, day, data = {}) {
  const d = data[day] || {};
  const out = [`${SEASON_LABEL[season]} ${day}, ${weekdayName(day)}`];
  if (d.festival) out.push(`{y}* ${d.festival}${d.festivalCancels ? ' (no classes)' : ''}`);
  if (d.festivalBlurb) out.push(...wrapText(d.festivalBlurb, 188).slice(0, 2));
  if (d.exam) out.push(`{r}${d.exam}: ${(EXAM_DAY_SUBJECTS[d.examDay] || []).map((s) => SUBJECT_LABEL[s]).join(' + ')}`);
  if (d.results) out.push(`{r}${d.results}`);
  if (d.breakDay) out.push(`{b}${d.breakName}`);
  if (d.birthdays && d.birthdays.length) out.push(`{p}Birthday: ${d.birthdays.join(', ')}`);
  if (out.length === 1) out.push((day - 1) % 7 >= 5 ? '{k}Weekend.' : '{k}An ordinary school day.');
  return out;
}

export const stepSeason = (season, year, dir) => {
  let i = SEASONS.indexOf(season) + dir;
  if (i < 0 || i > 3) return null; // stays within the school year
  return { season: SEASONS[i], year };
};

// ------------------------------------------------------------------ records
export function examLabel(examId) {
  const m = /^Y(\d)_(\w+?)(\d)?$/.exec(examId || '');
  if (!m) return prettify(examId);
  const def = EXAMS.find((e) => e.id === `${m[2]}${m[3] || ''}`);
  return `Y${m[1]} ${def ? def.label.replace(/ Exams \(Term (\d)\)/, ' T$1') : prettify(m[2])}`;
}

export function buildRecords(state, meta = {}) {
  const s = state.school;
  const exams = Object.entries(s.exams || {}).map(([id, e]) => ({
    id, label: examLabel(id), scores: e.scores || {}, total: e.total ?? null, average: e.average ?? null, rank: e.rank ?? null,
    subjects: SUBJECTS.map((k) => ({ key: k, label: SUBJECT_LABEL[k], score: e.scores && e.scores[k] !== undefined ? e.scores[k] : null })),
    card: (s.reportCards || []).find((c) => c.examId === id || (id.endsWith(c.examId) && id.startsWith(`Y${c.year}`))) || null,
  })).sort((a, b) => (a.id < b.id ? -1 : 1));
  const att = s.attendance || {};
  return {
    exams,
    reportCards: s.reportCards || [],
    attendance: { present: att.present || 0, late: att.late || 0, absent: att.absent || 0, skipped: (state.stats && state.stats.daysSkippedClass) || 0 },
    average: Math.round(s.average || 0),
    standing: prettify(s.standing),
    endings: (meta.endingsSeen || []).map(prettify),
    stats: state.stats || {},
  };
}

// ------------------------------------------------------------------ sleep summary
/** Start-of-day snapshot of everything the sleep card diffs. */
export function takeSnapshot(state) {
  return {
    absDay: state.time.absDay,
    money: state.player.money,
    points: Object.fromEntries(Object.entries(state.relationships || {}).map(([k, r]) => [k, r.friendship || 0])),
    subjects: { ...state.player.subjects },
    seen: Object.keys((state.events && state.events.seen) || {}),
  };
}

/** What changed between two snapshots. `before` null -> everything empty. */
export function diffSnapshots(before, after, { isMet = () => true } = {}) {
  if (!before || !after) return { money: 0, hearts: [], subjects: [], events: [] };
  const hearts = [];
  for (const [id, pts] of Object.entries(after.points)) {
    const was = before.points[id] ?? 0;
    if (pts !== was && isMet(id)) hearts.push({ id, from: was, to: pts, delta: pts - was, fromHearts: heartsOf(was), toHearts: heartsOf(pts) });
  }
  hearts.sort((a, b) => b.delta - a.delta);
  const subjects = SUBJECTS.filter((k) => Math.round(after.subjects[k]) > Math.round(before.subjects[k] ?? 0))
    .map((k) => ({ key: k, label: SUBJECT_LABEL[k], delta: Math.round(after.subjects[k]) - Math.round(before.subjects[k] ?? 0) }));
  const had = new Set(before.seen);
  const events = after.seen.filter((id) => !had.has(id));
  return { money: after.money - before.money, hearts, subjects, events };
}

/** Notices for the morning (festival, exam, break, results, birthdays) from a sim dayInfo. */
export function dayNotices(info) {
  if (!info) return [];
  const out = [];
  if (info.festival) out.push({ kind: 'festival', text: info.festival.name });
  if (info.exam) out.push({ kind: 'exam', text: `Exams: ${(info.exam.subjects || []).map((s) => SUBJECT_LABEL[s] || s).join(' + ')}` });
  if (info.examResults) out.push({ kind: 'results', text: 'Exam results are posted' });
  if (info.isBreak) out.push({ kind: 'break', text: (info.breakInfo && info.breakInfo.name) || 'School break' });
  for (const id of info.birthdays || []) out.push({ kind: 'birthday', text: `${(CAST_BY_ID[id] || {}).short || id}'s birthday` });
  if (info.playerBirthday) out.push({ kind: 'birthday', text: 'Your birthday' });
  return out;
}

/**
 * Everything the sleep card draws. `summary` from sim.clock.sleep; `diff` from diffSnapshots (or the empty diff);
 * `titleOf(eventId)` -> display title.
 */
export function buildSleepCard(summary, diff = { money: 0, hearts: [], subjects: [], events: [] }, { titleOf = prettify } = {}) {
  const date = summary.date || summary.from;
  const info = summary.dayInfo || null;
  const weather = (summary.weather && (summary.weather.today || summary.weather.tomorrow)) || null;
  const from = summary.from || date;
  const dayNo = (from && from.absDay !== undefined ? from.absDay : (info && info.absDay !== undefined ? info.absDay - 1 : 0)) + 1;
  return {
    dayNumber: Math.max(1, dayNo),
    title: `Day ${Math.max(1, dayNo)}`,
    forced: !!summary.forced,
    gameEnd: !!summary.gameEnd,
    money: diff.money,
    allowance: summary.allowance || 0,
    hearts: diff.hearts.map((h) => ({ ...h, name: (CAST_BY_ID[h.id] || {}).short || prettify(h.id) })),
    subjects: diff.subjects,
    events: diff.events.map((id) => ({ id, title: titleOf(id) })),
    weather, weatherLabel: weather ? WEATHER_LABEL[weather] || prettify(weather) : null,
    energyPct: summary.energy ? summary.energy.pct : null,
    notices: dayNotices(info),
    banner: date ? {
      text: `${SEASON_LABEL[date.season]} ${date.day}`,
      sub: `${weekdayName(date.day)}${weather ? ` - ${WEATHER_LABEL[weather] || prettify(weather)}` : ''}`,
      line: `${SEASON_LABEL[date.season]} ${date.day} - ${weekdayName(date.day)}${weather ? ` - ${WEATHER_LABEL[weather] || prettify(weather)}` : ''}`,
    } : null,
  };
}

// ------------------------------------------------------------------ save slots
/** One row of the save/load list: { slot, label, kind:'empty'|'corrupt'|'full', lines:[...], readOnly }. */
export function formatSlot(entry, { mode = 'load' } = {}) {
  const label = entry.slot === 'auto' ? 'Auto' : `Slot ${String(entry.slot).replace('slot', '')}`;
  const readOnly = entry.slot === 'auto';
  if (entry.corrupt) return { slot: entry.slot, label, kind: 'corrupt', lines: ['Unreadable save data'], readOnly };
  if (entry.empty) return { slot: entry.slot, label, kind: 'empty', lines: [mode === 'save' && !readOnly ? '- Empty - save here' : '- Empty -'], readOnly };
  const s = entry.summary || {};
  const lines = [
    `Year ${s.year}  ${SEASON_LABEL[s.season] || s.season} ${s.day} (${s.weekday})  ${s.timeLabel || s.time || ''}`.trim(),
    `${s.location || prettify(s.map)}   Play ${formatPlayTime(s.playSeconds)}`,
    s.partnerName ? `Dating ${s.partnerName}   $${s.money ?? 0}` : `$${s.money ?? 0}${s.club ? `   ${CLUB_LABEL[s.club] || prettify(s.club)}` : ''}`,
  ];
  return { slot: entry.slot, label, kind: 'full', lines, readOnly, savedAt: entry.savedAt || null };
}
export const formatSlots = (list, opts) => list.map((e) => formatSlot(e, opts));

// ------------------------------------------------------------------ settings
export const textSpeedName = (v) => (typeof v === 'string' ? (TEXT_SPEEDS.includes(v) ? v : 'normal') : TEXT_SPEEDS[Math.max(1, Math.min(3, Math.round(v) || 2)) - 1]);
export const textSpeedValue = (name) => TEXT_SPEEDS.indexOf(textSpeedName(name)) + 1;
/** Normalised settings view used by the settings scene and `game.settings`. */
export function normalizeSettings(raw = {}) {
  const vol = (v, d) => Math.round(Math.max(0, Math.min(1, typeof v === 'number' ? v : d)) * 10) / 10;
  return {
    masterVolume: vol(raw.masterVolume, 0.8), musicVolume: vol(raw.musicVolume, 0.7), sfxVolume: vol(raw.sfxVolume, 0.8),
    textSpeed: textSpeedName(raw.textSpeed), keyHints: raw.keyHints !== false,
  };
}

// ------------------------------------------------------------------ ending wiring
export const ENDING_FALLBACK = [{ id: 'fallback_end', group: 'final', title: 'The End', lines: ['Thank you for spending three years in Bellhaven.'], mood: 'good', art: 'bell_night' }];

/** Slides to play: composeEnding(state) via the injected composer; never empty. */
export function selectEndingSlides(state, compose) {
  let slides = [];
  try { slides = compose ? compose(state) : []; } catch { slides = []; }
  return slides && slides.length ? slides : ENDING_FALLBACK;
}
/** Stable id recorded in the meta save: saved|merged + partner. */
export function endingId(state) {
  const partner = state.romance && state.romance.partner;
  return `${(state.school.spirit || 0) >= 60 ? 'saved' : 'merged'}_${partner || 'solo'}`;
}
/** Music id for a slide. mood: 'good' | 'bittersweet' | 'sad' | undefined (falls back to the overall tone). */
export function musicForSlide(slide, state) {
  const m = slide && slide.mood;
  if (m === 'bittersweet' || m === 'sad' || m === 'wistful') return 'ending_bittersweet';
  if (m === 'good' || m === 'happy' || m === 'warm') return 'ending_good';
  return state && (state.school.spirit || 0) < 60 ? 'ending_bittersweet' : 'ending_good';
}
/** Season for backdrop tinting from the slide's `season` or the state date. */
export const tintSeason = (slide, state) => (slide && slide.season) || (state && state.time.season) || 'spring';

// ------------------------------------------------------------------ credits
export function buildStats(state, meta = {}) {
  const partner = state.romance && state.romance.partner;
  const hearts = Object.values(state.relationships || {}).reduce((n, r) => n + (r.met ? heartsOf(r.friendship) : 0), 0);
  return [
    ['Days played', String(state.time.absDay + 1)],
    ['Exams passed', String((state.stats && state.stats.examsPassed) || 0)],
    ['Mini-game wins', String((state.stats && state.stats.miniGameWins) || 0)],
    ['Total hearts', String(hearts)],
    ['Partner', partner && CAST_BY_ID[partner] ? CAST_BY_ID[partner].short : 'None'],
    ['Community Spirit', String(state.school.spirit || 0)],
    ['Endings seen', String((meta.endingsSeen || []).length || 1)],
  ];
}

export const CREDITS = [
  { text: 'BELLHAVEN DAYS', style: 'title' }, { text: 'A school-life story', style: 'text', color: '#9a9fb5' }, { text: '', style: 'blank' },
  { text: 'Created with Claude', style: 'head' }, { text: '', style: 'blank' },
  { text: 'Game design', style: 'head' }, { text: 'Calendar, seasons and the three school years', style: 'text' }, { text: 'Hearts, exams and Community Spirit', style: 'text' }, { text: '', style: 'blank' },
  { text: 'Pixel art', style: 'head' }, { text: 'Characters, portraits, tiles and icons', style: 'text' }, { text: 'drawn in code, pixel by pixel', style: 'text' }, { text: '', style: 'blank' },
  { text: 'Music and sound', style: 'head' }, { text: 'Songs and effects synthesised live', style: 'text' }, { text: 'with WebAudio, no samples', style: 'text' }, { text: '', style: 'blank' },
  { text: 'Writing', style: 'head' }, { text: 'Dialogue, events and endings', style: 'text' }, { text: 'for a town that rings a bell', style: 'text' }, { text: '', style: 'blank' },
  { text: 'Engineering', style: 'head' }, { text: 'Three.js renderer, simulation, UI toolkit', style: 'text' }, { text: 'and tests', style: 'text' }, { text: '', style: 'blank' },
  { text: 'An original creation', style: 'head' }, { text: 'Every character, map, picture, song and word', style: 'text' }, { text: 'was made for this game.', style: 'text' }, { text: 'No assets from other games.', style: 'text' }, { text: '', style: 'blank' },
  { text: 'Thank you for playing', style: 'title' }, { text: 'See you on Lantern Hill.', style: 'text' }, { text: '', style: 'blank' },
];

export { DAYS_PER_SEASON };
