// Elise Whitmore, "the Quiet Writer" (S2). Year 1 beats: meet, spark, secret, Fireworks Night (+ missed-moment version).
// Voice: whispering, ellipses, quotes books (invented titles), fierce and fluent once she forgets to be shy.

import {
  say, narrate, think, choice, opt, iff, place, moveTo, face, pose, emote, cam, fade, flash,
  lighting, sfx, music, setFlag, friend, stat, giveItem, quest,
} from '../../sim/script_dsl.js';

const ev = (o) => ({ kind: 'romance', priority: 60, repeat: 'once', skippable: true, ...o });

export default [
  // ------------------------------------------------------------------------------------------------ 01 meet
  ev({
    id: 'elise_01_meet', title: 'The Window Seat', priority: 62,
    trigger: { type: 'enterMap', map: 'school_library', time: ['08:00', '18:30'] },
    when: { all: [{ notSeen: 'elise_01_meet' }, { any: [{ year: [2, 3] }, { season: ['summer', 'autumn', 'winter'] }, { day: [2, 28] }] }] },
    script: [
      fade('out', 300), place('theo', 'door', 'up'), place('elise', 'nook', 'down'), lighting('indoor'), music('library'), fade('in', 400),
      narrate(`The library is the quietest place I have found in Bellhaven. Dust hangs in the light, and in the window seat a girl is reading with the focus of a lighthouse.`),
      pose('elise', 'sit'),
      think(`She hasn't turned a page in a while. She's rereading the same line. Out of love, not confusion.`),
      moveTo('theo', 'spot_a'),
      say('elise', 'surprised', `...Oh. Sorry. I didn't see you. I was... in the sea. Chapter nine. There's a sea.`),
      say('elise', 'shy', `You're the transfer student. Class B. I'm Elise. Whitmore. Class A. We, um, share a hallway.`),
      choice([
        opt(`"What are you reading?"`, [
          say('elise', 'happy', `"The Lantern Keeper of Marrow Bay." It's about a woman who lights a lamp for ships that never arrive.`),
          say('elise', 'shy', `It sounds sad. It's actually the most hopeful thing I know.`),
          friend('elise', 4), setFlag('elise_meet_kind'),
        ]),
        opt(`"I'm lost. Is there a quiet corner?"`, [
          say('elise', 'happy', `There's always one. You're... standing in it. It's my corner. But it's big enough to share.`),
          friend('elise', 4), setFlag('elise_meet_honest'),
        ]),
        opt(`"Let me guess. The butler did it."`, [
          say('elise', 'surprised', `...No spoilers. There isn't a butler. But if there were a butler, that is NOT how you start a conversation.`),
          say('elise', 'shy', `...I'm sorry. That was loud. For me. I'm not usually... that loud.`),
          friend('elise', 1), setFlag('elise_meet_playful'),
        ]),
      ]),
      say('elise', 'neutral', `Larkin Books on the square, my great-uncle's. I help there. If you need a book you'd like but don't know you'd like... I'm good at that.`),
      say('elise', 'shy', `Not good at much else. Small talk. Noise. People.`),
      say('theo', 'happy', `You're doing fine.`),
      say('elise', 'shy', `...Thank you. I'm, um. Going to go back to the sea. But you can stay. Quietly. Like furniture.`),
      emote('elise', 'sparkle'),
      setFlag('elise_met'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 02 spark
  ev({
    id: 'elise_02_spark', title: 'The Right Word',
    trigger: { type: 'enterMap', map: 'school_library', time: ['15:00', '18:30'] },
    when: { all: [{ hearts: ['elise', '>=', 2] }, { notSeen: 'elise_02_spark' }] },
    script: [
      fade('out', 300), place('theo', 'door', 'up'), place('elise', 'table_2', 'down'), lighting('sunset'), music('library'), fade('in', 400),
      narrate(`Elise is at a table with seven open dictionaries and a pencil in her teeth. A small notebook shields itself behind her elbow.`),
      say('elise', 'surprised', `Theo! Hi! Please don't look at the notebook. It's a... grocery list. A very long grocery list. Of feelings.`),
      say('elise', 'shy', `Actually. You read things, right? I need a word. For the quiet right after a bell stops ringing. The hum. The "afterwards." There's no word, and I've checked.`),
      say('theo', 'neutral', `The bell on the hill? I've never heard it.`),
      say('elise', 'thinking', `Nobody has. Thirty years. That's why I'm writing the word first, so it's ready when the bell is.`),
      choice([
        opt(`"Stillness."`, [
          say('elise', 'happy', `Stillness... it's a good word. Solid. Like a stone in a pocket.`),
          friend('elise', 4), setFlag('elise_word_stillness'),
        ]),
        opt(`"I don't know. A breath, maybe."`, [
          say('elise', 'surprised', `A breath. After a sound. ...That's, that's actually very true.`),
          friend('elise', 4), setFlag('elise_word_breath'),
        ]),
        opt(`"Bell-hush. I just made it up."`, [
          say('elise', 'surprised', `Bell-hush!`),
          say('elise', 'happy', `That's wonderful. That's the word. Lewis Carroll would be furious with jealousy.`),
          friend('elise', 6), setFlag('elise_word_bellhush'),
        ]),
      ]),
      emote('elise', 'note'),
      say('elise', 'shy', `Nobody has ever helped me find a word before. They usually find the "wrong" one for me. And I smile.`),
      say('elise', 'happy', `Next Thursday, the Literature Club meets. Quietly. With tea. You'd... if you wanted to... could sit in. Like furniture.`),
      giveItem('postcard_set'), sfx('item'),
      say('elise', 'shy', `Take these. Postcards. For when you want to write to someone and don't know what to say. I have too many.`),
      setFlag('elise_spark_done'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 03 secret
  ev({
    id: 'elise_03_secret', title: 'The Loose Page',
    trigger: { type: 'enterMap', map: 'town_park', time: ['14:00', '19:00'] },
    when: { all: [{ hearts: ['elise', '>=', 4] }, { seen: 'elise_02_spark' }, { notSeen: 'elise_03_secret' }] },
    script: [
      fade('out', 300), place('theo', 'entrance', 'right'), place('elise', 'bench_1', 'left'), lighting('auto'), music('town_spring'), fade('in', 400),
      narrate(`In the park, wind goes through the cherry trees. Elise is on a bench, writing, with a folder of loose pages weighed down by an apple.`),
      sfx('swoosh'), emote('elise', 'exclaim'),
      narrate(`A gust takes the top page. It tumbles across the grass and sticks to my shoe.`),
      narrate(`Handwriting, tiny and neat. "The Keeper of Small Hours. Chapter Four." At the top there's a title I know: hers.`),
      say('elise', 'surprised', `That's... that's... mine. Please. Please don't read it. Please don't. Please...`),
      choice([
        opt(`Hand it back, unread.`, [
          say('elise', 'shy', `...You didn't read it. You didn't even try.`),
          say('elise', 'sad', `That's the first time anyone's done that.`),
          friend('elise', 6), setFlag('elise_sec_unread'),
        ]),
        opt(`"It's yours. Do you want me to read it?"`, [
          say('elise', 'surprised', `Ask... first? Nobody asks first.`),
          say('elise', 'thinking', `Maybe. Not now. Maybe... soon.`),
          friend('elise', 5), setFlag('elise_sec_asked'),
        ]),
        opt(`"Only one line caught my eye. It's good."`, [
          say('elise', 'sad', `Which one?`),
          say('theo', 'happy', `"The bell kept its silence like a promise."`),
          say('elise', 'surprised', `...You remembered it. Word for word.`),
          friend('elise', 5), setFlag('elise_sec_line'),
        ]),
      ]),
      music('sad', 600),
      say('elise', 'sad', `In middle school I wrote a story. Real, whole. The teacher read it aloud. Everyone laughed. Not at the jokes, there weren't any.`),
      say('elise', 'sad', `At me. At the part where the girl talks to the sea. Someone did the voice for a week.`),
      say('elise', 'neutral', `I stopped sharing. Not writing, I couldn't stop that. Just sharing. It's... a very quiet way to hide.`),
      say('elise', 'shy', `Nobody knows I'm writing a novel. Not Mr. Larkin. Not Ms. Delaney. Just you, now. And the apple.`),
      choice([
        opt(`"Your words aren't the problem."`, [
          say('theo', 'neutral', `The people who laughed were. And they aren't here.`),
          say('elise', 'happy', `...Maybe the problem is that I've been protecting them from the wrong audience.`),
          friend('elise', 5), setFlag('elise_sec_kind'),
        ]),
        opt(`"I'd read it. If you ever want a reader."`, [
          say('elise', 'shy', `A reader. One. Just one.`),
          say('elise', 'happy', `That's the most terrifying and best sentence anyone's said to me.`),
          friend('elise', 6), setFlag('elise_sec_honest'),
        ]),
        opt(`"Okay. Where does the girl talk to the sea?"`, [
          say('elise', 'surprised', `...Chapter two. Page six. She asks the sea what it's listening for.`),
          say('elise', 'happy', `You asked about it like it's real. Thank you.`),
          friend('elise', 5), setFlag('elise_sec_playful'),
        ]),
      ]),
      music('romantic', 800),
      quest('elise_manuscript', 'start', `Elise is writing a novel in secret. I may be its first reader, someday. No pressure. Gently.`),
      say('elise', 'shy', `This stays between us? ...Please?`),
      say('theo', 'happy', `Promise.`),
      say('elise', 'happy', `"A secret kept well is a small lighthouse." ...I made that one up. It's from my book.`),
      setFlag('elise_secret_known'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 04 festival: Fireworks Night Y1
  ev({
    id: 'elise_04_festival', title: 'Writing Under the Lights', priority: 65,
    trigger: { type: 'auto' },
    when: { all: [{ festival: 'fireworks' }, { year: 1 }, { flag: 'fest_fireworks_y1_with_elise' }, { hearts: ['elise', '>=', 3] }, { map: 'town_harbor' }, { notSeen: 'elise_04_festival' }] },
    script: [
      fade('out', 300), place('theo', 'dock_bench', 'left'), place('elise', 'stairs_beach', 'up'), lighting('night'), music('fireworks'), fade('in', 400),
      narrate(`Fireworks Night. The harbor glitters and the crowd oohs on a half-second delay. On the stairs, Elise is writing by the light of a burst of gold.`),
      say('elise', 'shy', `You came. I... saved you a step. It's the fifth one. It has the best view and the worst draft.`),
      sfx('fireworks'), flash(250, '#ffd27a'),
      say('elise', 'happy', `Do you know why I like fireworks? They're so loud nobody hears me.`),
      say('elise', 'shy', `I've been trying something. Reading my own sentences out loud. Quietly. Under the booms.`),
      choice([
        opt(`"Read me one. I'll lean in."`, [
          say('elise', 'surprised', `...Close. You'd have to be very close. It's a rule.`),
          friend('elise', 5), setFlag('elise_fw_lean'),
        ]),
        opt(`"Read it to the sea. I'll just be nearby."`, [
          say('elise', 'happy', `The sea is a good audience. It never interrupts.`),
          friend('elise', 5), setFlag('elise_fw_sea'),
        ]),
        opt(`"Wait for the loudest one."`, [
          say('elise', 'happy', `Oh, that's a plan. A fireworks plan. Wait. Wait. ...Now?`),
          friend('elise', 6), setFlag('elise_fw_loudest'),
        ]),
      ]),
      sfx('fireworks'), flash(300, '#9ad0ff'), music('romantic', 800),
      narrate(`Under a blue burst, she reads, almost without breathing. Eight lines. Her voice is small and absolutely steady.`),
      say('elise', 'sad', `"The sea kept a ledger of every lamp. It never charged for the light."`),
      narrate(`The last boom fades and I'm not sure I'm allowed to move.`),
      say('elise', 'shy', `Was it... did it...`),
      say('theo', 'happy', `I heard every word.`),
      say('elise', 'surprised', `You heard... through the fireworks.`),
      say('elise', 'happy', `That's the first time I've read something aloud since I was twelve. I think I might cry. Is that okay? It's the good kind.`),
      emote('elise', 'heart'), sfx('heart'),
      friend('elise', 3), setFlag('elise_first_read_aloud'),
      quest('elise_manuscript', 'update', `Elise read me eight lines under the fireworks. Her voice held.`),
      fade('in', 200),
    ],
  }),

  ev({
    id: 'elise_04_festival_friend', title: 'The Fifth Step',
    trigger: { type: 'auto' },
    when: { all: [{ festival: 'fireworks' }, { year: 1 }, { hearts: ['elise', '>=', 1] }, { noFlag: 'fest_fireworks_y1_with_elise' }, { map: 'town_harbor' }, { time: ['19:30', '22:30'] }, { notSeen: 'elise_04_festival' }] },
    script: [
      fade('out', 300), place('theo', 'dock_bench', 'left'), place('elise', 'stairs_beach', 'up'), lighting('night'), music('fireworks'), fade('in', 400),
      narrate(`Between bursts, I spot Elise on the harbor steps, notebook on her knees, pencil frozen. She waves, a tiny wave, halfway up.`),
      say('elise', 'shy', `I... saw you from the steps. I didn't know how to cross a whole pier of people. So I waved. It's what I had.`),
      say('theo', 'happy', `Best wave I've had all night.`),
      say('elise', 'happy', `I wrote it down. "Wave across a crowd. Quiet, but counted." ...Next year, I'll walk over.`),
      friend('elise', 2), setFlag('elise_fireworks_missed'),
      fade('in', 200),
    ],
  }),
];
