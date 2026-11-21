// Clara Voss (S3), part 2: confession and Bell Night promise. (_05_crisis, _07_date, _08_climax, _10_farewell are not written at this scope.)

import {
  say, narrate, think, choice, opt, iff, warp, place, moveTo, face, pose, emote, cam, fade,
  lighting, sfx, music, setFlag, friend, quest, romance,
} from '../../sim/script_dsl.js';

const ev = (o) => ({ kind: 'romance', priority: 60, repeat: 'once', skippable: true, ...o });

export default [
  // ------------------------------------------------------------------------------------------------ 06 confession
  ev({
    id: 'clara_06_confession', title: 'The Agenda Item', priority: 65, repeat: 'daily',
    trigger: { type: 'enterMap', map: 'school_rooftop', time: ['16:30', '19:30'] },
    when: {
      all: [
        { hearts: ['clara', '>=', 6] }, { seen: 'clara_03_secret' }, { partner: null }, { noFlag: 'clara_dating_since' },
        { any: [{ noFlag: 'clara_confess_notyet' }, { hearts: ['clara', '>=', 8] }] },
        { any: [{ year: [2, 3] }, { all: [{ year: 1 }, { season: 'winter' }, { day: [14, 28] }] }] },
      ],
    },
    script: [
      fade('out', 300), place('theo', 'door', 'up'), place('clara', 'fence_a', 'up'), lighting('sunset'), music('romantic'), fade('in', 500),
      narrate(`The roof at dusk. The sea is the colour of the inside of a shell. Clara stands at the fence with a folded sheet of paper, as if she is about to present the minutes.`),
      iff({ flag: 'clara_confess_notyet' }, [
        say('clara', 'shy', `You returned. I revised the document. It is shorter. It is, regrettably, no less terrifying.`),
      ], [
        say('clara', 'neutral', `Theo. Sit. No, stand. No. Whichever you prefer. I have prepared remarks. They are on this paper. I find I am not reading them.`),
      ]),
      say('clara', 'neutral', `I told Mother about the stars. Last Sunday. In the kitchen. I used a diagram.`),
      say('clara', 'shy', `She said, "I know. Mr. Tran's boy writes to the board every term about the dome." I was... a long time at the sink.`),
      say('clara', 'neutral', `She did not forbid it. She asked for a copy of the map. I do not know what that means. I think it is the nicest thing she has ever said.`),
      say('clara', 'shy', `I mention it because you are the reason I said anything. I have been ranked first for nine years. You are the first person I wished to tell.`),
      say('clara', 'shy', `Item one: I admire you. Item two: I would like you to stand beside me, and not behind, and not ahead. Item three: I have no item three. That is the whole agenda.`),
      say('clara', 'shy', `Theo Hartley. Would you, if you are able to... be my boyfriend. I am aware that I have worded it like a motion.`),
      choice([
        opt(`"Motion carried. Unanimously."`, [
          sfx('heart_big'), emote('clara', 'heart'),
          say('clara', 'happy', `...Carried. Unanimously. I believe that is the first time I have won an election by a margin of one, and been happy about it.`),
          romance('clara', 'dating'), friend('clara', 10), setFlag('clara_dating_since'), setFlag('clara_confessed_yes'),
          quest('clara_stars', 'update', `Clara told her mother about the stars. We stand under them together now.`),
        ]),
        opt(`"Yes. You did not need a diagram."`, [
          sfx('heart_big'), emote('clara', 'heart'),
          say('clara', 'happy', `Oh, thank goodness. I drew one anyway. It is a Venn diagram. The overlap is quite generous.`),
          romance('clara', 'dating'), friend('clara', 10), setFlag('clara_dating_since'), setFlag('clara_confessed_yes'),
          quest('clara_stars', 'update', `Clara told her mother about the stars. We stand under them together now.`),
        ]),
        opt(`"I care about you. Not yet. Is that okay?"`, [
          say('clara', 'sad', `...Ah.`),
          say('clara', 'neutral', `Thank you for the honest answer. I prefer an honest "not yet" to a polite "yes". It is a matter of principle.`),
          say('clara', 'shy', `The motion is tabled, not defeated. I shall keep my chair. And your seat.`),
          friend('clara', 1), setFlag('clara_confess_notyet'),
        ]),
      ]),
      iff({ dating: 'clara' }, [
        say('clara', 'shy', `May I... take your hand? I should like to try it. I have an apprehension that it will be indecently warm.`),
        narrate(`Her hand is cold from the fence and then it is not. We watch the first star arrive, punctual as ever.`),
        say('clara', 'happy', `Vega. Of course. Always first. We have something in common.`),
        moveTo('clara', 'bench', { wait: false }), moveTo('theo', 'center'),
      ]),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 09 promise
  ev({
    id: 'clara_09_promise', title: 'Four Hundred and Thirteen', priority: 62,
    trigger: { type: 'enterMap', map: 'town_harbor', time: ['17:00', '21:30'] },
    when: { all: [{ dating: 'clara' }, { hearts: ['clara', '>=', 8] }, { year: 3 }, { season: 'winter' }, { day: [25, 28] }, { notSeen: 'clara_09_promise' }] },
    script: [
      fade('out', 400), place('theo', 'lantern_row', 'up'), place('clara', 'lighthouse_view', 'left'), lighting('night'), music('romantic'), fade('in', 500),
      narrate(`The harbor in the last week of the school year. Frost on the boats. A long beam sweeps over the water and, every eleven seconds, finds Clara's coat.`),
      say('clara', 'neutral', `You are on time. I knew you would be. I have been early for forty minutes. I counted the beam. It is eleven seconds.`),
      iff({ flag: 'main_vote_saved' }, [
        say('clara', 'happy', `The school stands. Mother signed the motion herself. In front of the board. She said, "Voss is a name that holds, not a name that refuses." I have it on a napkin.`),
      ], [
        say('clara', 'sad', `The school will merge. Mother signed the motion, and she looked at me when she did. She said, "It was a good fight, Clara." I have never heard her say that to anyone.`),
      ]),
      say('clara', 'neutral', `I have an offer from the university. Astronomy and physics. It is far away, and the dome there is the size of a cathedral.`),
      say('clara', 'shy', `I shall take it. Nobody has told me to. That is the entire point. It is the first decision I have made without checking it against a rank.`),
      choice([
        opt(`"Of course you are going. Look at you."`, [
          say('clara', 'happy', `That is not an answer. That is an accurate observation, and I accept it as a contribution.`),
          friend('clara', 8), setFlag('clara_promise_kind'),
        ]),
        opt(`"I will miss you. I will write every week."`, [
          say('clara', 'shy', `Every week. In ink. On paper. I shall file them in order. It is a perfectly dreadful amount of romance, and I mean it.`),
          friend('clara', 8), setFlag('clara_promise_honest'),
        ]),
        opt(`"I will visit. You will correct my grammar."`, [
          say('clara', 'happy', `Weekly. In red. With footnotes. It is the most affectionate thing I know how to do.`),
          friend('clara', 8), setFlag('clara_promise_playful'),
        ]),
      ]),
      say('clara', 'neutral', `Last night, I finished the count. Four hundred and thirteen. I found one I had not seen. It is small. It is just beside Vega. I have decided it is ours.`),
      say('clara', 'shy', `Promise me this: on Bell Night, when the bell rings, we will stand together. Not on a stage, not at a podium. At the back, in the cold, looking up.`),
      say('theo', 'happy', `I promise. Four hundred and thirteen.`),
      sfx('heart_big'), emote('clara', 'heart'),
      narrate(`Clara steps in, and rests her forehead against my shoulder for the length of one sweep of the light. Eleven seconds. Then she straightens, perfect, and slightly pink.`),
      say('clara', 'shy', `That was not on the agenda. I shall be adding it retroactively.`),
      quest('clara_stars', 'complete', `She finished the count. Four hundred and thirteen stars, one of them ours.`),
      setFlag('clara_promise_made'),
      fade('in', 200),
    ],
  }),
];
