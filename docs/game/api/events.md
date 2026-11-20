# Events, interpreter, dialogue, endings (T7b) — API

Built by the lead (in-session). Contract: `docs/game/02_SIM_CONTENT_CONTRACTS.md` §7–8 + `src/sim/script_dsl.js`.
All files are in `src/sim/`; tests in `test/sim/t7b_*.test.mjs` (49 tests, every COND_LEAVES key and every OPS key covered).

| File | What |
|---|---|
| `conditions.js` | `evaluateCondition(cond, state, ctx)`: every leaf of `COND_LEAVES` + `all/any/not`; `safeCondition` (false + one log line on a bad key); `compare`, `latestExam`. `ctx = { map, minute, eventId }` all optional. `time` windows are half-open `[from, to)` (same as schedules). `chance` is seeded per seed/day/eventId (stable within a day, never `Math.random`). |
| `interpreter.js` | `runScript(ops, { state, stage, bus, quests, vars, eventId, opts }) -> { ended, vars }`. `HANDLERS` has exactly the keys of `OPS`. A throwing op (or an unknown op) is logged with the event id and ENDS the script; `runScript` itself never rejects. Hard cap `MAX_OPS = 5000` ops per run. |
| `events.js` | catalog + trigger matching + running (below). |
| `dialogue.js` | `pickTalk / pickRepeat` (everyday chat), `giftReaction`, gift taste helpers, fallbacks. |
| `endings.js` | `composeEnding(state, slides?)`. |
| `mock_stage.js` | `MockStage({ choices, callResults, map })`: records every call (`stage.log`, `stage.of('say')`, `stage.count('wait')`), auto-answers. |
| `events_system.js` | `createEventSystem(sim, { catalog?, pools?, slides?, quests? })` — **the entry point scenes use.** |

## Using it from a scene (T9a)

```js
import { createSim } from '../sim/index.js';
import { createEventSystem } from '../sim/events_system.js';
const sim = createSim(state, { bus, storage, hooks });   // T7a
const es  = createEventSystem(sim);                       // also installs the full condition evaluator into sim (schedules use it)

// 1. events
const ev = es.events.find({ type: 'enterMap', map }, { map, minute });   // best eligible event or null
if (ev) await es.events.run(ev, stage);                                    // marks seen BEFORE running, then runs
es.events.listEligible(trigger, ctx);  es.events.runById(id, stage);  es.events.get(id);  es.events.all();  es.events.stats();

// 2. talking
const r = sim.relationships.talk(npc);                 // T7a: +2 friendship on first talk of the day; r.first says which pool
const ev2 = es.events.find({ type: 'talk', npc }, { map, minute });      // story/romance events take priority over chat
if (ev2) await es.events.run(ev2, stage);
else { const t = es.dialogue.talk(npc, { first: r.first }); for (const l of t.lines) await stage.say({ who: npc, face: l.face, text: l.text }); }

// 3. gifts
const g = es.dialogue.gift(npc, itemId);   // { ok, reason?, kind, delta, birthday, lines:[{face,text}], hearts:{from,to} }; ok:false => lines:[]

// 4. ending
const slides = es.endings.compose();       // ordered slides (see below)
```

### When the overworld should ask for events
| Moment | Trigger object | ctx |
|---|---|---|
| player enters a map (after the fade-in) | `{ type:'enterMap', map }` | `{ map, minute }` |
| player talks to an NPC | `{ type:'talk', npc }` | `{ map, minute }` |
| player presses A on an interactable | `{ type:'interact', id }` | `{ map, minute }` |
| after waking up / before the sleep summary | `{ type:'wake' }` / `{ type:'sleep' }` | `{ map, minute }` |
| every in-game minute (or each `time:minute` bus event) | `{ type:'clock' }` | `{ map, minute }` — matches events whose `trigger.at <= minute` and (if `trigger.map`) the current map |
| about once a second while the player is idle and no event runs | `{ type:'auto' }` | `{ map, minute }` |

Rule of thumb: run **at most one** event per ask, then ask again once it finishes (a second event may now be eligible).
`ctx.time` is accepted as an alias for `ctx.minute`.

### Eligibility and order
trigger type + target match → `trigger.time` window (half-open) → repeat rule (`once`: never seen; `daily`: not run today; `always`) → `when` condition.
Sorted by `priority` (explicit, else by kind: festival 90, story 80, romance 60, friend 50, random 20, class 20, ambient 10), ties by id.
`runEvent` also appends the id to `state.daily.events`, emits `event:started` / `event:finished` on the bus and calls the optional
`stage.begin(ev)` / `stage.end(ev)` hooks (T9a uses them for the skip indicator when `ev.skippable`, for hiding the HUD, and for restoring map state).

## Stage

The Stage the scene supplies is exactly the interface in `02_SIM_CONTENT_CONTRACTS.md` §7 plus two optional hooks: `begin(ev)`, `end(ev)`, and
`currentMap()` (used to evaluate `map` conditions inside scripts; falls back to `state.player.map` when absent). `MockStage` is a complete reference
implementation of the shape (every method async, returns what the interpreter expects: `choice -> index`, `call -> { score, rank }`).

## Interpreter behaviours worth knowing
- `say` marks a real character as `met`; `narrator`/`unknown`/`theo` do not.
- `friend`, `money`, `stat`, `giveItem`, `quest`, `spirit`, `setFlag club_pick_<club>` show a toast on the bus (`toast` event `{ text, icon }`).
- `setFlag('club_pick_art')` also joins the club (`school.club`, rank/xp reset). `giveItem` into a full bag shows "Your bag is full!" and continues.
- `choice` hides options whose `if` is false; the stage only sees the visible labels; `vars.choice` / `vars[store]` hold the ORIGINAL option index.
- `call` writes `counters[store] = score` and `counters[store + '_rank'] = 3|2|1|0` (gold|silver|bronze|none); the raw result is `vars.lastCall`.
- `time` advances the clock through `clock.advance` (may roll the day over like any other advance).

## Dialogue
- `pickTalk(state, npc, { first, pools, ctx })` → `{ lines:[{face,text}], entry, fallback }`. Never empty: NPCs without a pool, or whose entries are all ineligible, get a one-line fallback chosen by cast kind (student/teacher/townsfolk/animal/extra).
- Highest `priority` (default 10) among entries whose `when` holds wins; ties are broken by a seeded pick per `(seed, day, npc, nth talk today)`, so repeated chats rotate but a reload does not reshuffle.
- `first:false` uses the pool's `repeat` entries (falls back to `talk`).
- Gift tastes live in each NPC pool's `gift` block (`loves/likes/dislikes/hates` item ids + `lines`); everything else is neutral. `giftReaction` wraps `relationships.giveGift` (one gift per NPC per day, birthday x3 once a year, key items refused) and adds reaction lines (pool line, else a generic per-taste line).

## Endings
`composeEnding(state)` returns every slide whose `when` holds, sorted by group (`main → romance → academic → club → friends → final`; unknown groups last), then `order` (default 50), then id. Slides are plain data from `src/content/endings/*.js` (`export default { slides:[…] }`); the ending scene (T9b) pages through them.

## Not done / known limits
- No `repeat: 'weekly'`; `once`/`daily`/`always` only (what the contract defines).
- `clock` events fire as soon as `minute >= at` on the right map; they are `once` by default so they do not re-fire, but a `daily`/`always` clock event needs its own `when` guard if it must fire only once per visit.
- Nothing here draws or plays anything: presentation is the Stage's job (T9a).

## QA helpers for content writers
- `MockStage({ choices, choicePolicy, callResults, map })`: `choices` are consumed first, then `choicePolicy(labels, n)` (default: always option 0).
- `test/content/events_smoke.test.mjs` runs EVERY event of the registry catalog 4 times (choice policies first / last / alternate / second) and fails on any
  interpreter error (unknown op, throwing op, op budget). `SMOKE_VERBOSE=1 node --test test/content/events_smoke.test.mjs` prints the counts. `npm test` runs it.
- `test/sim/t9_longrun_smoke.test.mjs` plays three whole school years headlessly (director, exams, events, night pipeline) and checks ranges/serialisation/ending.
- `npm run validate` checks shapes and cross-references (event ids in `seen`, quest ids, item ids, anchors once all maps exist).
