// Biscuit: the rooftop cat. No spoken words, only narration of cat behaviour.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['biscuit', '>=', lo] });

export default {
  npc: 'biscuit',
  talk: [
    t(20, { hearts: ['biscuit', '<', 4] }, ['neutral', `(Biscuit watches you with half-closed eyes. You are being evaluated. Slowly.)`]),
    t(20, { hearts: ['biscuit', '<', 4] }, ['neutral', `(Meow.) (It means "snack?" It always means snack.)`]),
    t(21, { all: [H(4), { hearts: ['biscuit', '<', 8] }] }, ['happy', `(Biscuit rubs against your leg. Twice. That's a lot, from her.)`]),
    t(21, { all: [H(4), { hearts: ['biscuit', '<', 8] }] }, ['happy', `(Purrrr. The sound is like a very small, very smug engine.)`]),
    t(24, H(8), ['happy', `(Biscuit climbs into your lap without asking. She stays. You are now furniture.)`]),
    t(25, { weather: 'rain' }, ['neutral', `(Biscuit sits under the water tank, damp and unimpressed. She stares at the rain as if it owes her money.)`]),
    t(25, { weather: 'sunny' }, ['happy', `(Biscuit is a loaf in a sunbeam. You are not permitted to move her.)`]),
    t(25, { weather: 'snow' }, ['surprised', `(Biscuit pats a snowflake. It melts. She looks at you as if you're responsible.)`]),
    t(25, { season: 'winter' }, ['neutral', `(Biscuit has found a cardboard box near the vent. It is her castle. You are a guest.)`]),
    t(25, { season: 'summer' }, ['neutral', `(Biscuit lies on the warm concrete, belly up. A rare honour. Do not touch the belly.)`]),
    t(26, { map: 'school_rooftop' }, ['neutral', `(Biscuit's domain. She tolerates you, and sometimes the sun.)`]),
    t(26, { time: ['20:00', '27:00'] }, ['neutral', `(Biscuit's eyes glow in the dark. She's watching the stars. Or a moth. Same thing.)`]),
    t(1, null, ['neutral', `(Meow?)`]),
    t(1, null, ['happy', `(Biscuit blinks slowly at you. In cat language, that's a hug.)`]),
    t(1, null, ['neutral', `(She stretches, yawns, and turns her back. You've been dismissed.)`]),
  ],
  repeat: [
    t(1, null, ['neutral', `(Biscuit ignores you. Magnificently.)`]),
    t(1, null, ['happy', `(A single, lazy meow.)`]),
    t(1, null, ['neutral', `(Her tail flicks. That means "later.")`]),
    t(5, H(6), ['happy', `(Biscuit headbutts your hand. Gently. It's a compliment.)`]),
  ],
  gift: {
    loves: ['cat_treats', 'milk', 'bread'],
    likes: ['sandwich', 'riceball', 'sweet_bun', 'plushie_cat', 'cookie', 'cake_slice'],
    dislikes: ['perfume', 'soda', 'whoopee_cushion'],
    hates: ['black_licorice', 'pep_tonic'],
    lines: {
      loves: [['happy', `(Biscuit's purr could shake the rooftop. She devours it. Then stares at you. For more.)`], ['happy', `(She nudges your hand. Then your other hand. Then, your face. That's love.)`]],
      likes: [['happy', `(Biscuit sniffs, nibbles, approves. A slow blink follows.)`], ['happy', `(Meow. It's a "thank you." You think.)`]],
      neutral: [['neutral', `(She sniffs it. Looks at you. Walks away. But not far.)`], ['neutral', `(A polite tail twitch. Possibly gratitude.)`]],
      dislikes: [['neutral', `(Biscuit sniffs and recoils. She gives you a look of deep betrayal.)`], ['neutral', `(She turns her back on it. And a little on you.)`]],
      hates: [['angry', `(Hssss! Biscuit arches her back and retreats behind the water tank.)`], ['angry', `(A very loud MEOW. It translates, roughly, to "how dare you.")`]],
      birthday: [['happy', `(Biscuit purrs and kneads your sleeve. It's a good day. She'd never admit it.)`], ['happy', `(She curls up beside you. A birthday for the whole rooftop.)`]],
    },
  },
};
