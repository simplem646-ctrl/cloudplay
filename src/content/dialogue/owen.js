// Owen Tran: monotone, literal, precise numbers, "statistically". Gadgets, Astronomy Club, Bell notes.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['owen', '>=', lo] });
const low = { hearts: ['owen', '<', 4] };
const mid = { all: [H(4), { hearts: ['owen', '<', 8] }] };

export default {
  npc: 'owen',
  talk: [
    t(20, low, ['neutral', `Hartley. You are standing in my light. Statistically that is rude. Not blame. Just data.`]),
    t(20, low, ['neutral', `I have four gadgets in this bag. Three work. The fourth is a lesson.`]),
    t(20, low, ['thinking', `Do you know how many stars you can see unaided? About 2,500. I counted 2,486 last night. Clouds.`]),
    t(21, mid, ['happy', `Hartley. I built a thing. It is a slightly better thing than last week. Statistically, I'm improving.`]),
    t(21, mid, ['neutral', `You are the third person this month to ask me a good question. First was Dr. Fennel. Second was the cat.`]),
    t(21, mid, ['smug', `I measured how often you say "huh." It is 7.3 per day. A rise. I find that wholesome.`]),
    t(24, H(8), ['shy', `I do not have many friends. Quality over quantity. The quantity is three. The quality is high.`]),
    t(24, H(8), ['neutral', `My notes on the bell are 41 pages. Page 41 just says "wow." It is my most scientific page.`]),
    t(24, H(8), ['happy', `If the bell rings, I will not cry. I will merely leak. Statistically, it happens.`]),
    t(26, { weather: 'sunny' }, ['happy', `Clear sky! Sunspots visible. Four groups. Come to the roof. Bring a snack. Not for me. For Biscuit.`]),
    t(26, { weather: 'rain' }, ['neutral', `Rain. Cloud cover 100 percent. Star count: zero. Mood: documented, not enjoyed.`]),
    t(26, { weather: 'snow' }, ['surprised', `Snow! Six-sided crystals, every one unique. Statistically, nobody will notice. I will.`]),
    t(25, { season: 'summer' }, ['neutral', `Summer nights give the best Milky Way and the worst mosquitoes. I wear both as a badge.`]),
    t(25, { season: 'autumn' }, ['thinking', `Moon Viewing Night is on Autumn 20. I have calibrated three telescopes. Two will behave.`]),
    t(25, { season: 'winter' }, ['neutral', `Winter skies are sharpest. Also coldest. My glasses fog on contact. It is a known trade-off.`]),
    t(25, { season: 'spring' }, ['happy', `Spring. Longer days, shorter observing windows. I am complaining in the cheerful way.`]),
    t(26, { map: 'school_rooftop' }, ['neutral', `The best observing spot with a door that locks. And a cat who is, statistically, always right.`]),
    t(26, { map: 'school_library' }, ['thinking', `Quiet. Shelves. Roughly 12,000 books. I have read 391. Efficient, but not enough.`]),
    t(24, { time: ['20:00', '25:00'] }, ['neutral', `It is late. I am not tired. I am simply running at a very low brightness.`]),
    t(27, { flag: 'main_bell_story_known' }, ['thinking', `The bell last rang 31 years ago. I put the odds of it ringing again at 12 percent. I like those odds.`]),
    t(27, { flag: 'main_core_found' }, ['happy', `The core is real. It weighs 2.4 kilograms. I weighed it. Twice. It was a good day.`]),
    t(28, { flag: 'main_bell_restored' }, ['surprised', `It is fixed. I need a moment. ...I have had the moment. It was long. Now: wow.`]),
    t(30, { festival: true }, ['neutral', `Festival. One hundred percent more people. One hundred percent more noise. Data collection is challenging.`]),
    t(26, { year: 3 }, ['sad', `Final year. I'm making a list of things I will miss. It already has 62 items. Biscuit is item one.`]),
    t(1, null, ['neutral', `Hartley. Current mood: functional. Time: unknown. Did you need something?`]),
    t(1, null, ['neutral', `Statistically, you came here for a reason. I am curious which one.`]),
    t(1, null, ['happy', `Good timing. I have a new fact. It is mostly about stars. Do you want it?`]),
  ],
  repeat: [
    t(1, null, ['neutral', `You again. Observed frequency: twice today. Noted.`]),
    t(1, null, ['thinking', `I'm mid-calculation. If you speak, I will lose it. That's fine. It was probably wrong.`]),
    t(1, null, ['happy', `Hello again. I have not found anything new in the last hour. But I am still looking.`]),
    t(5, H(6), ['shy', `Two conversations in a day. That's a record. For me. For the day. For statistics.`]),
    t(4, { weather: 'rain' }, ['neutral', `Still cloudy. I'm not sad. I'm just visibly gray.`]),
  ],
  gift: {
    loves: ['star_chart', 'calculator', 'coffee_beans', 'paper_lantern'],
    likes: ['notebook', 'textbook_science', 'tea', 'flashcards', 'riceball', 'cookie_box'],
    dislikes: ['perfume', 'whoopee_cushion', 'bouquet'],
    hates: ['soda', 'pep_tonic'],
    lines: {
      loves: [['surprised', `This is an extremely good gift. I will log it as the best this month. And possibly the year.`], ['happy', `You observed what I like. Statistically unlikely. And yet. Thank you.`]],
      likes: [['happy', `Useful. Pleasant. Thank you. I will give it a top-five placement.`], ['neutral', `Good choice. I will put it where I can see it. Visibility is affection.`]],
      neutral: [['neutral', `Noted. I will file it under "kind things." It is a small folder, but growing.`], ['neutral', `I do not know what this does. I'll find out.`]],
      dislikes: [['neutral', `Hm. This is outside my parameters. But thank you for the data.`], ['sad', `I do not know where to put it. The thought is clearly valuable. The object is not.`]],
      hates: [['angry', `This is a statistical insult. Please remove it.`], ['sad', `I'm reasonably sure this is an attack. Unintentional. I'll note it as such.`]],
      birthday: [['surprised', `You know my birthday. I am processing. ...Processing complete. Thank you. This is good.`], ['shy', `Age: plus one. Friends: plus you. A net positive. Thank you, Theo.`]],
    },
  },
};
