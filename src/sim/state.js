// Game-state schema and factory. OWNED BY THE LEAD (initial version); the simulation
// workstream (T7a) may EXTEND it additively (new optional fields, migrate() steps) but
// must not rename or remove anything here. The whole state is plain JSON: no classes,
// no Maps/Sets, no functions, no undefined. It is exactly what gets saved to localStorage.
//
// Conventions
//   - time.minute: minutes since midnight, 390 (06:30) ... 1560 (02:00 next day, forced sleep)
//   - time.absDay: days elapsed since game start (0 = Spring 1, Year 1). Use it for "N days ago".
//   - friendship: 0..100 points per NPC; hearts = floor(points / 10)
//   - flags: free-form booleans/numbers set by events: snake_case, prefixed by owner
//       (nina_ , elise_ , main_ , fest_ ...). Counters live in `counters`.
//   - school.spirit: "Community Spirit" 0..100, the main-story metric (see story bible)

import {
  SAVE_VERSION, START_MONEY, MAX_ENERGY, DAY_START, SUBJECTS, TRAITS,
} from '../core/constants.js';
import { NPC_IDS } from '../data/cast.js';

export function newRelationship() {
  return {
    friendship: 0,
    met: false, // has the player been introduced
    talkedToday: false,
    giftedToday: false,
    giftsThisWeek: 0,
    lastContactAbsDay: -1, // last day talked/gifted/hung out (for slow decay)
    birthdayGiftYear: 0, // year (1..3) the birthday gift was given, 0 = never
  };
}

export function createNewGame({ seed } = {}) {
  const s = seed === undefined ? Math.floor(Math.random() * 2147483646) + 1 : seed;
  const relationships = {};
  for (const id of NPC_IDS) relationships[id] = newRelationship();
  relationships.roz.met = true;
  relationships.roz.friendship = 30; // family

  return {
    version: SAVE_VERSION,
    meta: { seed: s, createdAt: Date.now(), playSeconds: 0, slot: null, lastSavedAt: null },
    time: { year: 1, season: 'spring', day: 1, minute: DAY_START, absDay: 0 },
    weather: { today: 'sunny', tomorrow: 'sunny' },
    player: {
      map: 'home_theo',
      anchor: 'bed', // where to place the player on (re)entry when x/y are null
      x: null, y: null, // tile coords, set by the overworld scene
      dir: 'down',
      energy: MAX_ENERGY,
      maxEnergy: MAX_ENERGY,
      money: START_MONEY,
      subjects: Object.fromEntries(SUBJECTS.map((k) => [k, 10])), // 0..100 knowledge
      traits: Object.fromEntries(TRAITS.map((k) => [k, 10])), // 0..100
      conduct: 80, // 0..100: attendance, behaviour, teachers' opinion
      outfit: 'auto', // 'auto' | 'school' | 'casual' | 'sport' | 'swim' | 'work' | 'sleep'
    },
    inventory: {}, // { itemId: qty }
    relationships,
    romance: {
      partner: null, // npc id while dating
      dating: {}, // { npcId: { sinceAbsDay } }
      confessed: {}, // { npcId: true } confession scene done (accepted or not)
      exes: [], // npc ids
    },
    flags: {},
    counters: {},
    events: { seen: {} }, // { eventId: { count, lastAbsDay } }
    quests: {}, // { questId: { state: 'active'|'complete'|'failed', startedAbsDay, notes: [text] } }
    school: {
      club: null, // one of CLUBS or null
      clubRank: 0, // 0..5
      clubXp: 0,
      job: null, // 'cafe' | null
      jobShifts: 0,
      attendance: { present: 0, late: 0, absent: 0, today: {} }, // today: { period(1..6): 'present'|'late'|'absent' }
      exams: {}, // { 'Y1_midterm1': { scores: { math: 72, ... }, total, average, rank } }
      reportCards: [], // [{ year, examId, average, rank, standing }]
      average: 0, // running average of all exam scores so far
      standing: 'good', // 'honors' | 'good' | 'fair' | 'probation'
      remedialDays: 0,
      spirit: 0, // Community Spirit 0..100
    },
    daily: {
      // Reset at every wake-up. The simulation owns these; add fields freely.
      studied: 0, // study sessions today
      ate: { breakfast: false, lunch: false, dinner: false },
      workedShift: false,
      practiced: false, // club practice done today
      events: [], // ids of events that have already run today
    },
    log: [], // diary: [{ absDay, text }]  (newest last, cap ~200)
    stats: { daysSkippedClass: 0, examsPassed: 0, miniGameWins: 0 },
  };
}

/** Minimal structural check, used by tests and the save loader. Returns problems. */
export function validateState(st) {
  const errs = [];
  const need = (c, m) => { if (!c) errs.push(m); };
  need(st && typeof st === 'object', 'state is not an object');
  if (!st || typeof st !== 'object') return errs;
  for (const k of ['meta', 'time', 'weather', 'player', 'inventory', 'relationships', 'romance', 'flags', 'counters', 'events', 'quests', 'school', 'daily', 'log']) {
    need(k in st, `missing ${k}`);
  }
  if (st.time) {
    need(st.time.year >= 1 && st.time.year <= 3, 'time.year out of range');
    need(['spring', 'summer', 'autumn', 'winter'].includes(st.time.season), 'time.season invalid');
    need(st.time.day >= 1 && st.time.day <= 28, 'time.day out of range');
  }
  return errs;
}
