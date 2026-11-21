// Vera Lindqvist (S3), part 2: confession and Bell Night promise. (_05_crisis, _07_date, _08_climax, _10_farewell are not written at this scope.)

import {
  say, narrate, think, choice, opt, iff, place, moveTo, face, pose, emote, cam, fade,
  lighting, sfx, music, setFlag, friend, quest, romance,
} from '../../sim/script_dsl.js';

const ev = (o) => ({ kind: 'romance', priority: 60, repeat: 'once', skippable: true, ...o });

export default [
  // ------------------------------------------------------------------------------------------------ 06 confession
  ev({
    id: 'vera_06_confession', title: 'Twenty-Two Bars', priority: 65, repeat: 'daily',
    trigger: { type: 'enterMap', map: 'school_rooftop', time: ['16:30', '20:30'] },
    when: {
      all: [
        { hearts: ['vera', '>=', 6] }, { seen: 'vera_03_secret' }, { partner: null }, { noFlag: 'vera_dating_since' },
        { any: [{ noFlag: 'vera_confess_notyet' }, { hearts: ['vera', '>=', 8] }] },
        { any: [{ year: [2, 3] }, { all: [{ year: 1 }, { season: 'winter' }, { day: [14, 28] }] }] },
      ],
    },
    script: [
      fade('out', 300), place('theo', 'door', 'up'), place('vera', 'fence_a', 'up'), place('biscuit', 'cat_spot', 'down'), lighting('sunset'), music('romantic'), fade('in', 500),
      narrate(`Dusk on the roof. No headphones. No licorice. Vera's standing at the fence with her hands in her hoodie pocket, and Biscuit is looking at her with the expression of a cat who knows something.`),
      iff({ flag: 'vera_confess_notyet' }, [
        say('vera', 'neutral', `You're back. I assumed you'd gone. I assumed it very loudly in my head.`),
      ], [
        say('vera', 'neutral', `You're late. Four minutes. I counted. I've been standing here for... a long time. I'm cold. This is entirely my fault.`),
      ]),
      say('vera', 'neutral', `Last night I played the whole piece. Twenty-two bars. Past the wall. Past the sticky key. To the end. For Biscuit. He left at bar nineteen, but still. It counts.`),
      say('vera', 'shy', `I didn't stop. I thought I would. I thought of you. In the doorway. Not saying "beautiful." And I thought: okay. One more.`),
      say('vera', 'neutral', `I'm bad at this. I'm good at being sarcastic. It's a talent. It's also a wall. A different wall. I've been walking into that one for years.`),
      say('vera', 'shy', `So. No jokes. No deadpan. This is the real one, like the sixteenth bar. Theo. I like you. A lot. More than the roof. More than... okay, the same as Biscuit.`),
      say('vera', 'shy', `Would you... be my boyfriend? Or whatever the roof word is. I'll say it again if you don't hear it. I'm not good at saying it once.`),
      choice([
        opt(`"Yes. I heard it the first time."`, [
          sfx('heart_big'), emote('vera', 'heart'),
          say('vera', 'happy', `...Oh.`),
          say('vera', 'shy', `Okay. Okay. That's a yes. That's the whole word. I don't have another one. I'm going to need a bar's rest.`),
          romance('vera', 'dating'), friend('vera', 10), setFlag('vera_dating_since'), setFlag('vera_confessed_yes'),
          quest('vera_piano', 'update', `Vera played the whole piece, past the sixteenth bar, because of the quiet we share.`),
        ]),
        opt(`"Yes. Same as Biscuit."`, [
          sfx('heart_big'), emote('vera', 'heart'),
          say('vera', 'happy', `You... rank yourself with the cat. That's... high. That's the highest ranking I've got.`),
          romance('vera', 'dating'), friend('vera', 10), setFlag('vera_dating_since'), setFlag('vera_confessed_yes'),
          quest('vera_piano', 'update', `Vera played the whole piece, past the sixteenth bar, because of the quiet we share.`),
        ]),
        opt(`"I care. Not yet. Is that okay?"`, [
          say('vera', 'neutral', `...Yeah. Yeah. Okay.`),
          say('vera', 'sad', `That's... fine. It's a good no. A fair one. It's kind. It's a rest, not a stop.`),
          say('vera', 'neutral', `The roof's still here. So's the cat. So am I. Don't make it weird.`),
          friend('vera', 1), setFlag('vera_confess_notyet'),
        ]),
      ]),
      iff({ dating: 'vera' }, [
        say('vera', 'shy', `Can I... hold your sleeve? Not hand. Sleeve. Baby steps. I've got four. They're all small.`),
        narrate(`She takes hold of the cuff of my sleeve, two fingers, very gently, the way you'd touch a piano key that might be hot. Biscuit climbs onto our shoes and settles with the air of a landlord who has collected the rent.`),
        say('vera', 'happy', `...He approves. Obviously. I bought him off with tuna.`),
        moveTo('vera', 'bench', { wait: false }), moveTo('theo', 'center'),
      ]),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 09 promise
  ev({
    id: 'vera_09_promise', title: 'The Seventeenth Bar', priority: 62,
    trigger: { type: 'enterMap', map: 'school_rooftop', time: ['15:00', '21:30'] },
    when: { all: [{ dating: 'vera' }, { hearts: ['vera', '>=', 8] }, { year: 3 }, { season: 'winter' }, { day: [25, 28] }, { notSeen: 'vera_09_promise' }] },
    script: [
      fade('out', 400), place('theo', 'door', 'up'), place('vera', 'bench', 'left'), place('biscuit', 'cat_spot', 'down'), lighting('night'), music('rooftop'), fade('in', 500),
      narrate(`The last week of school. Snow on the water tank, a thin blanket of stars, and Vera on the bench with a small wooden music box in her lap. Her headphones are in her bag. Her hands are very still, in the good way.`),
      say('vera', 'neutral', `You're on time. I'm still not used to it. It's unsettling. Sit.`),
      iff({ flag: 'main_vote_saved' }, [
        say('vera', 'happy', `The school stays. Quill says the music room gets a real piano. A grand. He asked if I'd christen it. I said no. Then I said yes. In that order. It took one second.`),
      ], [
        say('vera', 'neutral', `The school's merging. Quill says the new building has a hall with a grand. He asked if I'd open it. I said no. Then I said, "I'll think about it." Which, for me, is a standing ovation.`),
      ]),
      say('vera', 'neutral', `I got an offer. A conservatory. A real one. They heard the recording. Mr. Quill sent it, behind my back.`),
      say('vera', 'neutral', `I'd be furious, but my back is apparently the most reliable person I know.`),
      say('vera', 'shy', `I'm going. I think. It's far. It's a hall with two thousand seats. I'm scared of it. I'm going anyway. That's the whole announcement.`),
      choice([
        opt(`"You'll play past bar sixteen. Every bar."`, [
          say('vera', 'happy', `That's the kind of sentence people stitch onto cushions. Don't do it again. Do it again.`),
          friend('vera', 8), setFlag('vera_promise_kind'),
        ]),
        opt(`"I'll be in the front row. Not breathing."`, [
          say('vera', 'sad', `...Don't be in the front row. My mother was in the front row. Be in the back. Where I can't see you. Where I'll know.`),
          friend('vera', 8), setFlag('vera_promise_honest'),
        ]),
        opt(`"I'll heckle. Politely. With licorice."`, [
          say('vera', 'happy', `Ha. Ha! Okay. That's... a policy. I'd accept licorice thrown on a stage. A small one. Soft.`),
          friend('vera', 8), setFlag('vera_promise_playful'),
        ]),
      ]),
      say('vera', 'shy', `Promise me one thing. Bell Night. When the bell rings, we're together. Not in the crowd. Up here. The bell can come to us.`),
      say('vera', 'shy', `And promise me: a whole song, one day. Start to end. For you. Wherever there's a piano. I'll play it, and you'll hear all of it.`),
      say('theo', 'happy', `I promise. Both.`),
      sfx('heart_big'), emote('vera', 'heart'),
      narrate(`She winds up the music box and sets it on the bench between us. A thin, silver, wobbling little tune climbs out, and stops on the sixteenth bar. She lets it.`),
      narrate(`Then she turns the key again and, quietly, picks the tune up herself, humming, and goes on to the seventeenth.`),
      say('vera', 'shy', `...There. That's the first song I ever finished for someone. You can say "beautiful" now. Once.`),
      say('theo', 'happy', `Beautiful.`),
      say('vera', 'happy', `Hm. Yeah. It was.`),
      quest('vera_piano', 'complete', `She plays past the wall now, for people. And for me.`),
      setFlag('vera_promise_made'),
      fade('in', 200),
    ],
  }),
];
