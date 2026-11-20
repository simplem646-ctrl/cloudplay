# 03 · Story bible — *Bellhaven Days*

Audience: story/content writers (S1–S4), and anyone who needs to know who people are. Facts
about each character (ids, appearance, birthday, voice) are in `src/data/cast.js`; dates in
`src/data/calendar.js`. **Everything here is original.** Tone: cozy, funny, heartfelt, gently bittersweet.
Rating: all-ages (16-18 y.o. characters; romance is chaste: hand-holding, hugs, blushing, a shy
forehead/cheek moment at most, fade-outs). Hard topics (pressure, anxiety, stage fright, injury, family
worry) are handled warmly and never played for cruelty. No villains: every antagonist is a person
with a reason.

## 1. World

**Bellhaven** is a small hillside harbor town (≈ 3,000 people). On top of Lantern Hill sits
**Bellhaven High School** (118 students) with a stone **bell tower**. The bell has been **silent for
30 years**: during a storm the clapper (the bell's iron tongue) was removed for repair and never
returned. The town legend: *ring the Bellhaven bell on Bell Night with someone dear and the wish you
share will come true.* The bell is the town's heartbeat, the school's symbol, and the main story's goal.
Landmarks: Bell Square (plaza, fountain), the harbor with the **Lantern Café**, the park with the
pond and cherry trees, the beach cove, the hill observatory (a hobbyist dome), the town hall with its
clock. Seasons: pink spring, bright summer, copper autumn, snowy winter; the town loves festivals.

**Premise.** *Theo Hartley* (16) transfers to Bellhaven High at the start of spring because his
parents took a three-year job overseas and he chose to stay, finish school, and live with his
Aunt Roz above her café. Over **three school years** (Spring Y1 → Bell Night, Winter Y3) he makes friends,
maybe falls in love, studies, joins a club, and discovers the town's quiet crisis: with enrolment
falling, the school board (chair: Margaret Voss, Clara's mother) will **vote at the end of Year 3 whether
to merge Bellhaven High into the Harbor City campus**. The town can sway it by showing the school is
alive: festivals, tournaments, grades, community, and the **restored bell**.

**Themes.** Belonging; showing up; small acts that add up; letting people see your unfinished self.

## 2. The main storyline (S1 writes it; ids `main_NN_*`, quest `main_silent_bell`, `main_save_school`)

Key items (src/data/items.js): `bell_clapper_core`, `bell_clapper_fitting`, `bell_clapper_rope`.
Flags: `main_arrived`, `main_bell_story_known`, `main_core_found`, `main_fitting_found`,
`main_rope_found`, `main_bell_restored`, `main_board_letter`, `main_vote_saved`, `main_vote_merged`.
Community Spirit (`school.spirit`) is raised by participating (see 02 §10).

| When | Beat |
|---|---|
| **Y1 Spring 1 (Mon)** | Wake (`main_01_wake_up`), the walk to school, Entrance Ceremony (`fest_entrance_ceremony`, Principal Marsh's warm speech with a worried edge), homeroom (`main_02_homeroom`), first friends. Day 1–4 onboarding is a tutorial in disguise (talk, gift, class, club, shop) |
| Y1 Spring 5 | Club Fair (`fest_club_fair`): every advisor and club president pitches; choosing a club = a choice menu (join, or "look around") |
| Y1 Spring 14 | Blossom Day: Mr. Finch (the last bell-keeper) mutters about the bell; Theo learns the legend (`main_bell_story_known`) |
| Y1 Summer | Rumour of low enrolment; Principal Marsh asks the Student Council + volunteers for a **Bell Committee**; regional meet, beach, fireworks |
| Y1 Autumn 27–28 | **Bell Festival Y1**: the school's culture festival (stalls, stages, haunted classroom, art exhibit, café). Finch finally hands Theo the **clapper core** (`main_core_found`) after Theo has earned it (Spirit ≥ 20, or a choice-based fallback) |
| Y1 Winter 26 | Closing ceremony; Bruno graduates (`bruno_03_farewell`) |
| Y1 Winter 28 | **Bell Night Y1**: the town gathers; the bell stays silent, but the lanterns are lit and people promise to try again |
| **Y2** | Kit joins; the Bell Committee (Theo, Clara, Owen, Jules, Dante, + anyone) restores the **fitting** (found in the town-hall archive / lighthouse store, summer) ; Y2 Autumn: **board letter** (`main_board_letter`): formal review of the school at the end of Y3; Mrs. Voss arrives; Bell Festival Y2 doubles as a fundraiser |
| **Y3** | Few new students (enrolment 11) sharpen the stakes; the **rope & strike plate** (Y3 summer, Dante's family boat/harbor) completes the bell; Y3 Autumn: the board's inspection and the biggest Bell Festival; **Winter 22 Board Decision** (`main_vote_saved` / `main_vote_merged` from Spirit ≥ 60); Winter 26 Graduation; **Winter 28 Bell Night: ring the bell** (with the person you choose) → ending sequence |

The player can miss story events by being elsewhere; `auto` triggers re-check daily, so key beats should
have wide windows and **never hard-lock**: a missed beat fires at the next opportunity (windows are in
the event's `when`, not only the trigger).

## 3. Protagonist — Theo Hartley

Observant, dry, helpful, a bit lost after the move; quick to joke, slow to open up. Choices are
tone-coded: **kind**, **honest**, **playful**. Theo has no stated hobby beyond "he notices people", which
makes him a natural listener. Aunt Roz is his family; his parents call on Sundays (event hooks).

## 4. The five romance routes (S2: nina, elise; S3: clara, mari, vera)

Every route has the **same 10 canonical event ids** (so other content can reference them) plus any
extras the writer wants. Gating uses hearts (`hearts` conditions). Windows keep pacing across 3 years.

| id suffix | Meaning | Gate |
|---|---|---|
| `_01_meet` | first meeting at a fixed place/time in Y1 Spring days 1–12 | none (trigger window) |
| `_02_spark` | first real conversation / shared moment | ≥ 2♥ |
| `_03_secret` | Theo learns their secret/wound | ≥ 4♥ + after `_02` |
| `_04_festival` | their Y1 festival beat (below) | ≥ 3♥, that festival, Y1 |
| `_05_crisis` | a conflict where Theo's choices matter | ≥ 5♥ + after `_03` |
| `_06_confession` | confession scene → `romance dating` (or a gentle "not yet") | ≥ 6♥ + after `_05`; not dating anyone else; earliest Y1 Winter 14 |
| `_07_date` | a first-date outing (weekend, picks from places) | dating, ≥ 7♥ |
| `_08_climax` | the character's arc climax at a Y2/Y3 festival (below) | dating, ≥ 8♥ (the non-dating variant is a **friend version** gated on ≥ 7♥, same id + `_friend`) |
| `_09_promise` | Bell Night Y3 promise (leads to the ending) | dating, ≥ 9♥, Y3 Winter 25–28 |
| `_10_farewell` | graduation-day goodbye if NOT the partner | Y3 Winter 26, ≥ 4♥, not partner |

Also: each heroine has `<id>_gift_*` lines in her dialogue pool and a **side quest** (`nina_comeback`,
`elise_manuscript`, `clara_stars`, `mari_mural`, `vera_piano`) whose notes the journal shows.

### Nina Calder — "the Sprinter" (Track captain, 1-B)
Loud, warm, teasing; competitive about everything (even who finishes a sandwich first). Calls Theo
"Newbie" until 4♥. Her family bakery is her morning: she jogs bread deliveries at 05:30 (harbor → square →
school). **Wound:** a knee injury last spring ended her national-qualifier run; everyone expects a comeback and she hides that it
still hurts, afraid she's "nothing if she's not fast". **Arc:** learns to run for joy and to let people help. Places: bakery, school_field,
beach at dawn, town_square. Likes: bread, sports drinks, plushies (secretly), cats, stopwatch gifts.
Dislikes: pity, flowers (makes her awkward), being told to rest. Y1 festival: **Sports Festival** (Au 13, inter-class relay: baton
hand-off; she runs through the pain). Climax: **Regional Meet, Y2 Summer 20** (comeback race). Side quest `nina_comeback`.

### Elise Whitmore — "the Quiet Writer" (Literature Club, 1-A)
Soft-spoken, ellipses, quotes books, precise and funny when she forgets to be shy. Works at Larkin Books (her
great-uncle). Secretly writing a novel. **Wound:** in middle school a story she wrote was read aloud mockingly; she stopped sharing. **Arc:**
finds her voice, reads in public. Places: school_library (window nook), bookstore, park (reading), rooftop? (no).
Likes: tea, novels, postcards, sketchbooks, cats. Dislikes: loud rooms, being rushed, spoilers. Y1 festival: **Fireworks Night** (Su 27;
she writes under the lights). Climax: **Bell Festival Y2** (Au 27–28: the Literature Club zine + her first public reading).
Side quest `elise_manuscript`.

### Clara Voss — "the Rival" (Student Council VP, 1-B, rank 1)
Formal, composed, dry wit, no contractions (until she's relaxed). Calls Theo "Hartley" until 5♥. **Wound:** her mother chairs the school board and
Clara measures her worth by rank #1; she secretly loves Bellhaven High and the stars (hill observatory with Owen), and can't oppose her
mother. **Arc:** stands up to her mother at the Board Decision, learns she is more than a rank. Places: school_classroom, council room (use
`school_hall_2f`), library, hill_observatory (evenings), town_square. Likes: dark chocolate, stationery, astronomy books, tea, quiet. Dislikes:
tardiness, junk food, being called "perfect". Y1 festival: **Moon Viewing Night** (Au 20, observatory). Climax: **Board Decision, Y3 Winter 22**.
Side quest `clara_stars`. Rivalry hook: exam ranks (`rank` conditions) drive banter.

### Marisol "Mari" Reyes — "the Dreamer" (Art Club, 1-C)
Bubbly, rambling, art metaphors, jokes to dodge feelings, calls Theo "Teo", Spanish slips out when moved. Helps Grandma Rosa at the flower shop. **Wound:** she
wants to attend art college in the city but fears abandoning her grandmother and that her art is "just doodles". **Arc:** finds a way to do both (a public
**mural** of the harbor/bell tower). Places: flower_shop, school_art_room, town_park, beach (sand sketches). Likes: flowers (all),
sweets, paint sets, shells, sketchbooks. Dislikes: being told art is a hobby, tidiness. Y1 festival: **Beach Day** (Su 21, sand mural).
Climax: **Bell Festival Y3** (the mural unveiling). Side quest `mari_mural`.

### Vera Lindqvist — "the Loner" (Music Club, 1-A)
Deadpan, sarcastic, few words, unguarded around cats and music. Calls Theo "new kid" until 3♥. Skips class on the rooftop with Biscuit the cat.
**Wound:** a child piano prodigy who froze at a huge recital at 13; she hasn't touched a piano since and moved to Bellhaven to disappear. She
practises guitar/keys only at night in the music room. **Arc:** plays piano again, for people. Places: school_rooftop, school_music_room (after dark),
town_night streets, corner_mart (late snack runs). Likes: black coffee, music boxes, cats, headphones, black licorice, quiet. Dislikes: crowds,
pity, being asked "why". Y1 festival: **Lantern Night** (Wi 14, she hums by the harbor). Climax: **Lantern Night Y2** (public piano performance).
Side quest `vera_piano`.

## 5. Friends (S4 writes ids `<id>_01..`; 3–4 events each)

- **Jules Park** (best friend; soccer; dream: sports journalist; family diner is struggling): `jules_01_guide` (Sp1 tour), `jules_02_press`
  (starts the school radio/newsletter), `jules_03_family` (diner trouble, Y1 Au), `jules_04_dream` (Y2, broadcasts the Bell Festival).
- **Dante Rossi** (rival-friend; soccer striker; pride; crush on Nina he thinks nobody knows): `dante_01_rival` (PE class), `dante_02_crush`,
  `dante_03_team` (Y2 tournament), `dante_04_loyal` (Y3; his father's boat holds the bell rope).
- **Owen Tran** (astronomy tinkerer; deadpan; builds the bell-restoration blueprint): `owen_01_observatory`, `owen_02_gadget`,
  `owen_03_bell_math` (Y2), `owen_04_future` (Y3).
- **Bruno Kessler** (Y1 senior captain, big brother): `bruno_01_captain`, `bruno_02_advice`, `bruno_03_farewell` (Y1 Winter 26).
- **Kit Alvarez** (Y2+ junior admirer): `kit_01_admirer` (Y2 Sp), `kit_02_tryout`, `kit_03_senpai` (Y3).

## 6. Staff & town (S4)

Ms. Delaney (homeroom/lit; warm, wry), Mr. Brandt (math; stern, sentimental; hates tardiness), Dr. Fennel (science/astronomy; eccentric),
Coach Mitchell (PE; track/soccer; booming), Mr. Abel (history; storyteller; knows the bell's history), Mr. Quill (art/music; gentle),
Principal Marsh (calm; carries the school), Nurse Hale (blunt; tea). Town: Aunt Roz (family; café; `roz_*` events: Sunday calls from parents,
her worries, her own old friendship with the bell-keeper), Mr. Finch (the bell: `finch_*` events), Mrs. Calder (bakery), Grandma Rosa
(flower shop; knees), Mr. Larkin (bookstore), Tomas (night mart clerk), Dr. Patel (clinic), Mayor Greer (town hall; ribbon-cutting
optimism, bad at hard news), Mrs. Voss (board chair; crisp, not a villain), **Biscuit** the rooftop cat (befriend it: snacks → `vera_*`, `rand_cat_*`).

## 7. Festivals (S1 writes `fest_*` events with `repeat: 'daily'`; year differences via `{ year }`)

Entrance Ceremony (Sp1) · Club Fair (Sp5) · Blossom Day (Sp14) · Regional Meet (Su20) · Beach Day (Su21) · Fireworks Night (Su27) ·
Sports Festival (Au13) · Moon Viewing Night (Au20) · Bell Festival (Au27–28) · Lantern Night (Wi14) · Heart Day (Wi25) ·
Closing Ceremony/Graduation (Wi26) · Bell Night (Wi28). A festival event is the **shared frame**: banner, ambience, music, a few playable
activities or conversations, NPC cameos, and a **choice of who Theo spends the evening with** (leads into the heroines' personal beats, which
trigger later the same day by `clock`/`auto` with `{ festival: '<id>' }` conditions). Festival events end with the player free to explore
the festival map. Heart Day: chocolate exchange with fixed lines per character (hearts-gated).

## 8. Endings (S1 writes `endings/main.js` + `endings/friends_only.js`; S2/S3 write each heroine's `romance` slides in `endings/<id>.js`)

Composed of slides (02 §9/§10) in this order: **main** (school saved / merged; both celebrate the bell ringing on Bell Night),
**romance** (one slide set per partner: Nina, Elise, Clara, Mari, Vera; or **friends-only** if no partner), **academic** (valedictorian ≥ 85 &
rank ≤ 3 → elite university; ≥ 70 → state university; ≥ 55 → community college/workforce; < 55 → gap year, kind tone),
**club** (per club, rank-based), **friends** (Jules, Dante, Owen short epilogues), **final** (a closing image: Theo and the bell).
All endings are warm; "merged" is bittersweet, not a punishment (the bell and the town carry on).

## 9. Writing guide

- Each character has a distinct **voice** (cast.js `voice`). Read it before writing. Banter > exposition.
- Show feelings through actions (`emote`, `pose`, `moveTo`, `cam`) and short lines; one idea per `say` (≤ 160 chars ideal).
- Use `think` for Theo's reactions, sparingly. Use `choice` for real decisions (kind/honest/playful) with consequences in `friend`
  deltas and flags later content reads.
- Humour: Jules/Roz/Mari/Owen; warmth: Elise/Nina/Bruno/Delaney; tension: Clara/Vera/Mrs. Voss; wonder: Fennel/Finch/Quill.
- Staging uses anchors from `04_WORLD_SPEC.md` (`spot_a`–`spot_d`, `center`, `entrance`, map-specific). Start scenes with
  `fade out → place/warp → fade in`, end with the player free.
- Never reference UI buttons or real-world brands. English only. No profanity beyond "darn/heck".

## 10. Cross-writer conventions (so independent writers fit together)

**Event ownership by prefix.** `main_`, `fest_` = S1 · `nina_`, `elise_` = S2 · `clara_`, `mari_`, `vera_` = S3 ·
`jules_`, `dante_`, `owen_`, `bruno_`, `kit_`, `roz_`, `finch_`, `rand_`, `class_`, `staff_`, `town_` = S4a.
Read `docs/game/api/story_main.md` (S1's table of main/festival event ids, flags, windows) before writing hooks.

**Onboarding sequence, Year 1 Spring 1-12 (ids and triggers are fixed):**

| When | Event id | Owner | Trigger |
|---|---|---|---|
| Sp1 06:30 | `main_01_wake_up` | S1 | `wake` (breakfast with Aunt Roz; points Theo toward school via the square) |
| Sp1 07:00-08:15 | `nina_01_meet` | S2 | `enterMap town_square` (a runner with a bread basket collides with him) |
| Sp1 08:20-09:15 | `fest_entrance_ceremony` | S1 | `enterMap school_grounds` (Principal Marsh's speech) |
| Sp1 09:20-12:00 | `main_02_homeroom` | S1 | `enterMap school_classroom`, after the ceremony (Ms. Delaney introduces Theo; she says Clara is the class rep) |
| Sp1 11:30-17:00 | `jules_01_guide` | S4a | `auto`, `when: seen main_02_homeroom` (lunch-break tour: cafeteria, library, rooftop stairs) |
| Sp1-3 | `clara_01_meet` | S3 | `talk clara` (class rep gives him the timetable; first rivalry spark) |
| Sp2-8 | `elise_01_meet` | S2 | `enterMap school_library` (the window-seat reader) |
| Sp3-10 | `mari_01_meet` | S3 | `enterMap school_art_room` or `flower_shop` |
| Sp4-12 | `vera_01_meet` | S3 | `enterMap school_rooftop` (and Biscuit the cat) |
| Sp2-4 | `main_03_*` tutorial beats | S1 | `wake` (Aunt Roz: talking/gifts, classes, money/shops/job, clubs) |
| Sp5 | `fest_club_fair` | S1 | club choice via flags `club_pick_<club>` (see below) |

Every `_01_meet` must have a wide window and **never hard-lock**: it also fires on later days when its `when` window is still open.

**Festival evening flags.** S1's `fest_<id>` events (Fireworks, Moon Night, Bell Festival, Lantern Night, Heart Day) ask who Theo spends
the evening with and set `fest_<festivalId>_y<year>_with_<npcId>` (e.g. `fest_moon_night_y1_with_clara`) for people with >= 3 hearts.
Heroine writers trigger their personal festival beat (`_04_festival`, `_08_climax`) with `trigger: { type: 'clock', at: '<HH:MM>', map: '<festival place>' }`
and `when: { festival: '<id>', year: n, hearts: [...] }`; the **romantic version** requires the `..._with_<heroine>` flag, otherwise play a short **friend version**
(a missed-moment scene) that still moves the story and never blocks later events.

**Clubs.** The Club Fair sets `club_pick_<club>` flags; the integrator maps them to joining (`school.club`). Writers read the club with `{ club: 'track' }`.

**Hearts as points.** `hearts: ['nina', '>=', 4]` means friendship >= 40. `friend` deltas are in points (10 = one heart): a good
scene gives +3..+6, a great choice +8, a bad one -3.

**Dating.** A confession event sets dating with `romance(npc, 'dating')`; conditions read `{ dating: 'nina' }` or `{ partner: 'nina' }`.
Gate every dating-only scene with `dating`, and every non-dating variant with `{ not: { dating: id } }`.

**Seen events.** Reference other writers' events only by the canonical ids listed in sections 4-5 and in `story_main.md`.
