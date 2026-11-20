# Sim core API (T7a)

Pure Node-testable logic in `src/sim/**`, no DOM. Style: `fn(state, ...args, opts?)` mutates `state` in place and
emits on `opts.bus` (default: shared `src/core/bus.js`). `opts.balance` overrides `balance.js` where noted. State is
plain JSON (`state.js`; additive optional fields only: `relationships[*].peak`, `daily.purchases`, `daily.forcedSleep`,
`daily.missedHomeroom`, `player.subjectTrack`).

## Facade: `createSim(state, { bus, storage, fallback, prefs, schedules, evalCond, hooks, now, balance })`
Returns `{ state, bus, clock, calendar, weather, relationships, inventory, shop, schedule, save, player, ready,
setEvalCond, setSchedules, setPrefs }`; each group has the state/bus pre-bound (`sim.clock.advance(30)`,
`sim.shop.buy('bakery','bread',2)`). `await sim.ready` once: gift tastes and schedules are lazy-loaded from
`src/_generated/registry.js` (skipped if injected). Raw modules: `import { clock, shop, ... } from 'src/sim/index.js'`.

## Modules
**clock.js** `advance(state, min, {silent, autoSleep})` -> `{advanced, minute, dayEnded}`, clamps at 02:00, emits
`time:minute` per minute; `setTime(state, 'HH:MM'|min)`; `setDate(state, {year,season,day})` (keeps `absDay`, reseeds
weather, emits `time:day`); `wake(state, {forced, minute, map, anchor, place})`; `sleep(state, {forced, autosave,
wakeAt, hooks, storage})` -> day summary (below); `collapse(state)` (0 energy: clinic -$30 / school nurse free,
energy 40, +120 min, relocates player); `timeLabel(stateOrMin, {format:'12h'|'24h'})`; `isDayOver`; hook registry.
**calendar.js** `dayInfo(stateOrDate)` -> `{year,season,day,weekday,weekdayIndex,isSchoolDay,hasLessons,isBreak,
breakInfo,festival(obj|null),exam({...EXAMS entry,dayIndex,subjects}|null),examResults(entry|null),classesCancelled,
birthdays[ids],playerBirthday,term,termIndex(0..5),absDay,isWeekend}`; `absDayOf`, `fromAbsDay`, `addDays`,
`dateLabel`, `nextFestival(state,{includeToday})`, `upcoming(state,n,{types,horizon})` (festival/exam/results/break/
birthday of met NPCs), `isFinaleDay`, `toDate`. Exam days ARE school days but `hasLessons` is false.
**weather.js** `weatherFor(seed, absDay)` pure/seeded; `rollWeather(state)` (today := yesterday's forecast, new
tomorrow, emits `weather:changed {kind, from}`); `setWeather`. Weights per 02 s2; no storm on festival days (-> rain).
**relationships.js** `hearts`, `friendship`, `talk(state,npc)` -> `{ok, first, gained, newlyMet, hearts}` (first talk
of the day +2, `first:false` => use the `repeat` pool); `addFriendship(state,npc,delta,{contact})` (emits
`hearts:changed {npc,from,to,points,delta}`); `markMet` (`npc:met`); `giftOutcome(npc,item,prefs)`;
`giveGift(state,npc,item,{prefs})` -> `{ok, reason, kind, delta, birthday, line, lineFace, hearts}`; `decay`;
`resetDaily`; `loadGiftPrefs()` (async), `prefsFromModules`. Gift: +8/+4/+1/-3/-6, one per NPC per day, key items
refused, item consumed only on success, birthday x3 on positive gifts once per year (`birthdayGiftYear`).
Decay: friendship that has reached 30 pts (`peak`), idle >= 7 days, then -1 every 3rd day, floor 20, `roz` exempt.
**inventory.js** `add` (returns qty actually added; 30 stacks, 99 per stack), `remove` (all-or-nothing bool), `count`,
`has`, `canAdd`, `room`, `list(state, category?)`, `use(state,id)` -> `{ok, reason, consumed, effects}` (item `use`:
`energy`, `stat`, `flag`, `meal` marks `daily.ate.<slot>`, `keep`), `studyBonus(state, subject)` (passive textbooks/
notebook, capped), `practiceBonus`. Events `item:gained`, `item:removed`, `item:used`.
**shop.js** `isOpen(state, shopId, {minute})`, `list(state, shopId)` (season-filtered rows with price/limit/remaining),
`buy(state, shopId, itemId, qty, {eatNow, minute})` -> `{ok, reason, bought, spent, total}`; reasons `bad_qty|
unknown_shop|closed|not_stocked|out_of_season|limit|full|money`; daily limits in `daily.purchases`; `priceOf`,
`hoursLabel`. Emits `money:changed`, `item:gained`, `shop:bought`.
**player.js** `addEnergy`, `setEnergy`, `addMoney`, `addStat(state,name,delta)` (subjects/traits/conduct, x0.6 gains
above 70), `getStat`, `setFlag` (emits `flag:set`), `maxEnergyFor`, `refreshMaxEnergy`, `trackSubjects`,
`decaySubjects`, `isSchoolMap`. Events `energy:changed`, `money:changed`, `stat:changed`.
**schedule.js** see "Schedules". **save.js** see "Save". **balance.js** every tunable number (frozen `BALANCE`).
**data** `src/data/items.js` (`ITEMS`, `ITEM_BY_ID`, item shape in the file header), `src/data/shops.js` (`SHOPS`,
`SHOP_BY_ID`; `open: null` = always open, `open.schoolDay`, times may reach `'26:00'`).

## New-day pipeline: `sleep(state, opts)`
Order: **before-hooks** (old date; `ctx.from`/`ctx.to` = dayInfo) -> track subject gains -> date rollover
(`absDay`, season, year) -> relationship decay + `talkedToday/giftedToday` reset -> subject decay (Mondays) -> weekly
allowance $60 (Sunday, `toast`) -> weather roll -> birthday flags `birthday_<npc>` (one day) -> daily reset (every
numeric/bool/array field of `state.daily` is zeroed generically, plus `school.attendance.today`) -> energy restore
(bedtime < 23:00 100 %, < 01:00 85 %, later 65 %, forced 50 %; -10 if >= 2 meals skipped) -> forced-sleep penalties
-> **after-hooks** (new day) -> `wake` (06:30, or 09:00 forced; player on `home_theo:bed`) -> events `time:day
{from,to}`, `time:season`, `time:year` -> autosave to slot `auto`.
Forced sleep (`forced` or clock at 02:00): wake 09:00; on a school day conduct -1 and flags `sim_forced_sleep`,
`sim_missed_homeroom` (+ `daily.forcedSleep/missedHomeroom`); `counters.forced_sleeps++`.
Final night (Year 3 Winter 28): no rollover, `summary.gameEnd = true` (before-hooks still run).
Summary: `{ok, forced, bedtime, from, date, dayInfo, energy:{before,after,restored,pct,penalty}, weather, allowance,
birthdays, decayed, subjectDecay, newSeason, newYear, missedHomeroom, hooks:{name:result}, gameEnd, saved}`.

### Hooks (T8a exams/reports plug in here)
`registerNewDayHook(name, fn, {phase:'before'|'after', order=50, registry})` -> unregister fn;
`fn(state, ctx)` with `ctx = {phase, bus, forced, bedtime, from, to, gameEnd, balance}`; its return value lands in
`summary.hooks[name]`; a throwing hook is recorded as `{error}` and never aborts the day. Lower `order` first, then
registration order; same name replaces. `createHookRegistry()` gives an isolated registry (pass as `opts.hooks`);
`unregisterNewDayHook`, `listNewDayHooks(registry?, phase?)`. Default registry is module-level (like the bus).

## Schedules (`schedule.js`)
`resolve(npcId, state, minute, {schedules, evalCond, map})` -> `{map, anchor, dir, activity, routineId, pointIndex,
nextPoint}` or `null` (no schedule/routine). Highest `priority` matching routine (ties: file order); NPC is at the last
point with time <= minute; null point or before the first point -> `map/anchor` null (pointIndex -1 before the first).
Minutes > 1440 stay on the same game day. `evalCond(cond,state,{minute,map})` defaults to the built-in
`evalCondition` (weekday, schoolDay, season, year, day, date, weather, flag, noFlag, festival, breakDay, time
[from,to), map, counter, hearts, friendship, all/any/not; multi-key = AND; unknown = false). Also `npcsOnMap`,
`snapshot`, `activeRoutine`, `indexSchedules`, `loadSchedules()`.

## Save (`save.js`)
Keys `${SAVE_PREFIX}:slot1..3`, `:auto`, `:settings`, `:meta`. Entry `{v, savedAt, summary, state}`; summary =
`{year,season,day,weekday,time,timeLabel,absDay,map,location,playSeconds,partner,partnerName,money,club}`.
`write(state, 1|2|3|'auto')`, `read(slot)` -> `{ok, state, summary, migrated}` or `{ok:false, error: bad_slot|empty|
corrupt|too_new|invalid}`, `list()` (auto, slot1-3), `delete`/`remove`, `autosave`, `settings(patch?)`, `meta(patch?)`,
`recordEnding`, `recordBest`, `migrate(save)` (state copy or null; `MIGRATIONS[fromVersion]` steps + additive
`fillDefaults` on every load). Storage is injectable (`storage`, `fallback`; `createMemoryStorage()`); failures
fall back to memory; nothing throws.

## Known limits
- `lastContactAbsDay === -1` means "never"; Aunt Roz does not decay. The meal rule needs scenes to eat via
  `inventory.use` / `shop.buy({eatNow})`, otherwise most nights lose 10 energy.
- Subject decay compares values at each new day, so any writer of `player.subjects` is handled.
- `absDayOf(state)` is derived from year/season/day; `state.time.absDay` is kept in sync by `sleep`/`setDate`.
