# Lanternbrook Days — Game Design Bible

Single source of truth for **names, rules, numbers, cast, story, calendar, art and audio direction**.
Technical contracts (APIs, data schemas, ids) live in `ARCHITECTURE.md`. If the two ever disagree,
`ARCHITECTURE.md` wins for code, this file wins for content/tone. Do not re-decide anything written here.

> Everything in this game is **original**: characters, names, artwork, music, sound. It is *inspired by the
> feel* of late‑90s cozy life‑sim RPGs, but copies no protected asset, name, map or branding.

---

## 1. Pitch

**Lanternbrook Days** is a cozy, story‑driven life‑sim RPG with **no farming**. A young man leaves his
parents' city flat to start a life of his own in **Lanternbrook**, a small seaside‑and‑hills town where
the street lanterns have slowly gone dark since the old lamplighter died. By making friends, taking
part‑time jobs, running errands, fishing, foraging and joining town events, he helps the town light its
lanterns again for the Winter Lantern Festival — and maybe finds love along the way.

Feeling targets: nostalgic, charming, relaxing, emotionally warm. Slow mornings, small kindnesses,
seasons turning, a town that goes on living whether or not you are watching.

## 2. Pillars

1. **A living town** — NPC schedules, weather, seasons, festivals, birthdays, ambient critters, lit windows at night.
2. **People over grinding** — relationships, heart events and little stories are the reward loop.
3. **Gentle goals, no fail states** — "Rekindle the Lanterns" is a story you can finish at your own pace. Collapsing from exhaustion is a mild setback only.
4. **Nostalgic presentation** — fixed 3/4 camera, 3D chibi characters, painterly "pre‑rendered" environments, anime bust portraits, soft synth music.
5. **Always something small to do** — every day offers a job shift, a fish to catch, a gift to give, a note on the board.

## 3. Premise & protagonist

- Protagonist: **young man, 20**, name chosen by the player (default **"Kai"**, 1–10 chars). Silent in the
  sense that his lines are chosen from dialogue options; he has a name tag in the dialogue box but **no portrait**.
- He answered the mayor's notice: *"Cottage on Brook Lane, rent‑free for the first season. Handy helpers
  welcome."* The cottage was the **Old Lamplighter's Cottage**, home of **Tobias Wren** (died three winters
  ago), who lit Lanternbrook's lamps every dusk and made the Lantern Festival happen. The festival has been
  cancelled since.
- Default look: tousled dark‑brown hair, warm brown eyes, indigo jacket (rolled sleeves) over a cream shirt,
  orange scarf, khaki trousers, brown boots. Player may pick hair colour / jacket colour / scarf colour from
  small preset lists on the new‑game screen.
- Tobias' **journal** (found in the cottage attic on Spring 3) tells six "lantern stories" about townspeople
  who loved him. Helping each one restores a **Lantern Piece** and relights one district's street lamps.

## 4. Core loop & weekly rhythm

Wake 6:00 in the cottage → check mailbox → plan the day: **job shifts** (bakery 7–11, parcels 13–17,
lamplighting at dusk 17:30–19:30), **fishing / foraging / exploring**, **errands** from the notice board and
from villagers, **socialising** (talk daily, give gifts, trigger heart events), **shopping** (shops have hours
and closed days) → be in bed by midnight (collapse at 2:00 AM). Sleep → day summary → autosave → next day.

Weekly rhythm: shops close on set days; the **travelling peddler (Sable)** visits **Sat & Sun**; library and
café have different closed days; NPC schedules change by weekday and weather.

## 5. Rules & numbers (settled — do not change)

| Rule | Value |
|---|---|
| Time scale | **1 real second = 2 game minutes** (settings: slow 1.2 / normal 2 / fast 3). Clock runs only in `field` mode. |
| Day length | wake **06:00**; warning at **24:00**; forced collapse at **26:00 (2:00 AM)** |
| Calendar | **28 days/season**, 4 seasons/year; **every season starts on Monday** (28 = 4 weeks). Start: **Spring 1, Year 1, Monday, 06:00** |
| Seasons | spring, summer, autumn, winter |
| Weather | sunny, cloudy, rain, storm, snow (snow only in winter; storm only spring–autumn, rare). Forecast for tomorrow is shown. Festival days are always fair. |
| Currency | **coins** (written `1,250 c`, icon = coin). Start with **300 c**. |
| Energy | max **100**. Costs: fishing cast −3, forage pick −1, bakery shift −20, parcel run −15, lamplighting −10, running costs 0. Restored by food (item `energy`), sleep (full if in bed by 24:00, 70% if later, 50% on collapse), benches (+3 per 10 min sitting), clinic bed. At 0 energy activities are refused with a gentle message. |
| Inventory | 24 slots, stack 99 (key items 1). Cottage chest: 48 slots. |
| Affection | per NPC **0–1000**; **hearts = floor(aff/100)** (0–10). |
| Talk | first conversation each day **+12** (more if birthday). Subsequent talks give flavour only. |
| Gifts | max **1/day/NPC**, soft cap 3/week (extra gifts accepted but give +0 and a polite "you've been so generous"). love **+80**, like **+45**, neutral **+20**, dislike **−20**, hate **−60**. Birthday: love/like ×3. |
| Decay | none below the heart floor you have reached; **−2/day** applies only to the partial progress inside the current heart when not talked to for 3+ days (never drops a full heart). |
| Romance | 5 romanceable villagers. Heart events at **2, 4, 6, 8 hearts**. The **8‑heart event ends with a confession choice**; choosing "confess" sets `<npc>_dating` and `status:'dating'`. Only one partner at a time (other 6/8‑heart romance events then stay locked). At the **Winter 24 Lantern Festival**: dating → "Together" ending scene; not dating → "Friends" ending scene. The game continues afterwards (Year 2 free play). |
| Save | localStorage, 3 manual slots + 1 autosave (on sleeping). Save at the **diary** in the cottage or from the pause menu. |
| Buildings' hours | see `Data.buildings` (D1). Reference: general_store 09–18 closed Wed · bakery 07–17 closed Sun · cafe 10–20 closed Mon · clinic 09–17 closed Sun · library 10–18 closed Tue · inn 10–22 daily · fishing_hut 06–18 closed Thu · town_hall 09–16 closed Sat/Sun · observatory 16:00–03:00 daily · workshop locked until flag `workshop_unlocked` |
| Job pay | bakery shift 80 base + up to 60 bonus · parcel run 25/parcel + up to 30 speed bonus · lamplighter 6/lamp + 40 if every lamp lit |
| Price guide | bread 40, cookie 25, cake slice 90, coffee 50, tea 35, bait 6, basic rod 350 (starter rod is given in the tutorial), fish sell 20–400, forage sell 8–120 |

## 6. The town (mood notes for artists; ids/anchors in ARCHITECTURE §Registry)

Adjacency (loops make exploring fun): `brook_lane ↔ town_square ↔ market_street ↔ harbor ↔ riverside_park ↔ town_square`;
`brook_lane ↔ whispering_woods ↔ starview_hill ↔ market_street`.

| Area | Mood / signature props |
|---|---|
| **brook_lane** (home) | West edge of town. Winding lane, little stream with footbridge, a huge willow, picket fence, wildflower meadow, the cosy slightly‑shabby **Old Lamplighter's Cottage** (patched roof, window boxes, mailbox) and a locked **workshop shed** with lamp‑post parts piled outside. Lamps with cracked glass. |
| **town_square** | The hub. Cobbled plaza, **fountain with clock tower**, noticeboard, flower stall, benches, the **Rye & Rose Bakery** (warm, striped awning), **Copper Kettle Café** (terrace tables), **Town Hall** (white steps, flag). Bunting changes by festival. |
| **market_street** | Long cobbled street with timber‑and‑plaster shops: **Pennywhistle Provisions** (general store + post counter), **Whitlock Clinic**, **Thornfield Library** (ivy, round window), **Heron Inn** (hanging sign, lit windows). Fruit stand, postbox, stairs up to the hill. |
| **riverside_park** | Meadow along the brook, stone bridge, gazebo, picnic lawn, duck pond, flowerbeds, willow benches, swing. Blossom Picnic venue. Fishing on the river. |
| **harbor** | Seaside: wooden pier, moored boats, net racks, crates, beach with shells, little **fishing hut**, a **lighthouse** (dark at first), gulls. Midsummer fireworks venue. |
| **whispering_woods** | Dappled forest trail, mushroom grove, berry patch, hollow log, mossy **lantern shrine**, hermit's hut, a forest stream. Quiet, slightly mysterious. Best foraging. |
| **starview_hill** | Windy hilltop meadow, huge oak, telescope, view bench, the domed **observatory**. Whole town visible below at night. Romance/stargazing spot. |

Interiors (all cut‑away rooms viewed from the same fixed camera): cottage, workshop, bakery, cafe, town_hall,
general_store, clinic, library, inn, fishing_hut, observatory. Cosy, cluttered, warm lamp light, wooden floors, rugs.

## 7. Cast

19 named villagers. **Portrait** characters (9) get illustrated bust portraits with multiple expressions; the other 10 are in‑game sprites only
(name tag in dialogue box, no portrait). Colours are hex so 3D rigs and portraits match. Voice = dialogue blip type.

### 7.1 Portrait characters

| id | Name · age · role | Look (hair / eyes / skin / outfit / accessories) | Personality & hook |
|---|---|---|---|
| **mira** ♥ | **Mira Calloway**, 22 F — baker's assistant at Rye & Rose | thick **side braid** over left shoulder (viewer's right), hair `#8a4b2a` shade `#5f2f18` hi `#c27a4a`; eyes amber `#d98a2b`; skin `#f7d3b8`, freckles, flour smudge; cream blouse `#fff3df`, rose apron `#f27a93`, brown skirt `#7b4a2e`; rose ribbon `#ff9fb5` | Cheerful, clumsy, nurturing, talks fast, loves sweets. Dreams of her own café‑bakery but feels she can't leave her mother. voice `bright` |
| **willa** ♥ | **Willa Thorne**, 21 F — librarian | long straight **plum hair with blunt bangs** `#3b2a4f` hi `#7a5aa0`; eyes grey‑green `#7fa88a` behind **round copper glasses** `#b0763c`; skin pale `#fbe6d8`; oatmeal cardigan `#d8c3a0` over lilac dress `#b9a2d8`; key‑charm necklace, ink‑stained fingers | Shy, bookish, dry wit once comfortable, secretly writes stories. Blushes easily. voice `soft` |
| **juno** ♥ | **Juno Keane**, 22 F — harbor fisher & boat tinkerer, Gus's granddaughter | short messy **copper‑ginger hair** with stray tufts `#c4552d` hi `#f08a4b`; eyes bright green `#4fae5f`; tanned skin `#d9a074`, freckles, band‑aid on cheek; navy headband `#1e3a5f`; yellow rain jacket `#f2c230` over white tank `#ffffff`, navy overall shorts `#27456b`, rust boots `#a8402a` | Bold, competitive, fiercely loyal, hates losing, secretly sentimental. Parents trade overseas and are rarely home. voice `brisk` |
| **rhea** ♥ | **Rhea Montclair**, 24 F — owner of the Copper Kettle Café | sleek chin‑length **wine‑red bob, side part** `#7c1f33` hi `#c1445f`; eyes golden‑brown `#b8862e`, winged liner; olive skin `#e3b58a`, beauty mark; charcoal vest `#2a2a33` over white shirt `#ffffff` with rolled sleeves, long forest‑green apron `#2f5d4a`, gold hoops `#e6b84a` | Witty, guarded, perfectionist; left a famous city culinary school abruptly. Soft inside. voice `brisk` (lower pitch) |
| **celeste** ♥ | **Celeste Arden**, 23 F — stargazer, keeps the observatory | long wavy **periwinkle‑silver hair half‑up** `#a9b8e8` hi `#e6ecff` with gold **star clip** `#f4d35e`; big deep‑indigo eyes `#3b3f9e`; fair skin `#f6dccb`; navy star‑embroidered shawl `#27305f` over pale‑yellow dress `#f6e7a1`; brass spyglass `#b88a3a` | Dreamy, gentle, mysterious, forgetful about meals and days, speaks poetically. Her mentor vanished. voice `dreamy` |
| **odell** | **Mayor Odell Hartwell**, 64 M — mayor & your landlord | bald top, fluffy **white walrus moustache** + bushy brows `#f2f2f2`; eyes blue `#5b7aa6`; ruddy skin `#f0c1a0` cheeks `#e58f7a`; tweed jacket `#7a6a4f`, green waistcoat `#2f6b4f` with gold watch chain `#e0b84a`, red tie `#a33a3a`; round belly | Jolly, forgetful, loves puns, quietly heartbroken about the festival. voice `deep` |
| **theo** | **Theo Marsh**, 21 M — postman, your best friend in town | spiky **sandy‑blond hair** `#d6a64a`, **goggles pushed up** on forehead (lens `#8fd3e8`); blue eyes `#4aa3df`; skin `#f1c7a3`, freckles; blue postal jacket `#2f6fb3` with gold buttons, satchel `#a0663a`, khaki shorts `#8b7355`, red sneakers | Energetic, gossipy, always late, loyal. Barnaby's nephew; lives above the store. voice `bright` |
| **nana_fen** | **Nana Fen (Fennimore Brightwater)**, 78 F — innkeeper of the Heron Inn | silver **bun** `#d9dce3` with a knitting needle through it; kind blue eyes `#6fa0d8`; rosy skin `#f3d3bd`; lavender shawl `#a98bd0` over plum dress `#6b4a7a`, white apron; always knitting | Wise, teasing, knows everyone's secrets, adores tea. Knew Tobias best. voice `elder` |
| **gus** | **Captain Gus Pelham**, 68 M — retired sea captain, keeper of the dark lighthouse | full **grey‑white beard** & hair `#cfd2d6`; eyes sea‑blue `#3d6f9a`; weathered skin `#d9a681`; navy knit cap `#2a4f7f`, cream striped sweater `#e8e2d0`, brown trousers `#5b4a38` | Gruff, salty humour, big heart, tells tall tales. Juno's grandfather. voice `gruff` |

♥ = romanceable.

### 7.2 Sprite‑only villagers (no portrait)

| id | Name · age · role | Look | Notes |
|---|---|---|---|
| rosalind | Rosalind Calloway, 48 F — baker, Mira's mother | brown bun `#6b3f26`, big flour apron over mustard dress `#d9a441` | warm but strict; early riser. voice `brisk` |
| barnaby | Barnaby Pennywhistle, 55 M — general store owner | short black hair + big moustache `#2d2d2d`, red suspenders `#b33a3a`, striped shirt `#e8e4d0`, green apron `#4b7a3d`, round | chatty salesman, bad puns. voice `deep` |
| elias | Dr. Elias Whitlock, 45 M — clinic doctor | greying side‑parted hair `#4a4a55`, thin, glasses, white coat `#f5f5f5` over teal `#3f8f8f` | calm, tired, herbal‑tea addict. voice `soft` |
| pip | Pip Alder, 9 M — kid, bug collector | messy dark hair `#3a2a1c`, green shirt `#6bbf59`, khaki shorts, bug net | runs everywhere. voice `kid` |
| lottie | Lottie Alder, 8 F — Pip's bossy little sister | twin short pigtails w/ red ribbons `#3a2a1c`, red hooded cape `#d63c3c`, yellow boots | voice `kid` |
| ferris | Mr. Ferris Quill, 70 M — retired teacher | thin white hair `#e8e8e8`, bow tie `#a33a3a`, grey‑purple cardigan `#7d6b8f`, cane `#8a5a2a`, bread‑crumb bag | feeds the ducks, quotes poems. voice `elder` |
| bramwell | Old Bramwell "Moss", 72 M — woods hermit & forager | wild grey hair/beard `#8f8f8f`, moss‑green hood `#5e7d3a`, patched coat `#6e5a3a`, staff, basket | gruff, kind, knew Tobias. voice `gruff` |
| sable | Sable Quinn, 35 F — travelling peddler (Sat & Sun) | long black braids with beads `#1f1f2b`, skin `#b98260`, patchwork poncho `#d9783a`, huge backpack `#7a4a2a`, wide hat `#b8862e` | sells rare goods, trades stories. voice `bright` |
| hattie | Hattie Brook, 52 F — flower seller (stall in town_square) | curly blond hair `#e8b84a` under straw hat `#e6c97a` with flowers, green apron `#7bbf6a` | gossip hub. voice `bright` |
| henrik | Henrik Alder, 38 M — carpenter/handyman, father of Pip & Lottie | brown hair `#6b4a2a`, stubble, plaid shirt `#b84a3a`, overalls `#4a6fa5`, tool belt, pencil behind ear | fixes things, tired dad. voice `deep` |

Generic extras are not needed; all 19 are named. (Tobias Wren is deceased; he appears only in journal pages and memory vignettes.)

### 7.3 Schedule gist (D1 writes full `schedules.js`; these set the tone)

- **mira**: Mon–Sat 06:00 oven → 07:00–11:00 counter/kneading → 12:00 lunch on a fountain bench → 13:00–16:00 counter → 17:00 stroll in riverside_park → 20:00 home. Sun: sleeps in, picnic spot in the park, then library. Rain: stays in the bakery.
- **willa**: library 10:00–18:00 (desk, shelves, nook). Tue (closed): reading bench in the park. Evenings: occasionally starview_hill. Rain: reading nook.
- **juno**: 05:00 boat dock → 07:00–12:00 fishing on the pier (anim `fish_wait`) → 13:00–17:00 tinkering at the hut → 18:00 harbor bench/sunset spot → 21:00 home. Thu: runs along market_street.
- **rhea**: café 08:00–20:00 (Mon closed: she shops at the general store, then sits by the river). Night: café after hours.
- **celeste**: hidden (asleep) until 15:00 → 16:00 observatory desk → 20:00–01:00 telescope on the hill. Rain: observatory desk.
- **theo**: 07:00 post counter → runs a loop through town all day (market → square → harbor → park) → 18:00 inn → home.
- **odell**: town hall desk 09:00–16:00 (Mon–Fri), noon walk to the fountain, dusk at the town square watching the lamps; weekends strolls everywhere.
- **nana_fen**: inn 08:00–21:00 (hearth, reception), afternoon bench on market_street.
- **gus**: harbor bench / dock mornings; lighthouse base afternoons; hut evenings.
- others follow their roles (shops open → behind counter; pip/lottie play in the park & square after 15:00; ferris at the duck pond 10:00–12:00 & 15:00; bramwell in the woods; hattie at her stall 09:00–17:00; henrik at the workshop/brook_lane & town; sable appears Sat/Sun on the square/park).

## 8. Story bible

### 8.1 Main arc — "Rekindling the Lanterns" (quest ids in ARCHITECTURE)

Tone: warm, gently funny, a little wistful. Tobias is never villainised or mystified: he was simply the
person who made the town feel looked‑after.

- **Prologue (Spring 1, morning):** Wagon drops you at Brook Lane. Mayor Odell meets you, hands over the cottage key, a small purse and
  the Town Map; explains Tobias and the dark lanterns; suggests you say hello around town. Tutorial quest `t_meet_town` (talk to 6 villagers).
- **Spring 3:** After sleeping in the cottage, you notice a loose board; the attic holds **Tobias' Journal** (quest `m2_journal`). Page 1 names six people.
- **Six Lantern Stories** (each is a short quest chain, 3 stages: *hear the story → do a favour → receive the Piece*; on completion the district's lamps become *repairable/lightable* and `lanterns` +1):
  1. **The Baker's Lantern** (m3_baker, unlocks Spring 3+): Tobias bought the first loaf every dawn and left a lantern on the bakery step. Task: help at the bakery (2 shifts) and fetch **wild honey** from the woods for Rosalind's old recipe. Reward: **Ember Glass**. Lamps: town_square.
  2. **The Reader's Lantern** (m4_reader, Spring 15+): Willa knows Tobias' lantern blueprint is hidden inside a library book. Task: find the book (search library shelves with Willa's riddle clues). Reward: **Brass Blueprint**. Lamps: market_street.
  3. **The Sailor's Lantern** (m5_sailor, Summer 1+): Captain Gus's lighthouse lens cracked in a storm; fragments were lost at sea. Task: catch/retrieve **Sea‑Glass Shards** (fishing + beach foraging). Reward: **Sea Lens**. Lamps: harbor (+ lighthouse beam at night).
  4. **The Café Lantern** (m6_cafe, Summer 15+): Tobias scented lamp oil with spiced cocoa; Rhea has his recipe card but won't share it. Task: gather ingredients and win her trust. Reward: **Spiced Lamp Oil**. Lamps: riverside_park.
  5. **The Stargazer's Lantern** (m7_stargazer, Autumn 1+): Celeste noticed the town's lamps map onto a constellation; Tobias set them that way. Task: stargazing nights, find her mentor's notes, craft a wick. Reward: **Starlight Wick**. Lamps: starview_hill + whispering_woods.
  6. **The Mayor's Lantern** (m8_greatlantern, when all 5 Pieces are held): assemble the **Great Lantern** in Tobias' workshop (needs `workshop_unlocked`, set by quest m2). Lamps: brook_lane. Odell asks you to light it at the festival (m9_festival).
- **Winter 24 — Lantern Festival (finale):** the whole town gathers in the square then floats lanterns down the brook; you light the Great Lantern. Quality (how many Pieces/lanterns you restored) changes how magical the scene is. Then the **Together / Friends** ending (see §5 Romance). Credits card "Year 1 complete — thank you for playing"; play continues.
- No quest ever expires in a way that blocks the finale; missed lanterns just make the festival simpler.

### 8.2 Heart events (D2 writes; ids `heart_<npc>_<2|4|6|8>`)

| NPC | 2 ♥ | 4 ♥ | 6 ♥ | 8 ♥ (confession) |
|---|---|---|---|---|
| mira | **Flour Fright** — bakery morning; she trips with a flour sack; comedy; gives you a warm roll | **Before Sunrise** — 05:30 bakery, she teaches kneading, confides her café‑bakery dream | **The Notebook** — park at dusk; her recipe notebook, fear of leaving her mother | **Rise and Shine** — Rosalind & Mira reconcile with your help; dawn picnic on starview_hill; confession |
| willa | **Rainy Day Stacks** — library on a rainy day; shows you the reading nook | **Lend Me a Book** — she lends you a battered storybook; blush | **Under the Stars** — hill at night; reads you a story she wrote | **The Reading** — Harvest Moon Fair public reading (needs Autumn 14+ & ≥8♥); confession |
| juno | **The Challenge** — pier fishing duel | **Storm Warning** — stormy day; securing boats together | **Gramps' Sea Chest** — hut; her parents, her fear of being left | **First Light** — relight the lighthouse at dusk together; confession |
| rhea | **Taste Test** — she critiques your palate; surprise approval | **After Hours** — café at night, she makes you cocoa, hums | **Why I Left** — rainy evening, the city kitchen story | **The Tasting Menu** — private dinner at the closed café; confession |
| celeste | **First Constellation** — hill at night; the telescope | **Meteor Night** — meteor shower on the hill (summer/autumn night) | **The Missing Star** — observatory; her mentor, the lamp‑constellation theory | **Lantern Sky** — winter night; Great Lantern + stars; confession |

Friendship events (D2, lighter): theo ×3 (the mail race, gossip night, the broken bike), odell ×2, nana_fen ×2, gus ×2, plus
one short "slice of life" scene for each other villager (unlocked at 4♥).

### 8.3 Quests (D1 defines; counts are targets)

`tutorial` (4) · `main` (9) · `side` (~14, each tied to a villager) · `errand templates` (≥ 8 patterns that fill the notice board
with 2–3 daily jobs: deliver an item, bring N of something, catch a fish type, forage, help a shop, find a lost thing).

## 9. Calendar

| When | Event | Where |
|---|---|---|
| Spring 14 | **Blossom Picnic** — share a picnic basket with someone (choose) | riverside_park |
| Summer 21 | **Midsummer Lights** — evening on the beach, fireworks | harbor |
| Autumn 14 | **Harvest Moon Fair** — stalls, fishing contest, bake‑off, Willa's reading | town_square |
| Winter 10 | **Hearthlight Evening** — cosy gift‑exchange at the inn | inn |
| Winter 24 | **Lantern Festival** (finale) | town_square → riverside_park |
| Sat & Sun | Sable's peddler stall | town_square (Sat) / riverside_park (Sun) |

**Birthdays** (season day): mira Spring 12 · barnaby Spring 5 · ferris Spring 20 · theo Spring 25 · nana_fen Summer 2 · juno Summer 9 ·
rosalind Summer 17 · pip Summer 25 · willa Autumn 3 · hattie Autumn 9 · gus Autumn 11 · odell Autumn 20 · lottie Autumn 27 ·
henrik Winter 3 · rhea Winter 6 · elias Winter 12 · celeste Winter 18 · bramwell Winter 22 · sable: *"Nobody knows"* (no birthday).

## 10. Jobs & activities

| Job | Boss | When | Mechanic |
|---|---|---|---|
| **Bakery Helper** | Rosalind (spot `job_bakery`) | Mon–Sat 07:00–11:00 | UI mini‑game **kneading** (rhythm/timing, 3 rounds); pay by score; affection to Mira & Rosalind. |
| **Parcel Runner** | Theo (spot `post_counter`) | Mon–Sat 13:00–17:00 | Pick up 3–5 parcels with addressee names; find each NPC (use their schedules!) and hand over before the deadline. Pay by speed. |
| **Lamplighter** | Mayor Odell (spot `job_lamplighter`) | nightly 17:30–19:30 (after prologue) | Walk the lamps and **light** each *repaired* lamp (`lamp` interactable). Lit lamps stay lit all night. Pay per lamp. |
| **Fishing** (activity) | — | any time; rod needed (`fishing_rod` key item) | Cast at a `fishing` spot → wait → bite → UI mini‑game (**fishing** timing/tension bar). Fish depend on spot water kind, season, weather, time. |
| **Foraging** (activity) | — | any time | `forage` spots refill daily from a seeded table by area & season. |
| **Stargazing** (activity) | — | night, at a `telescope` | short calm scene; some constellations unlock Celeste dialogue. |
| **Reading** (activity) | — | library shelves | collectible `books`; reading logs them; some give small perks / hints. |
| **Errands** | notice board / villagers | daily board | quest engine. |

## 11. Items, tags, content targets

Categories: `food`, `fish`, `forage`, `gift`, `material`, `book`, `tool`, `key`, `misc`.
Gift/preference **tags** (use these only): `sweet baked savory seafood fish flower herb mushroom berry fruit book tea coffee cocoa gem star shell lantern craft drink egg cheese trinket tool junk honey`.

D1 content targets (minimums): **≥ 16 fish** (spread over spots/seasons/weather/rarity, incl. 2 legendary), **≥ 20 forage items** (≥5 per season),
**≥ 14 foods & baked goods**, **≥ 16 gifts/trinkets/flowers** (each NPC must have ≥ 3 loves, 4 likes, 3 dislikes, 2 hates *resolvable* to real items/tags),
**≥ 8 materials**, **≥ 12 key items** (rod, town map, journal, cottage key, workshop key, five Lantern Pieces, Great Lantern parts…), ≥ 10 books,
8+ shops' worth of stock (general_store, bakery, cafe, clinic, inn, fishing_hut, peddler, flower_stall), ≥ 30 mail letters (story + flavour).

## 12. Writing style guide (dialogue)

- **Simple, natural, warm.** Everyday spoken English; no archaic or modern‑meme slang. Contractions welcome. Short sentences.
- One dialogue box ≈ **≤ 120 characters, ≤ 2 sentences** (the UI shows ~3 lines). Split long speeches into several `say` steps.
- Every villager has a **voice**: Mira rambles and exclaims; Willa trails off with "…"; Juno is blunt and teasing; Rhea is dry and precise;
  Celeste is poetic and drifts; Odell puns; Theo gossips and rushes; Nana Fen teases kindly; Gus exaggerates; kids shout.
- Use `{player}` for the protagonist's name; never assume pronouns beyond "he" for the protagonist.
- Variety matters: talk pools branch on **season, weather, weekday, hearts, time of day, flags**. No NPC should repeat the same line two days running.
- Humour is gentle. Emotional moments are understated. No violence, no cruelty, nothing grim.
- Portrait expressions must match the line: use `neutral happy sad angry surprised shy thinking laugh worried smug`.

## 13. Art direction

### 13.1 Camera & composition (fixed — never rotates, never user‑adjustable)
Fixed **3/4 overhead**: yaw 0 (looking north), pitch ≈ **52° down**, narrow perspective FOV (~30°) so it reads almost isometric. The camera only **pans** to follow the player
(smoothed, clamped to the area). Building fronts face south toward the camera. Interiors are cut‑away rooms (back + side walls visible, front wall absent).

### 13.2 Environments — "pre‑rendered‑inspired", cosy, nostalgic
- Rich **hand‑painted procedural textures** (grass with blade strokes & clover, mottled dirt paths with pebbles, rounded cobbles with mortar, planked wood with grain/nails,
  scalloped roof shingles, plaster walls with timber beams, brick, stone, sand ripples, animated water with foam & sparkle).
- Soft warm lighting, painted sky with drifting clouds, distant hills/sea horizon layers, **baked contact shadows / ambient occlusion** at wall bases and under trees, gentle haze.
- Chunky, friendly, slightly exaggerated shapes (rounded roofs, big windows, crooked signs). Flower boxes, hanging signs, bunting, barrels, crates, laundry lines. Lived‑in clutter.
- Windows glow warm at night; lamp posts have soft halos; chimneys smoke; wind sways grass/trees; fountains splash; birds, butterflies, petals, leaves, snow, rain by season/weather.
- Seasons change palette, foliage, ground cover and ambient particles (spring blossom, summer lush, autumn amber leaves, winter snow‑capped roofs).
- Palettes — spring: fresh green `#8fd16a`, blossom `#ffb7cf`, sky `#9fd8ff` · summer: deep green `#5fbf4a`, sky `#6ec6ff`, sunflower `#ffd23f`, sea `#3fc5c9` ·
  autumn: amber `#e8923a`, russet `#c2562b`, gold grass `#c9b45a`, dusk `#f2b27a` · winter: snow `#f4f9ff`, ice `#bfe0f5`, evergreen `#2f6b4f`, window glow `#ffc46b`.

### 13.3 Characters (3D chibi) — see ARCHITECTURE §Characters
~2.5‑heads‑tall, big round heads, mitten hands, round boots, **toon shading with dark inverted‑hull outlines**, layered hair pieces, big anime eyes painted on the face with
swappable expressions + blinking, blush, soft blob shadows. Expressive procedural animation (squash & stretch, head bobs, arm swings, happy hops, droopy sad, flustered shy).
Kids smaller, elders slightly shorter/rounder. Seasonal outfits for NPCs (coats/scarves in winter, light wear in summer).

### 13.4 Portraits (2D) — see ARCHITECTURE §Portraits
**Late‑90s anime/manga bust portraits**: clean mid‑weight line art, flat cel shading with one soft shadow tone, big glossy eyes with 2–3 highlights, small nose/mouth,
flowing hair strands with highlight bands, blush lines, sweat drops/sparkles/anger veins for emotion, subtle head tilt. 9 characters × 10 expressions. Transparent background, soft outline.

### 13.5 UI
Cosy storybook look: **parchment panels** `#fff4dc` with warm brown borders `#8a5a3a`, rounded corners, soft shadows; ink text `#4a3426`; accents leaf `#6fb85a`, sky `#6fb7e8`, berry `#e0607e`,
sun `#f4c542`, night `#2b3a67`. Fonts: **Nunito** (body) / **Fredoka** (headings) via Google Fonts with system fallbacks (layout must not depend on them). Dialogue box bottom‑centre with name tab,
typewriter text, ▼ prompt, portrait standing on the left of the box. Title logo = a glowing lantern + "Lanternbrook Days".

## 14. Audio direction
Warm, nostalgic, gently playful: marimba/pluck/flute‑like leads, soft pads, light shaker/kick, acoustic‑ish bass. Original melodies, simple memorable motifs, seasonal variations of the town theme,
a night theme, shop/café/harbor/woods/hilltop themes, festival and romance themes, short stingers. SFX are soft and rounded (no harsh beeps). Ambience beds: birds (day), crickets (night), waves (harbor), rain, wind.
All synthesised in the browser with WebAudio; nothing sampled or copied.

## 15. Controls & UX (settled)

| Action | Keys |
|---|---|
| Move | Arrow keys / **WASD** (8‑direction) |
| Run | hold **Shift** |
| Confirm / talk / interact | **Space**, **Enter**, **Z**, **F** |
| Cancel / back | **X**, **Backspace**, **Esc** (Esc opens the menu when in the field) |
| Menu | **Esc**, **Tab**, **M** |
| Quick menu tabs | **I** items · **J** journal/quests · **M** map · **Q / E** (or **[ / ]**) switch tabs |
| Mouse / touch | click/tap UI directly; on touch devices a **virtual stick + A/B/Menu** overlay appears |
| Gamepad | left stick/d‑pad move, **A** confirm, **B** cancel, **Start** menu, **LB/RB** tabs, **X** run |

UX rules: text speed setting; hold confirm to fast‑forward text; every interactable shows a prompt (`Space: Talk`) when in reach; the game never traps the player; the clock pauses in dialogue/menus/mini‑games.
