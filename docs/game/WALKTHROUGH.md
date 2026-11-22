# Lanternbrook Days - Walkthrough

> **SPOILERS.** This page spells out every quest, every romance path and the ending. It is checked against the game by
> `npm run analyze` (static: every item and unlock has a real source) and `tests/unit/sys-story.test.mjs` (a scripted player
> finishes the tutorial, all nine main quests, all five romances and the Winter 24 ending). Where it says "tested", that path ran.

## Rules of thumb

- A year is 4 seasons of 28 days. **Spring 1 is a Monday**; every season starts on a Monday. The story ends on **Winter 24**.
- One conversation counts per villager per day (+12 affection). **One gift per villager per day**; the first three gifts of a
  week are worth full value, later ones count for nothing. 100 affection = 1 heart.
  Gifts: loved +80, liked +45, neutral +20, disliked -20, hated -60 (x3 on their birthday). Unvisited partial hearts melt away after 3 idle days.
- **Give-quests can be handed in all at once.** "Bring 3 sea glass to Gus": choose "Give a gift", pick the item, then
  "Hand over all 3 for the quest" - one hand-in, which counts as that day's single gift (same reaction and affection as one
  gift of that item). "Just one, as a gift" gives one item (progress carries over). If you already gave that villager a gift
  today you can still deliver quest items (no affection, the daily gift stays unused).
- Quests advance when you do the thing, but item and "be near" goals are checked every ~10 game minutes and whenever you enter an area. If a stage seems stuck, wait a few minutes or step outside and in.
- Opening hours (closed days): bakery 07-17 (Sun), café 10-20 (Mon), town hall 09-16 (Sat, Sun), general store 09-18 (Wed),
  clinic 09-17 (Sun), library 10-18 (Tue), inn 10-22, fishing hut 06-18 (Thu), observatory 16:00 to 03:00, workshop 06-02 (locked until Odell gives you the key).
- Money: start 300 c. A bakery shift pays 80 + up to 60 and costs 20 of your 100 energy. Fishing costs 3 energy a cast, foraging 1.
  Sleep in bed before midnight for full energy (after midnight 70%, forced collapse at 02:00 costs coins and half your energy).
  Benches give +3 energy per 10 minutes. Money is not tight: the tested playthrough held 1,500+ coins by autumn.
- **Stalls**: Sable's peddler stall (Sat in the square, Sun in Riverside Park) and Hattie's flower stall open from the villager's menu:
  talk to them and pick **Browse wares**.
- Time only passes while you can walk around: dialogue, shops and cutscenes pause the clock.

## The first week

| Day | What to do |
|---|---|
| **Mon Spring 1** | The prologue starts on Brook Lane (Odell hands you the cottage key and a map). Walk to **Rye & Rose Bakery** for **07:00** (Rosalind) and work your **first shift** at the job board (`t_first_shift`, +50 c). Then the **hello tour**, *in this order* (a quest stage only counts the person it asks for): **Hattie** (flower stall, town square) -> **Theo** (general store / roaming) -> **Mira** (bakery, or on the square bench at noon) -> **Barnaby** (general store, closed Wed) -> **Nana Fen** (Heron Inn, open from 10:00) -> **Willa** (library, closed Tue). Reward 100 c + 2 bread. |
| Same day | Visit **Pelham's Fishing Hut** on the harbor (06-18, not Thu): Captain Gus lends you a **rod and 5 bait**. Cast at the pier or beach spots; the first catch finishes `t_first_catch` (+40 c). Pick **3 sparkling spots** (Brook Lane, the park, harbor, woods or hill) for `t_forage`. Step into the cottage and stand near the **noticeboard** in the square (`m1_arrival`), then sleep. |
| Tue-Wed | Keep talking to everyone (+12 each, hearts toast). Check the cottage mailbox each morning (letters carry coins and gifts). Shifts Mon-Sat 07:00-11:00 are the steady income. |
| **Wed Spring 3, morning** | Wake in the cottage: a loose floorboard turns up **Tobias' Journal** (the event also fires if you walk into the cottage between 06:00 and 14:00 on any later day). `m1` completes (+50 c) and `m2_journal` starts. |

## The nine main quests

All dates are the earliest day each quest can start; they run in any order afterwards and nothing expires before Winter 24.
The Lantern Pieces needed for the finale are Ember Glass (m3), Brass Blueprint (m4), Sea Lens (m5), Spiced Lamp Oil (m6) and Starlight Wick (m7).

### 1. `m1_arrival` - A New Chapter (Spring 1)
Enter the cottage, stand near the noticeboard in the Town Square, sleep until Spring 3. +50 c.

### 2. `m2_journal` - Tobias' Journal (Spring 3, after the journal turns up)
1. **Talk to Mayor Odell** (Town Hall 09-16 Mon-Fri; on weekends he strolls around town). He gives the **workshop key** and unlocks the workshop.
2. Walk into **Tobias' Workshop** on Brook Lane. +100 c. This starts the first lantern story.

### 3. `m3_baker` - The Baker's Lantern (Spring 3+)
1. Talk to **Rosalind** (bakery).
2. Work **2 bakery shifts** (07:00-11:00, Mon-Sat, one per day) - these must come after the talk.
3. **Wild honey** x1 from a Whispering Woods forage spot (roughly 4-10% per spot per day; the woods have 8 spots, so it takes a few days; summer is best). Give it to Rosalind (gift).
Reward: 150 c, **Ember Glass**, lantern 1 (Town Square lamps).

### 4. `m4_reader` - The Reader's Lantern (Spring 15+; Willa's letter arrives that morning)
1. Talk to **Willa** (library 10-18, not Tue). She gives you her riddle.
2. In the library, examine **the lamplighter's shelf** (the fourth bookshelf: almanacs and festival histories). You find the blueprint.
3. Talk to Willa again. Reward 150 c, **Brass Blueprint**, lantern 2 (Market Street lamps).

### 5. `m5_sailor` - The Sailor's Lantern (Summer 1+)
1. Talk to **Captain Gus** (hut early, then the harbor).
2. Forage **3 sea glass** on the harbor beach (about 5-10% per spot per day; harbor has 4 spots; it can take a week or two).
3. Give Gus the glass: **all 3 in one hand-in** ("Hand over all 3 for the quest"). Reward 150 c, **Sea Lens**, lantern 3 (Harbor lamps).

### 6. `m6_cafe` - The Café Lantern (Summer 15+)
1. Talk to **Rhea** at the Copper Kettle (10-20, closed Mon).
2. Buy **2 cocoa beans** at the café (40 c each).
3. Reach **3 hearts** with Rhea (300 affection): talk daily and give loved/liked gifts - coffee (50 c), croissant (55 c) are loved; tea, herbal tea, cocoa, cheese sandwich are liked. About a week. Reward 150 c, **Spiced Lamp Oil**, lantern 4 (Riverside Park lamps).

### 7. `m7_stargazer` - The Stargazer's Lantern (Autumn 1+; open the observatory after 16:00)
1. Talk to **Celeste** (observatory from 16:00, Starview Hill at 20:00).
2. In the **observatory**, examine the **star map**: the mentor's notes are under it (only appear once you took the quest).
3. Find a **moonpetal** on Starview Hill (about 5-12% per spot, 3 spots). Celeste takes it for the wick on the spot. (Moonpetals are also Celeste's favourite gift, so grab spares.)
Reward 150 c, **Starlight Wick**, lantern 5 (Hill and Woods lamps).

### 8. `m8_greatlantern` - The Great Lantern (when all five pieces are done)
Odell mails you. 1. Stand at **Tobias' workbench** in the workshop: the five pieces fuse into the **Great Lantern**. 2. Talk to **Henrik** (roams Brook Lane / the square). 3. Show it to **Odell**. Reward 200 c, lantern 6 (Brook Lane lamps), and m9 starts.

### 9. `m9_festival` - The Lantern Festival (Winter 24)
Be in the **Town Square on Winter 24 between 17:00 and 21:30** (arrive early: the ceremony starts by itself at 17:00 while you stand there). You light the Great Lantern, then the ending plays: **Together** with whoever you are dating, otherwise **Friends**. Reward 500 c. If you never finished the stories the festival still happens ("not every lamp is mended"), you still get the Friends / Together ending, but no Great Lantern credit.

## Side quests (all optional)
Talk to the giver once to start. Items: Mira 4 wild strawberries (summer forage); Willa an ink bottle (general store 45 c); Juno catch 3 fish; Rhea 2 coffee beans (café 30 c); Celeste a cheese sandwich (café/inn 60 c); Odell/Hattie flyers; Theo's parcel (visit the harbor crates); Nana Fen 2 knitting wool (store 40 c); Gus a sea bass (pier or beach, not winter); Rosalind 5 flour (15 c); Barnaby one parcel run (13:00-17:00 at the post counter); Elias 3 hill thyme (hill forage); Pip look at the mushroom grove; Lottie 2 cookies (bakery 25 c); Ferris a tea (35 c); Bramwell forage 6 things; Sable 3 seashells (harbor, not winter); Henrik 4 planks (20 c). The notice board in the square adds 2-3 errands a day.

## Romance (five paths)
Only one partner. You need **8 hearts** (800 affection), then the **8-heart scene** asks you; accepting sets "dating". Scenes at 2, 4, 6 and 8 hearts each need the previous one, and the 6- and 8-heart scenes lock once you are dating someone else. If you answer "I need a little more time" the scene returns a week later (tested). Talk daily plus three gifts a week reaches 8 hearts in about 3 weeks.

| Who | Loves (+80) | Likes (+45, by tag) | Avoid | Scenes (stand in the area at the time) |
|---|---|---|---|---|
| **Mira** (bday Spring 12) | cake slice (bakery/café 90 c), berry tart (bakery, summer-autumn 75 c) | baked goods, berries, flowers, cocoa | fish, mushrooms, tools, junk | 2: bakery 07-11, not Sun. 4: **town square 06:00-07:00**, not Sun (she lets you into the closed bakery). 6: Riverside Park 17:30-20:00, dry. 8: Starview Hill 06:00-08:30, dry. |
| **Willa** (bday Autumn 3) | ink bottle (store 45 c), lavender (clinic 35 c; flower stall in summer/autumn), her own book (a reward) | books, tea, herbs, stars | fish, seafood, coffee | 2: library 10-17 on a **rainy** day. 4: library 10-17:30, not Tue. 6: Starview Hill at **night**, dry. 8: **Autumn 14** festival, town square 17:00-22:00, or **Autumn 15+** in the library 15:00-17:45. |
| **Juno** (bday Summer 9) | sea bass (catch it), brass compass (fishing hut 200 c) | fish, seafood, savory food (grilled fish 65 c), tools | flowers, tea, cocoa | 2: harbor 07-12, dry, with a rod. 4: harbor 08-18 on a **rainy** day. 6: fishing hut 13-18 (not Thu). 8: harbor 17:30-20:00 **after the Sailor's Lantern (m5)**. |
| **Rhea** (bday Winter 6) | coffee (café 50 c), croissant (55 c), lily (flower stall, spring-summer) | cocoa, tea, herbs, cheese | cake, cookies, trinkets | 2: café 10-19, not Mon. 4: café at night (18:30-20:00). 6: café 17-20 on a **rainy** day. 8: **stand in the town square on a Monday 18:00-22:00** (the café is closed; she invites you in). |
| **Celeste** (bday Winter 18) | moonpetal (hill forage), star charm (a reward), star map print (Sable, 150 c), moonstone (Sable, 420 c) | stars, gems, flowers, tea | savory food, coffee, junk | 2: Starview Hill at night, dry. 4: same, **summer or autumn**. 6: observatory 16:00 on. 8: Starview Hill on a clear **winter night, after the Stargazer's Lantern (m7)**. |

Tested: Mira (including declining first), Rhea, Willa, Juno (with m2-m5) and Celeste (with the whole story) all reach the Together ending.
Being together does not need the lantern stories: it only needs the 8-heart scene before Winter 24.

## The five festivals
| Date | Where, when | What happens |
|---|---|---|
| **Blossom Picnic**, Spring 14 | Riverside Park 11-17 (bakery, café, library closed) | Share a basket with Mira, Theo or Nana Fen: +30 affection. |
| **Midsummer Lights**, Summer 21 | Harbor 19-23 (library, clinic closed) | Fireworks with Juno (+20 affection with Juno). |
| **Autumn Moon Fair**, Autumn 14 | Town Square 11-20 (store, library closed) | Pick: watch the bake-off (Mira, Rosalind +20), the fishing contest (Juno +20) or the reading (Willa +20). Willa's 8-heart scene can start here after 17:00. |
| **Hearthlight Evening**, Winter 10 | Heron Inn 17:30-22 (bakery, café, store closed) | Nana Fen gives knitting wool and 2 hot cocoa (+30 with her). |
| **Lantern Festival**, Winter 24 | Town Square 17:00-21:30 (nearly everything closed) | The finale. You light the Great Lantern; the ending plays. |

Each festival closes some shops all day, so buy what you need the day before.

## How to finish by Winter 24

| When | Do |
|---|---|
| Spring 1-3 | Prologue, bakery shift, hello tour, rod, forage, sleep; Spring 3 journal; m2. |
| Spring 3-14 | **m3**: talk to Rosalind, two shifts, forage the woods for honey. Start courting your favourite (daily talk + a gift three times a week). Blossom Picnic on Spring 14. |
| Spring 15 - Summer 1 | **m4** (Willa, library shelf). |
| Summer 1-14 | **m5** (forage the harbor beach every day you are free: sea glass is the slowest item; then one hand-in). Midsummer on Summer 21. |
| Summer 15 - Autumn 1 | **m6** (cocoa beans, Rhea to 3 hearts). Keep foraging if m5 is still open. |
| Autumn 1-28 | **m7** (notes, moonpetal). Autumn Moon Fair on Autumn 14. By the time m7 is done, m8 unlocks. |
| Late autumn - Winter 23 | **m8** (workbench, Henrik, Odell). Finish your romance: the 8-heart scene before Winter 24 (Celeste's needs a clear winter night; Rhea's a Monday evening). Hearthlight on Winter 10. |
| **Winter 24, 17:00** | Be in the Town Square. Light the Great Lantern. |

If you fall behind, nothing breaks: the festival runs on Winter 24 regardless (see m9), and anything unfinished simply stays open.
