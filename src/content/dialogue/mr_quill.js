// Mr. Quill: gentle, absent-minded art and music teacher. Dreamy, loses his train of thought. Praise is rare and means everything.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['mr_quill', '>=', lo] });

export default {
  npc: 'mr_quill',
  talk: [
    t(20, { time: ['07:00', '12:00'] }, ['thinking', `Oh. Theo. Good morning. I was just... what was I... there was a colour. A blue. Never mind.`]),
    t(20, { time: ['12:00', '18:00'] }, ['neutral', `The light in the studio is lovely at this hour. It makes the dust look like it's thinking.`]),
    t(20, { time: ['18:00', '25:00'] }, ['thinking', `Late. The music room is quietest now. Even the piano sounds like it's holding its breath.`]),
    t(21, { weekday: ['Sat', 'Sun'] }, ['happy', `A weekend. I'll paint something. Or I'll stare at the wall until it paints itself. Both are valid.`]),
    t(22, { weather: 'rain' }, ['happy', `Rain. Every drop is a tiny note. If you listen closely, it's a very long, very sad... where was I?`]),
    t(22, { weather: 'snow' }, ['happy', `Snow. The world is a blank canvas. It lasts about an hour. I treasure every minute.`]),
    t(22, { weather: 'sunny' }, ['happy', `Such a bright day. It makes the whole studio hum. Do you hear it? A kind of... yellow.`]),
    t(23, { season: 'spring' }, ['happy', `Spring. Pinks and greens, and one very confused sparrow. I painted it. It's still thinking.`]),
    t(23, { season: 'autumn' }, ['thinking', `Autumn is all ochre and amber. I'm out of amber. Do you have amber? No? Fascinating.`]),
    t(23, { season: 'winter' }, ['neutral', `Winter. All grey, and one red scarf. That's a whole painting, you know.`]),
    t(24, { map: 'school_hall_2f' }, ['thinking', `The second floor. I've walked up and down this corridor... I forgot why I came. It's a lovely corridor, though.`]),
    t(25, { any: [{ club: 'art' }, { club: 'music' }] }, ['happy', `You're in my club. Welcome. ...I think. Did I say welcome? I'll say it again. Welcome.`]),
    t(25, H(4), ['happy', `Theo. Your work has a quiet confidence. I don't say that often. I may have said it once. In 1998.`]),
    t(27, { flag: 'main_bell_restored' }, ['shy', `The bell. I heard it. It was the right note. I've been waiting for that note for years. ...I forgot what I was saying.`]),
    t(26, { flag: 'main_committee_joined' }, ['thinking', `You joined the committee. Good. A bell is only a sculpture until someone strikes it. I think that's a line from somewhere.`]),
    t(30, { festival: true }, ['happy', `A festival. Banners, music, and one wobbly easel. I'm very proud of the easel. I forget why.`]),
    t(1, null, ['thinking', `Hm? Oh, Theo. I was... I had a thought. It left. Stay a while; it may return.`]),
    t(1, null, ['neutral', `Do you hear that? No? It's the sound of a new colour forming. Quite rare.`]),
    t(1, null, ['happy', `A good day for a brush. Or a note. Or a nap. Art is mostly nap, I find.`]),
  ],
  repeat: [
    t(1, null, ['thinking', `Oh. You again. Hello. ...Hello. Did I say hello?`]),
    t(1, null, ['neutral', `I'm in the middle of... something. It was blue. Come back later.`]),
    t(1, null, ['happy', `Another visit. Good. A quiet pleasure.`]),
    t(5, H(6), ['shy', `You remind me of why I started. Don't tell anyone. I'll forget I said it anyway.`]),
  ],
  gift: {
    loves: ['paint_set', 'sketchbook', 'music_box', 'headphones'],
    likes: ['tea', 'tea_leaves', 'textbook_art', 'daisy_white', 'cookie', 'postcard_set'],
    dislikes: ['soda', 'whoopee_cushion', 'energy_drink'],
    hates: ['black_licorice', 'pep_tonic'],
    lines: {
      loves: [['surprised', `For me? Oh. ...Oh. A paint set. I've been thinking about that exact shade. Thank you, Theo. Truly.`], ['shy', `You're kind. I shall treasure it. I'll... where will I put it? Right. On the shelf. Thank you.`]],
      likes: [['happy', `Lovely. It brightens the room. And my afternoon.`], ['happy', `Thank you. That was thoughtful. I'll remember. Probably.`]],
      neutral: [['neutral', `Oh, a gift. Thank you. I'll find a spot for it. Next to the ones I've already forgotten.`], ['happy', `How kind. I'll... think of a use.`]],
      dislikes: [['neutral', `Hm. It's not quite... my colour. But thank you. I'll find a corner.`], ['sad', `Oh. I'll put it away. Somewhere gentle.`]],
      hates: [['sad', `Oh dear. I'm afraid I can't. It's the wrong... everything. I'm sorry.`], ['surprised', `Oh! That's... quite loud. Please take it away. Gently.`]],
      birthday: [['surprised', `Oh. My birthday? You remembered. ...I forgot. Thank you. Truly.`], ['shy', `A gift on my birthday. It's the loveliest note I've heard all year.`]],
    },
  },
};
