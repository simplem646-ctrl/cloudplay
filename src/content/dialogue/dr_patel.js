// Dr. Anika Patel: runs the town clinic. Calm, patient, dry humour. "You are not dying. You are tired."
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['dr_patel', '>=', lo] });

export default {
  npc: 'dr_patel',
  talk: [
    t(20, { time: ['08:00', '13:00'] }, ['neutral', `Good morning, Theo. You look well. Slightly sleepy. Mostly well. Breathe in. Breathe out. Done.`]),
    t(20, { time: ['13:00', '20:00'] }, ['neutral', `Afternoon clinic. Mostly coughs and curiosity. Occasionally a sprained ego.`]),
    t(21, { weather: 'rain' }, ['neutral', `Rain. Expect sniffles. I've put out tissues and a mild sense of disapproval.`]),
    t(21, { weather: 'snow' }, ['happy', `Snow. Slips, sprains, and the occasional snowball to the face. Wear gloves, not bravado.`]),
    t(22, { season: 'spring' }, ['neutral', `Spring. Pollen. The whole town sneezes in harmony. It's almost musical.`]),
    t(22, { season: 'summer' }, ['neutral', `Summer. Sunburn season. I wrote "wear a hat" on a prescription pad as a joke. People framed it.`]),
    t(22, { season: 'autumn' }, ['neutral', `Autumn. Colds arrive on schedule. So do flu shots. I'm a creature of routine.`]),
    t(22, { season: 'winter' }, ['neutral', `Winter. Warm soup, warm socks, warm blankets. That's the prescription. Pay at the door.`]),
    t(24, { map: 'town_square' }, ['neutral', `The square. A good place for a walk. Ten minutes a day keeps me out of a job. Not a joke. Mostly.`]),
    t(25, H(4), ['happy', `You take care of yourself more than you used to. A professional observation.`]),
    t(1, null, ['neutral', `You are not dying. You are tired. Sleep, water, and a vegetable. Repeat.`]),
    t(1, null, ['happy', `The best medicine is a good laugh and a long nap. I'm told the second is in short supply.`]),
  ],
  repeat: [
    t(1, null, ['neutral', `Another visit. Fine. Stick out your tongue. Joking. Mostly.`]),
    t(1, null, ['happy', `I've got five minutes. I'll spend two on you.`]),
    t(1, null, ['neutral', `If it hurts, tell me. If it does not, tell me anyway.`]),
    t(5, H(6), ['shy', `You're a pleasant patient. Do not let it go to your head.`]),
  ],
  gift: {
    loves: ['tea_leaves', 'vitamin_gummies', 'daisy_white', 'coffee_beans'],
    likes: ['tea', 'cookie_box', 'sunflower', 'notebook', 'veggie_soup', 'berry_tart'],
    dislikes: ['soda', 'energy_drink', 'whoopee_cushion'],
    hates: ['pep_tonic', 'black_licorice'],
    lines: {
      loves: [['surprised', `For me? Hm. That's thoughtful. A rare quality in a patient. Thank you.`], ['happy', `You pay attention. A good trait. A good gift. Thank you, Theo.`]],
      likes: [['happy', `Thank you. A sensible choice.`], ['neutral', `Good. I'll put it in my office. Where it'll be appreciated.`]],
      neutral: [['neutral', `Thank you, Theo. I'll find a use. Possibly medical.`], ['neutral', `Kind of you. Don't make a habit of it. Do.`]],
      dislikes: [['neutral', `Hm. Not for me. But thank you for the intent.`], ['sad', `I'll file it under "kind, but no."`]],
      hates: [['angry', `Theo. I'm a doctor. I can say with authority: no.`], ['surprised', `That is a health hazard. Remove it, please.`]],
      birthday: [['surprised', `You remembered. How... unexpected. Thank you.`], ['happy', `A gift on my birthday. The diagnosis: pleasantly surprised.`]],
    },
  },
};
