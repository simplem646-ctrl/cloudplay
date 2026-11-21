export default {
  npc: 'theo',
  intro: [
    { meet: 'theo' },
    { say: 'theo', text: "Hi! You're {player}! I'm Theo, the postman! I'm late! Sorry! Not sorry! I'm always late!", expr: 'happy' },
    { say: 'theo', text: "I live above the store. My uncle Barnaby owns it. He's very loud. You'll hear him. Everywhere.", expr: 'laugh' },
    { say: 'theo', text: 'If you ever need a job, I need a parcel runner! One to five parcels a run. It pays well!', expr: 'happy' },
    { ask: [
      { text: 'Tell me the town gossip.', then: [{ say: 'theo', text: "Oh, where to start! Okay: Hattie knows everything. I know the rest. That's it. That's the gossip!", expr: 'laugh' }] },
      { text: 'Sounds busy.', then: [{ say: 'theo', text: "It is! Look at me! I'm running while standing still!", expr: 'surprised' }] },
    ] },
    { say: 'theo', text: 'Come by the post counter any afternoon. I mean, whenever I get there!', expr: 'happy' },
  ],
  talk: [
    { id: 'theo_default_1', weight: 1, lines: [
      ["Hey! Can't talk, late, but I'll talk anyway! Did you hear? No? I'll tell you later!", 'happy'],
      ["Parcels, letters, parcels, letters, I dream of parcels. Don't ask what they do in my dreams!", 'laugh'],
    ] },
    { id: 'theo_default_2', weight: 1, lines: [
      ["I'm the fastest postman in Lanternbrook! Also the only postman. But still!", 'smug'],
      ['Oh! Guess what I heard! Actually, never mind. I forgot. Hi!', 'surprised'],
    ] },
    { id: 'theo_spring', weight: 2, when: { season: 'spring' }, lines: [
      ['Spring mail is SO colourful! Seed catalogues, flower orders, love letters. Don\'t tell anyone I read them.', 'laugh'],
    ] },
    { id: 'theo_summer', weight: 2, when: { season: 'summer' }, lines: [
      ['Summer is sticky and sweaty and sandy! I love it! I also hate it! Mostly love!', 'happy'],
    ] },
    { id: 'theo_autumn', weight: 2, when: { season: 'autumn' }, lines: [
      ['Leaves on the road, bags on my back. I run faster to stay warm. Also to avoid squirrels.', 'laugh'],
    ] },
    { id: 'theo_winter', weight: 2, when: { season: 'winter' }, lines: [
      ['Brrr! My nose is a snowball! I wear two scarves and goggles. Do I look cool? Be honest. Do not be honest.', 'laugh'],
    ] },
    { id: 'theo_rain', weight: 3, when: { weather: ['rain', 'storm'] }, lines: [
      ["Rain! The post is soggy. The postman is soggy. I am a puddle with legs!", 'laugh'],
    ] },
    { id: 'theo_sunday', weight: 2, when: { weekday: 'sun' }, lines: [
      ["It's Sunday! No post! I get to be lazy! I'll probably run around the park anyway.", 'happy'],
    ] },
    { id: 'theo_evening', weight: 2, when: { time: { from: '18:00', to: '24:00' } }, lines: [
      ["Phew! Day's done! Off to the inn! Want to come? Nana Fen's stew is amazing. Just don't tell her I said that.", 'happy'],
    ] },
    { id: 'theo_friend', weight: 3, when: { hearts: { npc: 'theo', gte: 3 } }, lines: [
      ["You're my best friend in this town, {player}. Don't tell my uncle. He thinks it's him.", 'laugh'],
      ['I saved you the first read of the town newspaper. Okay, the second. Okay, I read it on my way here.', 'laugh'],
    ] },
    { id: 'theo_close', weight: 3, when: { hearts: { npc: 'theo', gte: 6 } }, lines: [
      ["I'm late for everything, except you. Isn't that odd? I'm always on time for you!", 'happy'],
    ] },
  ],
  gifts: {
    love: [
      ['Wow! For me?! You are the best friend EVER! I might cry! I might run! I might do both!', 'happy'],
      ["That's amazing, {player}! I love it! I'm putting it in my satchel right now!", 'laugh'],
    ],
    like: [
      ['Hey, great! Thanks, pal!', 'happy'],
      ["Oh, that's brilliant! I'll use it. Right now. Maybe tomorrow. Soon!", 'laugh'],
    ],
    neutral: [
      ['Aw, thanks! That\'s nice of you!', 'happy'],
      ["Thanks, {player}! I'll... find something to do with it!", 'happy'],
    ],
    dislike: [
      ["Uh... thanks? I'm sure it's lovely to someone!", 'worried'],
      ["Um. It's... interesting. Is it supposed to smell like that?", 'worried'],
    ],
    hate: [
      ['Eww! What is that? Get it away! It has legs! It might have legs!', 'surprised'],
      ["I can't, I just can't. Sorry, pal!", 'sad'],
    ],
    birthday: [
      ["You remembered my birthday! Best friend EVER! I'm late to my own party, but you're early!", 'happy'],
      ["Wow, a birthday present! This is the best day ever! Okay, it's tied with the day I got goggles!", 'laugh'],
    ],
    again: [
      ["Whoa, more?! You'll spoil me! Which is great! But stop! Or don't! Stop!", 'laugh'],
      ["I can't take any more today, pal! My satchel's full! Of gifts and parcels and a sandwich!", 'laugh'],
    ],
  },
};
