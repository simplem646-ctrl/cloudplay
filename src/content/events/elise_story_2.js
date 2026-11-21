// Elise Whitmore (S2), part 2: slice-of-life, confession, promise. (_08_climax skipped at the trimmed scope.)

import {
  say, narrate, think, choice, opt, iff, place, moveTo, pose, emote, fade,
  lighting, sfx, music, setFlag, friend, giveItem, quest, romance,
} from '../../sim/script_dsl.js';

const ev = (o) => ({ kind: 'romance', priority: 60, repeat: 'once', skippable: true, ...o });

export default [
  // ------------------------------------------------------------------------------------------------ a: Larkin Books
  ev({
    id: 'elise_a_larkin_crates', title: 'Crates at Larkin Books', priority: 55,
    trigger: { type: 'enterMap', map: 'town_square', time: ['15:00', '18:30'] },
    when: { all: [{ hearts: ['elise', '>=', 3] }, { notSeen: 'elise_a_larkin_crates' }] },
    script: [
      fade('out', 300), place('theo', 'entrance', 'right'), place('elise', 'door_books', 'down'), lighting('sunset'), music('town_autumn'), fade('in', 400),
      narrate(`Outside Larkin Books, Elise stands behind a wall of crates, wearing an apron two sizes serious.`),
      say('elise', 'surprised', `Theo! Don't come closer! Seven boxes. One ladder. A delivery of nine hundred paperbacks, all out of order.`),
      say('elise', 'shy', `...Would you, maybe, hold the ladder? And some of the books? ...All of the books?`),
      choice([
        opt(`"Point me at the heavy ones."`, [
          say('elise', 'happy', `Atlases. Dictionaries. A thirty-volume history of ropes. Mr. Larkin is a man of passions.`),
          friend('elise', 4), setFlag('elise_a_helped'),
        ]),
        opt(`"Teach me the shelving system."`, [
          say('elise', 'happy', `There isn't one. It's by feeling. Mystery near the window, sea stories by the door, sad ones where the light's warm.`),
          friend('elise', 5), setFlag('elise_a_taught'),
        ]),
        opt(`"Let me guess which one's your favourite."`, [
          say('elise', 'surprised', `That's cheating. It's the third one down. The green one. How did you...?`),
          say('theo', 'happy', `You touched it last. Gently.`),
          friend('elise', 5), setFlag('elise_a_guessed'),
        ]),
      ]),
      say('elise', 'neutral', `Books are a funny kind of home. You carry them in boxes, and they carry you.`),
      say('elise', 'shy', `Thank you. For carrying. ...For listening to the ropes.`),
      giveItem('novel_mystery'), sfx('item'),
      say('elise', 'happy', `Take this. It's a mystery. There's a butler, I promise. You'd appreciate it.`),
      setFlag('elise_larkin_afternoon'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ b: reading to the cat
  ev({
    id: 'elise_b_audience_of_one', title: 'An Audience of One', priority: 55,
    trigger: { type: 'enterMap', map: 'town_park', time: ['14:00', '18:30'] },
    when: { all: [{ hearts: ['elise', '>=', 5] }, { seen: 'elise_03_secret' }, { notSeen: 'elise_b_audience_of_one' }] },
    script: [
      fade('out', 300), place('theo', 'entrance', 'right'), place('elise', 'cat_spot', 'down'), lighting('auto'), music('town_spring'), fade('in', 400),
      narrate(`Behind the cherry trees, I hear a murmur. Elise is on one knee at the cat spot, reading from a notebook to an orange cat who is mostly asleep.`),
      say('elise', 'happy', `"...and the lamp said, I am not here to be seen. I am here so that someone is seen." Mm. Does that work? Is the "so that" too heavy?`),
      emote('elise', 'dots'),
      say('elise', 'surprised', `Theo! You, um. That's... how long were you there?`),
      say('elise', 'shy', `The cat can't be mean. Cats can't write notes on the margin. So I practise with her. Her name is Marmalade. She's an excellent critic. She walks away from the bad parts.`),
      choice([
        opt(`"Read me the rest. I'll sit by Marmalade."`, [
          say('elise', 'surprised', `...A human audience. A real one. Okay. Okay. Deep breath. I'll... start from the lamp.`),
          friend('elise', 6), setFlag('elise_b_listened'),
        ]),
        opt(`"The 'so that' works. It's the heart of it."`, [
          say('elise', 'happy', `You think? I wasn't sure. Oh. Good. I'll keep it. Marmalade didn't walk away. That's a rave.`),
          friend('elise', 5), setFlag('elise_b_critic'),
        ]),
        opt(`"Marmalade wants a bigger audience."`, [
          say('elise', 'shy', `She wants snacks. She's just polite about it.`),
          friend('elise', 4), setFlag('elise_b_playful'),
        ]),
      ]),
      say('elise', 'happy', `I used to think a voice was something you either had or you didn't. Maybe it's more like a muscle. Small reps. In a park. For a cat.`),
      say('elise', 'shy', `Thank you for not laughing. ...You didn't, did you? I think my ears are too warm to tell.`),
      setFlag('elise_cat_audience'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 06 confession
  ev({
    id: 'elise_06_confession', title: 'The Letter in the Library', priority: 65, repeat: 'daily',
    trigger: { type: 'enterMap', map: 'school_library', time: ['15:30', '18:30'] },
    when: {
      all: [
        { hearts: ['elise', '>=', 6] }, { seen: 'elise_03_secret' }, { partner: null }, { noFlag: 'elise_dating_since' },
        { any: [{ noFlag: 'elise_confess_notyet' }, { hearts: ['elise', '>=', 8] }] },
        { any: [{ year: [2, 3] }, { all: [{ year: 1 }, { season: 'winter' }, { day: [14, 28] }] }] },
      ],
    },
    script: [
      fade('out', 300), place('theo', 'door', 'up'), place('elise', 'nook', 'down'), lighting('sunset'), music('romantic'), fade('in', 500),
      narrate(`Late sun lies across the window nook. Elise sits very straight with an envelope in both hands, like it might fly.`),
      iff({ flag: 'elise_confess_notyet' }, [
        say('elise', 'shy', `You came back. Thank you. I... took longer to rewrite it. It's shorter now. It's much better. It's terrifying.`),
      ], [
        say('elise', 'shy', `Theo. I wrote you a letter. I mean, I wrote you many. This is the one. The others are in the bin. Mostly.`),
      ]),
      say('elise', 'neutral', `I'm going to read it. Aloud. Not into a cat. To you. So if my voice shakes, don't... don't look away. Please.`),
      sfx('page'),
      say('elise', 'sad', `"There was a girl who put her voice in a drawer. Then someone asked first. Then someone listened. Then the drawer was just a drawer."`),
      say('elise', 'sad', `"I don't know how to be loud. But I know how to be brave in a whisper. And I'm choosing you for it."`),
      say('elise', 'shy', `"If you like me back, take the page. If you don't, keep it anyway, as an... editorial note."`),
      say('elise', 'shy', `...I like you, Theo. Very much. Would you... be my person? To read to? To be quiet with? To be loud with, sometimes, quietly?`),
      choice([
        opt(`Take the page. "Yes."`, [
          sfx('heart_big'), emote('elise', 'heart'),
          say('elise', 'surprised', `You... took it. You said yes. In the same breath. That's... that's, I've never had a plot twist go this well.`),
          romance('elise', 'dating'), friend('elise', 10), setFlag('elise_dating_since'), setFlag('elise_confessed_yes'),
          quest('elise_manuscript', 'update', `Elise gave me the page. She is not hiding it anymore. From me, at least.`),
        ]),
        opt(`"Yes. And I'd like to read the next one."`, [
          sfx('heart_big'), emote('elise', 'heart'),
          say('elise', 'happy', `The next one is Chapter Five. It has a kiss. ...Not mine. A fictional one. Please don't read into it. Read into it a little.`),
          romance('elise', 'dating'), friend('elise', 10), setFlag('elise_dating_since'), setFlag('elise_confessed_yes'),
          quest('elise_manuscript', 'update', `Elise gave me the page. She is not hiding it anymore. From me, at least.`),
        ]),
        opt(`"Not yet. I care, but I need time."`, [
          say('elise', 'sad', `...Oh.`),
          say('elise', 'neutral', `That's a reasonable response. A good one. Honest. I'd rather have a slow yes than a fast one.`),
          say('elise', 'happy', `Keep the letter. Please. It's not a promise. It's a bookmark. For when you're ready, or not.`),
          friend('elise', 1), setFlag('elise_confess_notyet'),
        ]),
      ]),
      iff({ dating: 'elise' }, [
        say('elise', 'shy', `Could I, um, hold your hand? It's in the draft. In the margin. "Hold his hand, then panic."`),
        narrate(`Her fingers are cold and careful. She holds on like turning a first page.`),
      ]),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 09 promise
  ev({
    id: 'elise_09_promise', title: 'The Last Line Left Blank', priority: 62,
    trigger: { type: 'enterMap', map: 'school_library', time: ['08:00', '19:00'] },
    when: { all: [{ dating: 'elise' }, { hearts: ['elise', '>=', 8] }, { year: 3 }, { season: 'winter' }, { day: [25, 28] }, { notSeen: 'elise_09_promise' }] },
    script: [
      fade('out', 400), place('theo', 'door', 'up'), place('elise', 'nook', 'down'), lighting('sunset'), music('romantic'), fade('in', 500),
      narrate(`The library, the last winter. The window nook is full of low gold light, and Elise is holding a thick bound stack of paper tied with string.`),
      say('elise', 'happy', `It's finished. "The Keeper of Small Hours." Three hundred and twelve pages. The first copy. I printed it at Mr. Larkin's. He cried. Quietly. Between the shelves.`),
      say('elise', 'shy', `I've been accepted at a writing programme. In the city. Far. I'm scared of the far. But I think I'm braver now.`),
      say('elise', 'neutral', `Read the end. Please. The last page.`),
      narrate(`The last sentence stops halfway. After it, a blank line, and in tiny handwriting: "for you to finish."`),
      choice([
        opt(`"I'll finish it. Whenever you're ready."`, [
          say('elise', 'happy', `That's the ending I hoped for. Not the one I wrote.`),
          friend('elise', 8), setFlag('elise_promise_kind'),
        ]),
        opt(`"I'm going to miss you terribly."`, [
          say('elise', 'sad', `Me too. I wrote a whole chapter about it. It's called "The Distance." It's the best one. I hate that.`),
          friend('elise', 8), setFlag('elise_promise_honest'),
        ]),
        opt(`"Will there be a butler in the sequel?"`, [
          say('elise', 'happy', `There is ALWAYS a butler. You've taught me that. It's a very long-running joke.`),
          friend('elise', 8), setFlag('elise_promise_playful'),
        ]),
      ]),
      say('elise', 'shy', `Promise me something. Bell Night, we ring it together. And I'll read to you from far away. On the phone. On Sundays. At nine.`),
      say('theo', 'happy', `I promise. Sundays at nine. And the bell.`),
      sfx('heart_big'), emote('elise', 'heart'),
      narrate(`She leans her head briefly against my shoulder, as quiet as a bookmark finding its page.`),
      say('elise', 'happy', `"And the bell rang, and no one was afraid of the sound." ...That one's for the end. The real one.`),
      quest('elise_manuscript', 'complete', `Elise finished her novel. The last line is mine to write.`),
      setFlag('elise_promise_made'),
      fade('in', 200),
    ],
  }),
];
