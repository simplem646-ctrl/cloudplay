// Mayor Greer: booming politician-cheer, "Wonderful, wonderful!". Loves a ribbon-cutting. Bad at hard news.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['mayor_greer', '>=', lo] });

export default {
  npc: 'mayor_greer',
  talk: [
    t(20, { time: ['07:00', '12:00'] }, ['happy', `Wonderful, wonderful! Good morning, young man! A fine day for a ribbon-cutting! Any ribbon! I'm not picky!`]),
    t(20, { time: ['12:00', '18:00'] }, ['happy', `Afternoon! A town runs on three things: tea, tradition, and tireless committees! I chair four of them!`]),
    t(20, { time: ['18:00', '24:00'] }, ['neutral', `Evening. The Town Hall's quiet now. The paperwork however... is sleeping with one eye open.`]),
    t(21, { weather: 'rain' }, ['happy', `Rain! Wonderful! For the harbor, for the crops, for the umbrella industry! A boom!`]),
    t(21, { weather: 'snow' }, ['surprised', `Snow! Marvellous! I'll declare a Snow Day! ...Do I have the authority? Hm. I'll check.`]),
    t(22, { season: 'spring' }, ['happy', `Blossom Day! The best day of the year! I'm cutting a ribbon, kissing a baby, and eating a sandwich. In that order!`]),
    t(22, { season: 'summer' }, ['happy', `Summer! Fireworks, beach, and a very sunburnt mayor! Wonderful, wonderful!`]),
    t(22, { season: 'autumn' }, ['happy', `The Bell Festival! A tradition, a triumph, a wonderful reason to wear a sash!`]),
    t(22, { season: 'winter' }, ['happy', `Winter! Lanterns, cocoa, and a speech. Short, I promise! Medium, I confess!`]),
    t(24, { map: 'town_hall' }, ['happy', `Welcome to Town Hall! Mind the carpet. It's older than I am. And twice as stubborn!`]),
    t(24, { map: 'town_square' }, ['happy', `The square! A plaza of dreams! And pigeons! I've named them all! Gertrude is the loud one!`]),
    t(25, H(4), ['happy', `Young Hartley! You are a credit to Bellhaven! I'd put it on a plaque! I have a plaque machine!`]),
    t(26, { flag: 'main_committee_joined' }, ['happy', `The Bell Committee! Wonderful! I've told everyone! Twice! The second time was louder!`]),
    t(26, { flag: 'main_bell_story_known' }, ['thinking', `The bell, hm. A touchy subject at the Town Hall. The paperwork alone would fill a boat.`]),
    t(28, { flag: 'main_bell_restored' }, ['surprised', `The bell! The BELL! Wonderful! I'm weeping! Into my sash! It's absorbent!`]),
    t(30, { festival: true }, ['happy', `A festival! My favourite thing! Excepting ribbons! Excepting speeches! Excepting festivals with ribbons and speeches!`]),
    t(1, null, ['happy', `Wonderful, wonderful! Young man, have you registered to vote? Not yet? Soon! Not too soon!`]),
    t(1, null, ['neutral', `A mayor's job is mostly smiling and occasionally signing. I'm very good at the first.`]),
    t(1, null, ['happy', `If you have a petition, I'll read it. If you have a complaint, I'll nod. If you have a cookie, I'll take it.`]),
  ],
  repeat: [
    t(1, null, ['happy', `Wonderful! You again! The town thrives on repeat visitors!`]),
    t(1, null, ['neutral', `Forgive me! I'm mid-speech. In my head. A very good one!`]),
    t(1, null, ['happy', `Take a flyer! They're free! I printed too many!`]),
    t(5, H(6), ['shy', `Between you and me, I worry about the town. Not aloud. Never aloud. Forget I spoke.`]),
  ],
  gift: {
    loves: ['cookie_box', 'coffee_beans', 'berry_tart', 'cake_slice'],
    likes: ['tea', 'coffee', 'sunflower', 'bouquet', 'postcard_set', 'paper_lantern'],
    dislikes: ['soda', 'energy_drink', 'whoopee_cushion'],
    hates: ['black_licorice', 'pep_tonic'],
    lines: {
      loves: [['surprised', `For me?! Wonderful, wonderful! A mayor's heart is easily won by pastry! Thank you, young man!`], ['happy', `I'll have it with the next speech! And possibly during!`]],
      likes: [['happy', `Wonderful! A fine gift! The town thanks you!`], ['happy', `Splendid! I'll take it to the office!`]],
      neutral: [['neutral', `Thank you, young man! I'll find a spot for it. The office is crowded, but it'll fit!`], ['happy', `How kind! A civic-minded gift!`]],
      dislikes: [['neutral', `Hm! Not quite for me! But I'll smile! I'm very good at smiling!`], ['sad', `Hm. I'll... file it. In the great filing cabinet of regret.`]],
      hates: [['surprised', `Oh my! No! Not at all! Take it away, please! Gently!`], ['angry', `That is, sir, an affront! To the dignity of the office!`]],
      birthday: [['surprised', `You remembered my birthday?! Wonderful! I'll have a speech ready! Don't worry, it's short!`], ['happy', `A gift on my birthday! The finest day of the year! Excepting all the others!`]],
    },
  },
};
