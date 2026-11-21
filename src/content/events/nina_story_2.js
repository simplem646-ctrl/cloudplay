// Nina Calder (S2), part 2: slice-of-life, confession, promise. (_08_climax skipped at the trimmed scope.)

import {
  say, narrate, think, choice, opt, iff, warp, place, moveTo, face, pose, emote, cam, fade, flash,
  lighting, sfx, music, setFlag, friend, stat, giveItem, quest, romance, spirit,
} from '../../sim/script_dsl.js';

const ev = (o) => ({ kind: 'romance', priority: 60, repeat: 'once', skippable: true, ...o });

export default [
  // ------------------------------------------------------------------------------------------------ a: dawn at the bakery
  ev({
    id: 'nina_a_flour_and_rolls', title: 'Flour and Rolls', priority: 55,
    trigger: { type: 'enterMap', map: 'bakery', time: ['05:00', '08:00'] },
    when: { all: [{ hearts: ['nina', '>=', 3] }, { notSeen: 'nina_a_flour_and_rolls' }] },
    script: [
      fade('out', 300), place('theo', 'door', 'up'), place('nina', 'counter', 'down'), place('mrs_calder', 'oven', 'left'), lighting('indoor'), music('cafe'), fade('in', 400),
      narrate(`Calder Bakery at dawn is the warmest room in town. Flour on every surface, including Nina's eyebrow.`),
      say('mrs_calder', 'happy', `Theo, dear! Early bird! Have a roll, have two, you look underfed. Nina, stop hogging the good butter!`),
      say('nina', 'happy', `I'm not hogging, I'm QUALITY CONTROLLING!`),
      say('nina', 'smug', `Bread-folding challenge. Whoever shapes twelve rolls faster wins. Loser carries the basket to school.`),
      choice([
        opt(`"You're on."`, [
          narrate(`My rolls look like potatoes that have given up. Hers look like they were issued by the government.`),
          say('nina', 'happy', `Twelve! Done! Your fifth one looks like a sad duck!`),
          friend('nina', 4), setFlag('nina_a_raced'),
        ]),
        opt(`"Teach me first, then race."`, [
          say('nina', 'surprised', `...Mom, he asked. Nobody asks. Okay: palm flat, tuck, roll. Like this.`),
          say('mrs_calder', 'happy', `Such a polite boy.`),
          friend('nina', 5), setFlag('nina_a_taught'),
        ]),
        opt(`"I'll carry the basket anyway."`, [
          say('nina', 'shy', `That's... that's a forfeit. A forfeit-for-nothing. Weirdo. ...Thanks.`),
          friend('nina', 4), setFlag('nina_a_carried'),
        ]),
      ]),
      say('mrs_calder', 'neutral', `She still delivers on that knee, you know. I tell her to rest. She laughs. I make more rolls.`),
      say('nina', 'angry', `MOM.`),
      say('mrs_calder', 'sad', `I said nothing! I said rolls!`),
      think(`Everyone in this kitchen is talking about the same thing by not talking about it.`),
      giveItem('sweet_bun'), sfx('item'),
      setFlag('nina_bakery_morning'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ b: the plush
  ev({
    id: 'nina_b_the_plushie', title: 'Strictly Confidential Bear', priority: 55,
    trigger: { type: 'enterMap', map: 'town_square', time: ['15:30', '19:00'] },
    when: { all: [{ hearts: ['nina', '>=', 5] }, { notSeen: 'nina_b_the_plushie' }] },
    script: [
      fade('out', 300), place('theo', 'entrance', 'up'), place('nina', 'bench_1', 'left'), lighting('sunset'), music('town_autumn'), fade('in', 400),
      narrate(`Nina is alone on a bench, shoulders hunched, tenderly smoothing the ears of a small plush bear.`),
      say('nina', 'surprised', `AAH! It's not mine! It's... evidence! For a case!`),
      emote('nina', 'exclaim'),
      say('nina', 'angry', `...Won it at the raffle. It's the softest thing I've ever touched. If you tell Dante I will end you, gently, with cuddles.`),
      choice([
        opt(`"He looks like a good bear."`, [
          say('nina', 'shy', `...His name is Captain. Captain Crumb. He's got a bad ear. He's been through a lot.`),
          friend('nina', 5), setFlag('nina_b_kind'),
        ]),
        opt(`"Why hide it? It's great."`, [
          say('nina', 'neutral', `Because the track captain is supposed to be tough. Tough people don't own bears.`),
          say('nina', 'thinking', `...Okay, you're right. That's a dumb rule. I made it up. It's mine and I hate it.`),
          friend('nina', 5), setFlag('nina_b_honest'),
        ]),
        opt(`"Can I hold Captain Crumb?"`, [
          say('nina', 'happy', `You may hold him for four seconds! Three! He's very busy!`),
          friend('nina', 4), setFlag('nina_b_playful'),
        ]),
      ]),
      say('nina', 'happy', `Secret's safe? Swear it on your sneakers.`),
      say('theo', 'happy', `I swear it on my sneakers.`),
      say('nina', 'happy', `Good. You may sit. Captain Crumb approves of you. He doesn't like flowers either.`),
      setFlag('nina_plush_secret'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 06 confession
  ev({
    id: 'nina_06_confession', title: 'Sprinter at Sunset', priority: 65, repeat: 'daily',
    trigger: { type: 'enterMap', map: 'school_field', time: ['16:30', '19:30'] },
    when: {
      all: [
        { hearts: ['nina', '>=', 6] }, { seen: 'nina_03_secret' }, { partner: null }, { noFlag: 'nina_dating_since' },
        { any: [{ noFlag: 'nina_confess_notyet' }, { hearts: ['nina', '>=', 8] }] },
        { any: [{ year: [2, 3] }, { all: [{ year: 1 }, { season: 'winter' }, { day: [14, 28] }] }] },
      ],
    },
    script: [
      fade('out', 300), place('theo', 'spot_a', 'right'), place('nina', 'track_finish', 'left'), lighting('sunset'), music('romantic'), fade('in', 500),
      narrate(`The field is empty, orange, and quiet. Nina is sitting on the finish line, shoes off, talking to the sky.`),
      iff({ flag: 'nina_confess_notyet' }, [
        say('nina', 'shy', `Back again! I rehearsed. I didn't rehearse better. Just louder. In my head.`),
      ], [
        say('nina', 'shy', `Theo! You came! I mean, obviously, I told you to come. I wrote it on my hand. It smudged. I forgot why.`),
      ]),
      say('nina', 'neutral', `I told Coach about the knee. And Mom. And I'm seeing a specialist next week. It was awful and then... fine. Everybody just said "okay."`),
      say('nina', 'happy', `That's because of you. I didn't say that part to them. I'm saying it to you.`),
      say('nina', 'shy', `Okay. Sports metaphor. Don't laugh. I'm at the starting line, you're the only person I want to hear the whistle with, and I forgot what the rest of the metaphor was.`),
      say('nina', 'shy', `I like you, Theo. Like-like. Cheeks-hot, can't-eat-a-sandwich like. Will you... go out with me? Be the person I run beside?`),
      choice([
        opt(`"Yes. Always."`, [
          sfx('heart_big'), emote('nina', 'heart'),
          say('nina', 'happy', `YES?! Yes! YES! Say it again! No, don't, I'll cry on the track!`),
          romance('nina', 'dating'), friend('nina', 10), setFlag('nina_dating_since'), setFlag('nina_confessed_yes'),
          quest('nina_comeback', 'update', `Nina told her coach and her mom. We start this together.`),
        ]),
        opt(`"I like you too. Race you to the gate."`, [
          sfx('heart_big'), emote('nina', 'heart'),
          say('nina', 'happy', `You're on! The gate is thirty metres! That's practically an admission!`),
          say('nina', 'shy', `...Yes. That was a yes. Wasn't it?`),
          romance('nina', 'dating'), friend('nina', 10), setFlag('nina_dating_since'), setFlag('nina_confessed_yes'),
          quest('nina_comeback', 'update', `Nina told her coach and her mom. We start this together.`),
        ]),
        opt(`"Not yet. I'm not ready, and I'm sorry."`, [
          say('nina', 'sad', `...Oh.`),
          say('nina', 'neutral', `Okay. Okay! That's a fair call. Honest. I'd rather have honest than fast. ...Give me a second to run a lap in my head.`),
          say('nina', 'happy', `We're still friends. The best ones. Don't go anywhere, Theo.`),
          friend('nina', 1), setFlag('nina_confess_notyet'),
        ]),
      ]),
      iff({ dating: 'nina' }, [
        say('nina', 'happy', `Walk me home? It's the long way. Past the bakery. Past the whole town. So everyone sees.`),
        moveTo('nina', 'spot_b', { wait: false }), moveTo('theo', 'spot_a'),
        narrate(`She takes my hand like she's checking the temperature, then holds on like she's decided.`),
      ]),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 09 promise
  ev({
    id: 'nina_09_promise', title: 'Rolls After Closing', priority: 62,
    trigger: { type: 'enterMap', map: 'town_square', time: ['07:00', '21:30'] },
    when: { all: [{ dating: 'nina' }, { hearts: ['nina', '>=', 8] }, { year: 3 }, { season: 'winter' }, { day: [25, 28] }, { notSeen: 'nina_09_promise' }] },
    script: [
      fade('out', 400), warp('bakery', 'counter'), place('theo', 'door', 'up'), place('nina', 'table_1', 'down'), lighting('indoor'), music('romantic'), fade('in', 500),
      narrate(`The bakery after closing. The oven ticks as it cools. Nina has two rolls, two mugs of cocoa, and a face that isn't joking.`),
      say('nina', 'happy', `Sit! Eat! This is a ceremonial last-batch. Mom made me promise to be sappy. She's upstairs listening. Hi, Mom!`),
      say('nina', 'neutral', `The state team's offered me a place. In the city. Four hours away. They want me for my times. The new times. The ones I got by... not hurting.`),
      say('nina', 'shy', `I'm going, Theo. I want to. But I'm scared I'll go and the thing that makes me me stays here. In this kitchen. On this field. With you.`),
      choice([
        opt(`"Go. We'll make four hours short."`, [
          say('nina', 'happy', `I'll write. I'll call. I'll run home every holiday. I'll measure it. It's four hours by bus, two by me.`),
          friend('nina', 8), setFlag('nina_promise_kind'),
        ]),
        opt(`"I'll miss you. I'll cheer anyway."`, [
          say('nina', 'sad', `...Don't make me cry in my own bakery. It's bad for business.`),
          friend('nina', 8), setFlag('nina_promise_honest'),
        ]),
        opt(`"I'll visit. You'll still lose every race."`, [
          say('nina', 'happy', `Ha! You wish! I'll race you at dawn! I'll give you a ten-city head start!`),
          friend('nina', 8), setFlag('nina_promise_playful'),
        ]),
      ]),
      say('nina', 'neutral', `Promise me one thing. Bell Night, we ring it together. Midnight. I'll sprint up that hill if I have to.`),
      say('nina', 'shy', `And promise me you'll stand at the finish line, wherever it is. I'll find you.`),
      say('theo', 'happy', `I promise. Both.`),
      sfx('heart_big'), emote('nina', 'heart'),
      narrate(`She presses her forehead briefly to mine, flour and all. Then she shoves a roll in my hand to hide that she is crying.`),
      say('nina', 'happy', `Pinkie swear on the bread. It's legally binding.`),
      quest('nina_comeback', 'complete', `She runs for joy now. We both do.`),
      setFlag('nina_promise_made'),
      warp('town_square', 'door_bakery'),
      fade('in', 200),
    ],
  }),
];
