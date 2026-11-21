// Tomas: Corner Mart night clerk and university student. Yawning, flat, drops real wisdom between sighs. "Cash or card. Or a story."
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['tomas', '>=', lo] });

export default {
  npc: 'tomas',
  talk: [
    t(20, { time: ['20:00', '27:00'] }, ['neutral', `Cash or card. Or a story. ...Yawn. Stories are cheaper.`]),
    t(20, { time: ['06:00', '12:00'] }, ['neutral', `It's morning. I haven't been to bed. Congratulations to both of us on being upright.`]),
    t(21, { weather: 'rain' }, ['neutral', `Rain. Customers: zero. Puddles: infinite. I count both. It helps.`]),
    t(21, { weather: 'snow' }, ['happy', `Snow. The shop is a snow globe and I'm the tiny, tired figure inside.`]),
    t(22, { season: 'summer' }, ['neutral', `Summer. The freezer hums like a tired choir. I harmonize. Badly.`]),
    t(22, { season: 'winter' }, ['neutral', `Winter. The door chime sounds colder. I've noticed. I notice things. At 3 a.m., mostly.`]),
    t(22, { season: 'autumn' }, ['neutral', `Autumn. Exams. I study behind the counter. Customers help me revise. Without knowing.`]),
    t(24, { map: 'town_square' }, ['neutral', `Town square. Quiet. The fountain gurgles like it's tired too.`]),
    t(25, H(4), ['happy', `You're one of the good ones. Don't tell anyone. I've a reputation. Of being asleep.`]),
    t(1, null, ['neutral', `Yawn. Welcome to Corner Mart. Everything's in the aisles. Or in my head. Hm.`]),
    t(1, null, ['thinking', `A good night is a quiet night. A good life is a quiet night with a good book. Anyway.`]),
  ],
  repeat: [
    t(1, null, ['neutral', `Back again. Sigh. Welcome.`]),
    t(1, null, ['thinking', `I was dozing. Not really. Sort of. Fine.`]),
    t(1, null, ['neutral', `Cash or card. Or a story. I'll take the story.`]),
    t(5, H(6), ['shy', `You're all right. Don't repeat that. I'd have to feign sleep.`]),
  ],
  gift: {
    loves: ['coffee_beans', 'energy_drink', 'coffee', 'headphones'],
    likes: ['latte', 'sandwich', 'riceball', 'notebook', 'dark_chocolate', 'novel_mystery'],
    dislikes: ['perfume', 'plushie_bear', 'whoopee_cushion'],
    hates: ['black_licorice', 'pep_tonic'],
    lines: {
      loves: [['surprised', `For me? ...Wow. You're a saint. A saint with good taste. Thank you.`], ['happy', `This might save my week. Possibly my semester. Thanks, Theo.`]],
      likes: [['happy', `Nice. Thanks. I'll have this at 4 a.m. and think of you.`], ['neutral', `Not bad. Thanks.`]],
      neutral: [['neutral', `Thanks. I'll... put it somewhere. Behind the counter.`], ['neutral', `Cool. Yawn. Thanks.`]],
      dislikes: [['neutral', `Not for me. But thanks. I'll pretend.`], ['sad', `Hm. I'll leave it. Maybe someone else will love it.`]],
      hates: [['angry', `Nope. Absolutely not. Remove it.`], ['surprised', `Why. Just why.`]],
      birthday: [['surprised', `You know my birthday? ...Huh. Thanks. I'd forgotten. Too tired.`], ['shy', `A gift. On my birthday. Yawn. That's... nice. Really.`]],
    },
  },
};
