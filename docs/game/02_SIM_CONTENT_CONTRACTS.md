# 02 · Simulation & content contracts

Audience: Sim workers (T7a, T7b, T8), story/content writers (S1–S4), the scene-integration
task (T9). Code contracts live in `src/sim/state.js` (state schema), `src/sim/script_dsl.js`
(ops, conditions, validators), `src/data/{cast,calendar,ids}.js`. Run `npm run validate` to
check content; run `npm test` for logic tests.

## 1. Conventions

- **Functional style.** Sim modules export pure-ish functions `fn(state, ...args)` that mutate
  the passed `state` in place (documented) and emit events on `bus` (`src/core/bus.js`). No hidden
  module-level mutable state. Everything must run in plain Node (no DOM) so it is unit-testable.
  A façade `createSim(state, { bus })` in `src/sim/index.js` aggregates modules for scenes.
- State is plain JSON (see `state.js`). Extend additively; never rename. Randomness that must be
  reproducible uses `src/core/rng.js` (`rngFor(`${seed}:${key}`)`).
- All content ids are `snake_case`. Flag names are prefixed by owner: `nina_`, `elise_`,
  `clara_`, `mari_`, `vera_`, `jules_`, `main_`, `fest_`, `rand_`. Events: see §8.
- Text is English, ≤ 220 chars per `say` (the DialogueBox paginates at ~38 chars × 3 lines).
  Theo's lines are written in the first person as dialogue; his thoughts use `think`.

## 2. Time, calendar, weather

- 1 game minute = `SECONDS_PER_GAME_MINUTE` real seconds on the overworld; time is paused in
  dialogue, menus, cutscenes and mini-games, except where an op/activity explicitly advances it.
  Activities advance the clock in bulk (study 1h = 60 min, class period 50 min, shift 3 h).
- `src/sim/clock.js`: `advance(state, minutes)` handles hour/day/season/year rollover and emits
  `time:minute`, `time:day`, `time:season`. The day ends when the player sleeps (bed) or the clock
  passes `DAY_END` (02:00 → forced sleep: the player wakes at 09:00 on a school day, misses homeroom,
  Aunt Roz scolds, conduct −1, energy only 50 %). `sleep(state)` runs the **new-day pipeline** in order:
  exam/report processing → relationship decay + daily flag reset → weekly allowance (Sun) → weather
  roll → NPC birthdays flag → `daily` reset → energy restore (sleep before 23:00: 100 %, before
  01:00: 85 %, later: 65 %; forced 50 %) → autosave.
- `src/sim/calendar.js` builds on `src/data/calendar.js`: `dayInfo(state | {year,season,day})` →
  `{ weekday, weekdayIndex, isSchoolDay, isBreak, festival, exam, examResults, classesCancelled,
  birthdays: [npcIds], termIndex }`. School day = Mon–Fri, not in a break, not a cancelled day.
  Exam days replace lessons (see §5). `YEARS = 3`; after Winter 28 of Year 3 comes the ending.
- `src/sim/weather.js`: `rollWeather(state)` sets `weather.tomorrow` → `today` at new day; seeded;
  weights per season — spring: sunny 50, cloudy 25, rain 25; summer: sunny 55, cloudy 15, rain 20,
  storm 10; autumn: sunny 35, cloudy 30, rain 30, storm 5; winter: sunny 30, cloudy 30, snow 40
  (no snow outside winter, no storm in winter). Festival days are never storm (rain allowed).
  Day 1 of Year 1 is always sunny.

## 3. Relationships & romance

- Friendship 0–100 (10 per heart). First talk each day: +2. Gifts (once per NPC per day): loves +8, likes +4, neutral +1, dislikes −3, hates −6; ×3 on the
  NPC's birthday (once per year; positive only). Heart events: via the `friend` op.
  Decay: no contact for 7+ days and ≥ 3 hearts → −1 point every 3 days, floored at 20.
- NPC `met` becomes true on first conversation/event. Talking uses dialogue pools (§9).
- Romance: `romance.dating[npc]`/`partner`. A confession event (content) sets it with the
  `romance` op (`dating`). Only one partner at a time. While dating, the partner's talk pool
  can use `{ dating: 'id' }` conditions. `romance … single` ends it (a breakup scene is optional).
  Romance events are gated by `hearts` and `seen` conditions, never by the calendar alone.
- Hearts display: ♥ icons, black = 0 hearts … (UI decides colours).

## 4. Player stats, economy, energy (balance targets, all tunable in one `src/sim/balance.js`)

| thing | rule |
|---|---|
| Energy | 0–100 (max grows +1 per 10 fitness above 10). Study session (1 h) −12, club practice −20, shift (3 h) −25, exam −10, skipping a meal: −10 next morning, resting on a bench +10/30 min. At 0 energy: collapse → clinic, −$30 (or nurse in school) |
| Money | start $300. Weekly allowance $60 (Sunday morning). Café shift (3 h): $45 (+$10 if mini-game ≥ silver). Prices: snack $2–6, drink $2–4, lunch $5–8, café menu $4–9, book $15–30, gift $5–60 |
| Subjects (6) | 0–100 knowledge. Study session +3…+6 (book bonus, library +1, tired −2 (energy < 25)), class attention +2 (dozing +0, −conduct), tutoring events +5. Diminishing returns above 70 (×0.6). Slow decay of −1/week on subjects not touched for 21 days (floor 10) |
| Traits | fitness (club practice, PE), charm (festivals, talks, café work), creativity (art, writing, music). 0–100, +1…+3 per activity |
| Conduct | 0–100. Absent period −2, late −1, dozing in class −1, helping events +. ≥ 80 gives +2 exam bonus, ≤ 40 triggers a teacher scolding event |

## 5. School life

- **Bell schedule** (`PERIODS`, `HOMEROOM`, `LUNCH` in constants). Class B's timetable
  (`src/data/timetable.js`, T8 writes it): Mon math/lit/sci/hist/PE/PE; Tue lit/math/hist/sci/art/art;
  Wed sci/math/lit/PE/hist/self-study; Thu hist/sci/math/lit/art/club-intro; Fri math/lit/sci/hist/PE/cleanup.
- **Attending**: when a period starts and the player stands in `school_classroom`, a *class
  session* runs (T8): 50 game minutes pass in a short scene — teacher flavour line, 1–2 attention
  choices (listen / take notes / doze / pass a note), a 25 % pop-quiz question (extra points).
  Gains per §4. Not in class: `absent` (−2 conduct, counted); entering ≤ 10 min after the bell:
  `late` (−1). Homeroom at 08:20 in class: `present` (+0), absent at homeroom with no later
  attendance → Ms. Delaney event. **Skipping is allowed** (freedom) but accumulates
  `stats.daysSkippedClass`; 5 skipped periods in a term → detention day event (content hook).
- **Exams** (4 per year, `EXAMS`): on exam days there are no lessons; the player sits the exam in the
  classroom (08:30 start; arriving late loses the first subject). Each subject: 6 questions (Year 1;
  7 in Year 2, 8 in Year 3) drawn from `src/content/exams/<subject>.js` by tier. **Knowledge acts
  as hint level**: knowledge ≥ 40 strikes out one wrong choice, ≥ 70 strikes two. Score =
  correct/total × 100, +2 if conduct ≥ 80, +3 if rested (energy ≥ 50) , clamped 0–100.
  PE and art exams include a practical mini-game (`track_sprint`, `art_palette`) worth 50 %.
  Results day: scores + class rank (class of 30; other students' averages come from a seeded
  distribution, Clara ≈ 90–96, Nina/Dante ≈ 55–70 …, deterministic per year/exam) are shown in a
  report card; `school.exams['Y1_midterm1']` stores them; `standing`: honors ≥ 85 average,
  good ≥ 70, fair ≥ 55, probation < 55 (probation: Ms. Delaney assigns `remedialDays = 5` after
  school at the library). Year-end average of the four exams is the year's grade.
- **Promotion**: after the closing ceremony the year increments on Spring 1 (Year 3 → ending).
- **Clubs** (`CLUBS`): join at the Club Fair (Spring 5) or any later day via the club's advisor.
  Practice (after school 15:30–17:30, an `activity club_practice`) = a mini-game: `track_sprint`
  (track), `soccer_penalty` (soccer), `art_palette`, `music_rhythm`, `literature_words`,
  `astronomy_stars`. Result gives `clubXp` and a rank tier ≥ silver/gold counts toward `clubRank` (0–5).
  Clubs also unlock events and tournament days (regional meet, sports festival, Bell Festival stages).
- **Part-time job**: Lantern Café (`job_cafe`, mini-game `cafe_serve`), weekdays 16:00–19:00 and weekends
  10:00–17:00 (shifts of 3 h).

## 6. Items & shops (T7a)

`src/data/items.js` exports `ITEMS` (array) and `ITEM_BY_ID`:
`{ id, name, category: 'food'|'gift'|'study'|'sport'|'key'|'misc', price (buy; 0 = not sold), icon (an
ICON_NAMES entry), desc (≤ 60 chars), use?: { energy?, stat?: {math: 4}, flag? } }`.
Minimum: 12 foods/drinks, 22 gifts (flowers, sweets, books/novels, accessories, plushies, music box,
paint set, shell, keychain, charm, coffee, tea, ...), 8 study items (textbooks per subject, workbook,
notebook, flashcards, energy drink), 4 sport items, key items (`bell_clapper_core`, `bell_clapper_fitting`,
`bell_clapper_rope`, `club_card`, `old_letter`, ...). Gifts must have a spread of tastes so each
character can love/like/dislike/hate several (their lists live in their dialogue pool).
`src/data/shops.js` exports `SHOPS` for every id in `SHOP_IDS`:
`{ id, name, keeper (npc id or null), open: { weekdays:[...], from:'HH:MM', to:'HH:MM' } | null,
stock: [ { item, price?, season?: [...], limit?: n } ] }`. `shop.buy(state, shopId, itemId, qty)`
validates stock, hours, money, capacity (inventory 30 stacks).

## 7. Interpreter, Stage and event running (T7b)

`src/sim/interpreter.js`: `runScript(ops, { state, bus, stage, vars }) → Promise<void>`. It implements
every op in `OPS` (script_dsl.js): flow (`if`, `choice`, `wait`, `end`) and **state changes** are
handled in the interpreter (friend/money/energy/stat/giveItem/takeItem/time/quest/spirit/romance/
setFlag/addCounter with clamping and `bus` events, toasts for items/money/hearts), everything
presentational goes through the **Stage** the scene supplies:

```js
Stage = {
  async say({ who, face, text, name }), async narrate(text), async think(text),
  async choice(labels: string[]) -> index,            // interpreter pre-filters options by `if`
  async warp({ map, at, dir, fade }), place({ who, at, dir }), hide(who),
  async moveTo({ who, to, speed, wait }), face({ who, dir, toward }), pose({ who, pose }),
  emote({ who, emote }), cam({ focus, ms, reset, shake }), async fade({ dir, ms, color }),
  flash({ ms, color }), lighting(preset), sfx(id), music(id, fadeMs), musicResume(),
  async banner({ text, sub, ms }), async wait(ms),
  async call({ scene, id, opts }) -> { score, rank } ,   // minigame | exam | shop | activity
  endGame(), resolveAnchor(ref) -> { map, x, y, dir }    // 'spot_a' = current map, 'map:anchor' = global
}
```
`MockStage` (records calls, auto-confirms, picks choice 0 or a scripted list) ships in
`src/sim/mock_stage.js` for tests. `call` results: the interpreter writes `counters[store]` = score
and `counters[store + '_rank']` = 3 gold / 2 silver / 1 bronze / 0 none.

**Events** (`src/sim/events.js`):
`findEvent(state, trigger, ctx)` returns the best eligible event (or null) for a trigger
`{ type:'enterMap', map }` | `{ type:'talk', npc }` | `{ type:'interact', id }` | `{ type:'wake' }` |
`{ type:'sleep' }` | `{ type:'clock' }` | `{ type:'auto' }`, with `ctx = { map, time(min), state }`.
Eligible = trigger matches (and its optional `time` window) ∧ `when` true ∧ repeat rules
(`once`: never seen; `daily`: not seen today; `always`) ∧ not already run today if `daily`.
Highest `priority` first (default 50; story 80, festival 90, romance 60, friend 50, random 20,
ambient 10); ties broken by id. `runEvent(state, ev, stage)` marks it seen (`events.seen`) **before**
running, handles `skippable`. The overworld asks `findEvent` on: map entry, talking to an NPC,
interacting, waking, sleeping, every in-game minute for `clock`, and about once a second for
`auto` when idle. Festival events: the festival day's `eventId` is picked up by an `auto`/`enterMap`
trigger inside its `start`–`end` window at its `place` (content decides which).

## 8. Event definitions (content)

Files: `src/content/events/<area>.js` → `export default [ ...EventDef ]`.

```js
{ id: 'nina_02_dawn_run',            // prefix = owner: nina_/elise_/.../main_/fest_/rand_/jules_/class_
  title: 'Dawn Run', kind: 'romance',// story|romance|friend|festival|random|class|ambient
  trigger: { type: 'enterMap', map: 'beach', time: ['05:30', '08:00'] },
  when: { all: [ { hearts: ['nina', '>=', 2] }, { notSeen: 'nina_02_dawn_run' } ] },
  priority: 60, repeat: 'once', skippable: true,
  script: [ ...ops ] }               // see script_dsl.js helpers
```
Staging rules for authors: scripts that stage characters start with `fade('out')`/`warp`/`place`s then
`fade('in')`; reference anchors by name (`'spot_a'`, `'center'`, `'entrance'`, or the map-specific
names in `04_WORLD_SPEC.md`); NPCs referenced in `place`/`moveTo` are spawned for the scene if they
are not already there; the scene restores the normal map state afterwards. End scenes with the
player free (control returns when the script ends). Always `setFlag` on completion
(`<event_id>_done` is implicit via `events.seen`; use extra flags for branching memory).
Choices: 2–4 options, ≤ 44 chars each, personality-coded (`kind`, `honest`, `playful`) with
different `friend` deltas (−3…+6) and flags that later events can read.

## 9. Other content formats

- **Dialogue pools** `src/content/dialogue/<npc>.js` → `export default { npc, talk:[...], repeat:[...], gift:{...} }`
  `talk`: first conversation of the day. `repeat`: later ones (short). Entry =
  `{ when?, priority?, say: [ 'text' | ['face','text'], ... ] }`. Selection: eligible entries by
  `when`, highest `priority` (default 10) wins, ties random; so write **many** (≥ 25 `talk` entries
  per main character, ≥ 12 per minor NPC) covering: hearts bands, weekday/weekend, each season,
  weather, time of day, location (via `map`), year, festivals, club/job, partner status, flags from
  main story, plus generic fallbacks (priority 1, no `when`).
  `gift: { loves:[item ids], likes:[], dislikes:[], hates:[], lines:{ loves:[...], likes:[...], neutral:[...], dislikes:[...], hates:[...], birthday:[...] } }`.
  Extras (students/townies): `src/content/dialogue/_extras.js` → `export default [ {npc:'student_01', ...}, ... ]`.
- **Schedules** `src/content/schedules/<npc>.js` → `export default { npc, routines:[ { id, when?, priority?, points:[ ['HH:MM', 'map:anchor' | null, { dir?, activity? }? ], ... ] } ] }`.
  `null` = not on any map (off-screen: at home, in another class, away). Highest-`priority` routine
  whose `when` matches (weekday/schoolDay/weather/season/year/flag/festival/breakDay) is used; the
  NPC is at the last point with time ≤ now. Cover: school days, weekends, breaks, rain, festival days,
  exam days (in class A/C = null), club times. Use real anchors from the world (validate).
- **Quests** `src/content/quests/<owner>.js` → `export default { quest_id: { title, summary, main?: bool, steps?: [text] } }`
  (one file per author, ids globally unique; the registry merges them). Quest ops reference these ids; the Journal shows active notes.
- **Endings** `src/content/endings/<owner>.js` → `export default { slides: [ { id, group, order?, when?, title?, lines:[...], mood?, art? } ] }`
  (one file per author). The composer collects every slide whose `when` is true from all files, sorted by
  group order then `order` (default 50) then id. Groups in order: `main` (school saved / merged) →
  `romance` (partner, or friends-only) → `academic` (average/standing → university) → `club` → `friends` →
  `final`. `lines` 1–3 per slide, ≤ 90 chars each. `art` ∈ 'school_dawn','school_dusk','bell_night','harbor_dusk','classroom_sunset','rooftop_sunset' (Art provides `getEndingBackdrop(key)`; unknown → title backdrop).
- **Exam banks** `src/content/exams/<subject>.js` → `export default { subject, questions:[ { q, a:[4 strings], correct:0..3, tier:1|2|3, topic? } ] }`
  (≥ 24 per subject, 8 per tier; factual, school-level, unambiguous, ≤ 100 chars per question, ≤ 28 per option).
- Class vignettes (`kind:'class'`, trigger `auto`/`clock` while in `school_classroom`) are short
  scripts shown as flavour at the start of lessons; `repeat: 'daily'` with `chance` conditions.

## 10. Community Spirit & endings

`school.spirit` (0–100) is the main-story meter: festivals (+3…+6), club tournament wins (+3), helping
townsfolk (+2), top-5 rank (+3), restoring the bell stages (+8 each), certain choices. On the
**Board Decision** (Year 3, Winter 22) spirit ≥ 60 → school saved; < 60 → merged ("Bellhaven
High joins the Harbor City campus; the bell goes with us"). Story events read spirit with `{ spirit: ['>=', n] }`.
The finale (Bell Night, Year 3 Winter 28) runs the ending composer (`src/sim/endings.js`, T7b):
selects slides from `src/content/endings/*.js` by `when` and hands them to the ending scene.

## 11. Save / load (T7a) — `src/sim/save.js`

localStorage keys: `${SAVE_PREFIX}:slot1..3` (full state JSON + a `summary` for the slot list: year,
season, day, time, location name, play time, partner), `${SAVE_PREFIX}:settings` (volumes, text
speed, key hints), `${SAVE_PREFIX}:meta` (endings seen, best records). Wrap storage in try/catch
with an in-memory fallback (storage can be unavailable). `migrate(save)` upgrades older
`version`s. Autosave goes to slot `auto` on every sleep. Never throw to the caller.

## 12. Debug & test hooks (T9 exposes, everyone uses)

`window.__game.debug`: `warp(map, anchor?)`, `setTime('HH:MM')`, `setDate(year, season, day)`,
`giveMoney(n)`, `giveItem(id, n)`, `setFlag(name, v)`, `addFriend(npc, points)`, `setStat(name, v)`,
`sleep()` (skip to next morning), `skipDays(n)`, `runEvent(id)`, `listEvents()`,
`state()` (deep copy), `loadState(json)`, `press(action, ms)` (input injection),
`screenshot()` (data URL). Used by Playwright QA; keep it stable.
