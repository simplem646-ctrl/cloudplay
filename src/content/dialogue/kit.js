// Kit Alvarez: eager first-year on the track team, calls Theo "Hartley-senpai". Clumsy, chatty. Year 2+.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['kit', '>=', lo] });

export default {
  npc: 'kit',
  talk: [
    t(20, { hearts: ['kit', '<', 4] }, ['surprised', `Hartley-senpai! Hi! Hello! Good morning! Or afternoon! I tripped on the stairs, don't look!`]),
    t(20, { hearts: ['kit', '<', 4] }, ['happy', `Senpai, I joined track! Captain Nina says I'm "enthusiastic." I think it's a compliment. Is it a compliment?`]),
    t(21, { all: [H(4), { hearts: ['kit', '<', 8] }] }, ['happy', `Senpai! I did a whole lap without stopping! Okay, one lap. Okay, half. Okay, I walked. Proudly!`]),
    t(21, { all: [H(4), { hearts: ['kit', '<', 8] }] }, ['shy', `I told my mom about you. She said, "that boy's a good influence." I said, "he is!" She said, "I meant the shoelaces."`]),
    t(24, H(8), ['shy', `Senpai, I used to think I wasn't good at anything. Now I'm good at one thing: following you. Is that bad?`]),
    t(24, H(8), ['happy', `When I'm third-year, I'm gonna do for some kid what you did for me. Same speech. Maybe shorter.`]),
    t(26, { weather: 'rain' }, ['happy', `Rain! I love puddles! Not the falling-in kind. Okay, a bit the falling-in kind!`]),
    t(26, { weather: 'snow' }, ['surprised', `Snow! Senpai! Look! It's on my nose! It's on EVERYTHING!`]),
    t(25, { season: 'summer' }, ['happy', `Summer! Track in the sun! My arms are going red, but in a good way! A very red way!`]),
    t(25, { season: 'autumn' }, ['happy', `Sports Festival! I'm in the relay! Don't tell the Captain I dropped the baton. Twice. Okay, three times.`]),
    t(25, { season: 'winter' }, ['neutral', `Winter. My nose runs faster than I do. It's a very athletic nose.`]),
    t(26, { map: 'school_field' }, ['happy', `Track! My favourite place! Also the place where I fell! Both!`]),
    t(26, { map: 'school_hall_1f' }, ['neutral', `First floor. I take the wrong staircase every day. I think it's a sign.`]),
    t(30, { festival: true }, ['happy', `Festival! Senpai, come see my booth! It's... a plan. It will be a booth.`]),
    t(1, null, ['happy', `Hartley-senpai! Do you have a minute? I have fourteen questions! Okay, two!`]),
    t(1, null, ['shy', `Senpai, did you know your name's on the board? ...Which one? I don't remember. Congrats anyway!`]),
  ],
  repeat: [
    t(1, null, ['surprised', `Senpai again! I'm having the best day!`]),
    t(1, null, ['happy', `Hartley-senpai, still no answer to question seven. I'll wait!`]),
    t(1, null, ['shy', `I practised saying "hello" like a normal person. How did it go?`]),
    t(5, H(6), ['happy', `Senpai, you came back! That's so cool! I wasn't waiting! ...I was waiting!`]),
  ],
  gift: {
    loves: ['sneakers', 'sports_drink', 'stopwatch'],
    likes: ['sweet_bun', 'ice_cream', 'water_bottle', 'cookie', 'soda', 'candy'],
    dislikes: ['perfume', 'novel_romance', 'tea_leaves'],
    hates: ['black_licorice', 'veggie_soup'],
    lines: {
      loves: [['surprised', `For ME?! Hartley-senpai, I'm gonna cry! No. I'm crying. Yes. Thank you!!`], ['happy', `This is the best day of my entire life! Of the week! Of the month!`]],
      likes: [['happy', `Thank you, senpai! I'll treasure it! And eat it. In that order. Or reverse!`], ['happy', `Awesome! You're the best!`]],
      neutral: [['neutral', `Oh! Thanks, senpai! I'll find a good use for it!`], ['happy', `Cool! I think!`]],
      dislikes: [['neutral', `Um. Thank you, senpai! It's... uh... very you!`], ['sad', `I don't know what to do with this, but I'll try!`]],
      hates: [['surprised', `Bleh! Senpai! Why?! My tongue's gone on strike!`], ['sad', `Did I do something? I'm sorry!`]],
      birthday: [['surprised', `Senpai remembered my birthday?! I'm... I'm... okay I'm crying again!`], ['happy', `Best birthday ever! I'm telling the whole track team!`]],
    },
  },
};
