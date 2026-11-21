// Mr. Abel: history teacher, tells history like gossip, knows the bell's story. "And THEN...". Ends on cliffhangers.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['mr_abel', '>=', lo] });

export default {
  npc: 'mr_abel',
  talk: [
    t(20, { time: ['07:00', '12:00'] }, ['happy', `Hartley! Did you know the town founder once lost a duel to a goose? True! And THEN... well. Ask me tomorrow.`]),
    t(20, { time: ['12:00', '18:00'] }, ['smug', `Let me tell you about the harbor wall. Built in 1842. By a man named Horace. Who hated stone. And THEN...`]),
    t(20, { time: ['18:00', '25:00'] }, ['thinking', `Night. The best time for history. Ghosts are more talkative. Allegedly. I've never asked one directly.`]),
    t(21, { weekday: 'Mon' }, ['neutral', `Monday! In 1903, the town had a Monday that lasted four days. And THEN... the clock was fixed. Boring, I know.`]),
    t(21, { weekday: 'Fri' }, ['happy', `Friday! The perfect day for a cliffhanger. I leave you with one. Come back Monday. You will not forget.`]),
    t(22, { weather: 'rain' }, ['thinking', `Rain. The same sort of rain fell the night the clapper was removed. Coincidence? ...Probably. But dramatic!`]),
    t(22, { weather: 'storm' }, ['surprised', `A storm! In 1987 one split the oak in the courtyard. The janitor said it was a sign. The janitor says that about everything. And THEN...`]),
    t(23, { season: 'spring' }, ['happy', `Blossom Day! Founded in 1911 by a woman who hated paperwork and loved petals. And THEN, she was elected mayor!`]),
    t(23, { season: 'autumn' }, ['happy', `The Bell Festival! Once, there was a bell that rang for the harvest. And THEN, it didn't. A mystery!`]),
    t(23, { season: 'winter' }, ['thinking', `Bell Night. The old stories say: ring it with someone dear, and a wish comes true. History's best marketing.`]),
    t(24, { map: 'school_library' }, ['happy', `The archive section! Dusty, dim, delightful. I've found three secrets here. Two were recipes.`]),
    t(24, { map: 'town_hall' }, ['thinking', `Town Hall. The foundations are older than the school. And THEN... somebody built a gift shop. Tragic.`]),
    t(25, H(4), ['happy', `Hartley, you ask the right questions. That's the beginning of every good story. And of several bad ones.`]),
    t(26, { flag: 'main_bell_story_known' }, ['thinking', `You know the bell's tale now. Good. A story you carry is a story you protect. And THEN... you tell it.`]),
    t(27, { flag: 'main_archive_found' }, ['surprised', `The old letter! I've been looking for that for twenty years! I'm weeping. In a very scholarly way.`]),
    t(28, { flag: 'main_bell_restored' }, ['happy', `The bell is restored! History made, in my own classroom! And THEN... I'll need to rewrite the textbook. Delightful!`]),
    t(30, { festival: true }, ['happy', `Festival! A wonderful tradition! Founded by a man who sold me my first soup. And THEN...`]),
    t(1, null, ['happy', `Hartley! Listen. A tale: three brothers, one boat, and a very stubborn seagull. And THEN...`]),
    t(1, null, ['smug', `I heard a rumour. It was from 1873. I'll still tell you. It's fresher than most.`]),
  ],
  repeat: [
    t(1, null, ['neutral', `Another visit! I'll save the ending for tomorrow.`]),
    t(1, null, ['happy', `Wait, wait, I haven't told you the cliffhanger! ...I forgot it. Fascinating.`]),
    t(1, null, ['thinking', `And THEN... hm. I've lost it. Come back tomorrow.`]),
    t(5, H(6), ['shy', `You listen like a historian, Hartley. It's a compliment. Take it before I think better.`]),
  ],
  gift: {
    loves: ['textbook_history', 'tea_leaves', 'postcard_set'],
    likes: ['coffee', 'notebook', 'novel_mystery', 'cookie_box', 'paper_lantern', 'tea'],
    dislikes: ['soda', 'perfume', 'whoopee_cushion'],
    hates: ['black_licorice', 'energy_drink'],
    lines: {
      loves: [['surprised', `For me? A piece of the past, delivered to my desk! Hartley, you're a treasure! And THEN... I'll cry.`], ['happy', `Marvellous! I'll tell everyone about this! In great, tedious detail!`]],
      likes: [['happy', `A fine gift! History thanks you! And so do I!`], ['smug', `Thoughtful, Hartley! Very thoughtful. A footnote in your favour.`]],
      neutral: [['neutral', `Thank you! I'll find a spot for it among the clutter. It'll be at home.`], ['happy', `A gift! How lovely! And THEN... I'll use it!`]],
      dislikes: [['neutral', `Hm. Not quite my cup of tea. But history is full of misfires. This one's yours.`], ['sad', `I'll... file it. Somewhere. Probably with the failed inventions.`]],
      hates: [['angry', `Hartley! An offence to the archive! Remove it!`], ['surprised', `Bleh! That belongs in the Museum of Regrettable Decisions!`]],
      birthday: [['surprised', `You remembered! In 1904 the town forgot a birthday and there was a scandal. And THEN... thank you!`], ['happy', `Best birthday! I'm adding it to the archive. Under "Good Students, Rare."`]],
    },
  },
};
