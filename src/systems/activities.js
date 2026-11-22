/**
 * Activities (svc.activities): fishing, foraging and lighting lamps. Registered as svc.interact handlers.
 */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { ENERGY } from '../core/constants.js';
import { rngFor, weightedPick, timeInRange, seasonName } from '../core/util.js';
import { svc } from './svc.js';
import { D, dayNum, toast, sfx, itemName } from './kit.js';
import { isDusk } from './lamps.js';

/** Real-time scale for the fishing waits (tests set it near 0). */
export const timing = { scale: 1 };

const dlg = () => Game.ui?.dialogue;
const narrate = (t) => dlg()?.narrate?.(svc.script.interpolate(t));
const playerRig = () => svc.entities?.getPlayerRig?.() || null;

/** Lock the field (no walking, clock paused) while an activity animates. */
async function locked(fn) {
  const prev = Game.mode;
  if (prev === 'field') Game.setMode('cutscene');
  try {
    return await fn();
  } finally {
    if (Game.mode === 'cutscene' && prev === 'field') Game.setMode('field');
  }
}

/** Resolve on the next press of one of `actions` (consumed), or after `ms`. Resolves the action or null. */
function waitPress(actions, ms) {
  return new Promise((resolve) => {
    let done = false;
    let off = null;
    let timer = null;
    const end = (v) => {
      if (done) return;
      done = true;
      off?.();
      clearTimeout(timer);
      resolve(v);
    };
    off = Game.input?.onPress?.((a) => {
      if (!actions.includes(a)) return false;
      end(a);
      return true;
    });
    timer = setTimeout(() => end(null), ms * timing.scale);
  });
}

async function anim(name, o = {}) {
  const r = playerRig();
  if (!r?.play) return;
  const p = r.play(name, o);
  if (o.loop === false || o.wait) await p;
}

/** Play a one-shot animation; run `mid()` at `atMs` into it (or when it ends, if shorter) and wait for the end. */
async function animMid(name, atMs, mid) {
  const rig = playerRig();
  const done = rig?.play ? rig.play(name, { loop: false }) : Promise.resolve();
  await Promise.race([done, new Promise((r) => setTimeout(r, atMs * timing.scale))]);
  mid();
  await done;
}

// ---------------------------------------------------------------- fishing
function fishPool(water) {
  const st = Game.state;
  const season = seasonName(st.time.season);
  const weather = st.weather.today;
  const m = st.time.minutes;
  return Object.values(D().fish || {}).filter(
    (f) => f?.spots?.includes(water) && f.seasons?.includes(season) && f.weather?.includes(weather) && timeInRange(m, f.time.from, f.time.to),
  );
}

export function pickFish(water, rng) {
  const pool = fishPool(water);
  if (!pool.length) return null;
  return weightedPick(pool, (f) => f.weight ?? 1, rng);
}

function castCounter(spotId) {
  const w = Game.state.world;
  const all = (w.fishCasts ||= {});
  const r = all[spotId];
  if (!r || r.day !== dayNum()) return (all[spotId] = { day: dayNum(), n: 0 });
  return r;
}

async function fishing({ it }) {
  const st = Game.state;
  if (svc.inventory.count('fishing_rod') < 1) {
    return narrate('You would need a fishing rod to fish here. Perhaps someone in town sells one? Try the fishing hut at the harbor.');
  }
  if (!svc.inventory.spendEnergy(ENERGY.fishingCast)) return undefined;
  const water = it.water || 'brook';
  const rec = castCounter(it.id);
  rec.n += 1;
  const rng = rngFor('fish', dayNum(), it.id, rec.n);
  const rig = playerRig();
  return locked(async () => {
    try {
      rig?.faceTowards?.(it.x, it.z);
      rig?.setHeld?.('rod');
      sfx('cast');
      await anim('fish_cast', { loop: false });
      anim('fish_wait', { loop: true });
      // wait 2-6 s for a bite (pressing confirm/cancel early reels the line in)
      const waitMs = 2000 + rng() * 4000;
      const early = await waitPress(['confirm', 'cancel'], waitMs);
      if (early) {
        toast('You reel the line back in.', { kind: 'info' });
        return;
      }
      const fish = pickFish(water, rng);
      if (!fish) {
        await narrate('Nothing seems to be biting right now.');
        return;
      }
      sfx('bite');
      rig?.emote?.('exclaim');
      anim('fish_bite', { loop: true });
      const u = rng();
      const hit = await waitPress(['confirm'], 1300);
      if (!hit) {
        sfx('fish_escape');
        toast('It got away…', { kind: 'warn' });
        advance(5);
        return;
      }
      sfx('reel');
      const res = (await Game.ui?.minigames?.fishing?.({
        fish: { id: fish.id, name: fish.name, difficulty: fish.difficulty, speed: 0.55 + fish.difficulty * 0.3, size: sizeAt(fish, u, false) },
        rodPower: 1,
      })) || { caught: false };
      if (!res.caught) {
        sfx('fish_escape');
        toast('It got away…', { kind: 'warn' });
        advance(10);
        return;
      }
      const size = sizeAt(fish, u, !!res.perfect);
      svc.inventory.give(fish.id, 1, { silent: true });
      const log = (st.log.fish[fish.id] ||= { count: 0, maxSize: 0 });
      log.count += 1;
      log.maxSize = Math.max(log.maxSize, size);
      st.stats.fishCaught += 1;
      Game.bus.emit(EVT.FISH_CAUGHT, { id: fish.id, size, perfect: !!res.perfect });
      sfx('catch');
      toast(`Caught a ${fish.name}! ${size} cm${res.perfect ? ' (perfect!)' : ''}`, { kind: 'item', icon: fish.id });
      rig?.setHeld?.(null);
      await anim('fish_catch', { loop: false });
      advance(10);
    } finally {
      rig?.setHeld?.(null);
      rig?.stop?.();
    }
  });
}

/** Size in the fish's range from one seeded draw u; a perfect catch lands in the upper half. */
export function sizeAt(fish, u, perfect) {
  const [lo, hi] = fish.size || [10, 20];
  return Math.round(lo + (hi - lo) * (perfect ? 0.5 + 0.5 * u : u));
}

const advance = (m) => svc.clock?.advance?.(m);

// ---------------------------------------------------------------- foraging
export function forageRec(areaId) {
  const w = Game.state.world;
  const all = (w.forage ||= {});
  const r = all[areaId];
  if (!r || r.day !== dayNum()) return (all[areaId] = { day: dayNum(), spots: {} });
  return r;
}

/** Today's find at a spot (rolled once, seeded by day + spot): item id or null. */
export function rollForage(areaId, spotId) {
  const rec = forageRec(areaId);
  if (!(spotId in rec.spots)) {
    const tbl = D().forage?.[areaId]?.[seasonName(Game.state.time.season)] || [];
    const e = tbl.length ? weightedPick(tbl, (x) => x.weight ?? 1, rngFor('forage', dayNum(), spotId)) : null;
    rec.spots[spotId] = e?.item ?? null;
  }
  return rec.spots[spotId];
}

async function forage({ area, it }) {
  const item = rollForage(area, it.id);
  if (!item) return narrate('Nothing here today.');
  if (!svc.inventory.spendEnergy(ENERGY.foragePick)) return undefined;
  const st = Game.state;
  return locked(async () => {
    const rig = playerRig();
    rig?.faceTowards?.(it.x, it.z);
    await animMid('pickup', 520, () => {
      sfx('pop');
      Game.world?.playEffect?.('sparkle', { x: it.x, z: it.z, count: 6 });
      forageRec(area).spots[it.id] = null;
      svc.inventory.give(item, 1);
      st.log.forage[item] = (st.log.forage[item] || 0) + 1;
      st.stats.forageCount += 1;
      Game.bus.emit(EVT.FORAGE_PICKED, { id: item, spot: it.id });
    });
  });
}

// ---------------------------------------------------------------- lamps
async function lamp({ area, it }) {
  const lamps = svc.lamps;
  const state = lamps.stateOf(area, it.id, it);
  if (state === 'broken') return narrate('The glass is cracked. It needs a Lantern Piece.');
  if (state === 'lit') return narrate('The lamp glows warmly.');
  if (!isDusk(Game.state.time.minutes)) return narrate('The lamp is mended and waiting. Come back at dusk to light it.');
  return locked(async () => {
    const rig = playerRig();
    rig?.faceTowards?.(it.x, it.z);
    await animMid('light_lamp', 1300, () => {
      sfx('lamp_light');
      lamps.light(it.id);
      Game.world?.playEffect?.('sparkle', { x: it.x, z: it.z, count: 8 });
      toast('The lamp flickers to life.', { kind: 'info' });
      svc.jobs?.onLampLit?.(area, it.id);
    });
  });
}

export const activities = {
  init() {
    if (!Game.world?.loadArea) return; // world-facing handlers are live only with a real world (see index.js)
    svc.interact.registerHandler('fishing', fishing);
    svc.interact.registerHandler('forage', forage);
    svc.interact.registerHandler('lamp', lamp);
  },
  fishPool,
  pickFish,
  rollForage,
  sizeAt,
  timing,
  itemName,
};
