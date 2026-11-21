// NOTE: talk entries may carry an optional `after` script (runs after the lines) so the peddler stall can be opened from conversation.
const SHOP_ASK = [
  { ask: [
    { text: 'What do you have for sale?', then: [{ shop: 'peddler' }] },
    { text: 'Just chatting.', then: [{ say: 'sable', text: "Chat's free. The good stuff is not. See you soon.", expr: 'happy' }] },
  ], speaker: 'sable' },
];

export default {
  npc: 'sable',
  intro: [
    { meet: 'sable' },
    { say: 'sable', text: "Well, well. A fresh face. Sable Quinn, peddler of rare things and teller of better tales.", expr: 'happy' },
    { say: 'sable', text: "I'm only here on Saturdays and Sundays. After that, the road calls. It has a lovely voice.", expr: 'smug' },
    { say: 'sable', text: 'Ask me about my birthday and I will tell you: nobody knows. It makes me very mysterious.', expr: 'laugh' },
    ...SHOP_ASK,
  ],
  talk: [
    { id: 'sab_default_1', weight: 1, lines: ["Ah, {player}. I've picked up something special, just for people who ask nicely."], after: SHOP_ASK },
    { id: 'sab_default_2', weight: 1, lines: ["I once traded a boot for a map, a map for a boat and a boat for a boot. I came out ahead."], after: SHOP_ASK },
    { id: 'sab_spring', weight: 2, when: { season: 'spring' }, lines: ['Spring stock is a little greener. Moonstones for lovers, jade for luck.'], after: SHOP_ASK },
    { id: 'sab_summer', weight: 2, when: { season: 'summer' }, lines: ["Summer! The roads are dusty, the stalls are sunny and the amber is warm to touch."], after: SHOP_ASK },
    { id: 'sab_autumn', weight: 2, when: { season: 'autumn' }, lines: ['Autumn rubies and golden amber. Good for gifts, if you know whom to give them.'], after: SHOP_ASK },
    { id: 'sab_winter', weight: 2, when: { season: 'winter' }, lines: ["Winter on the road is cold. But what a view! Come see my winter treasures. Don't dawdle."], after: SHOP_ASK },
    { id: 'sab_rain', weight: 3, when: { weather: ['rain', 'storm'] }, lines: ["The rain keeps most people home. It's good for stories, though. Sit, I'll tell you one."], after: SHOP_ASK },
    { id: 'sab_sat', weight: 2, when: { weekday: 'sat' }, lines: ["Saturday in the square. It's busy, but I like busy. Busy buys things."], after: SHOP_ASK },
    { id: 'sab_sun', weight: 2, when: { weekday: 'sun' }, lines: ['Sunday in the park. Quiet, shady and the ducks watch me count my coins. Rude, but charming.'], after: SHOP_ASK },
    { id: 'sab_friend', weight: 3, when: { hearts: { npc: 'sable', gte: 3 } }, lines: ["You're a good customer, {player}. Better than that: you listen. That's rare on the road."], after: SHOP_ASK },
  ],
  gifts: {
    love: ["Oh my! That's a lovely thing. I'll keep it on the road with me, and think of you.", "That's quite a find, {player}! You've an eye for it. I may have to hire you."],
    like: ['Thank you! Always welcome. A peddler never turns down a nice thing.', 'Ah, nice. I will find a good place for it in my pack.'],
    neutral: ["Thank you, friend. It's the thought that counts.", 'Kind of you! I will find a use for it.'],
    dislike: ["Hm. Not quite my style. But thanks, I'll pass it on.", "Not for me. But I know someone who'd like it. I always do."],
    hate: ["Oh, no. I can't carry that. Not even for free.", 'That is going straight into the ditch, with respect.'],
    birthday: ["It's a birthday I'm not supposed to have. But I'll take the present. Thank you.", "A gift on no birthday at all? You're a mystery, {player}. I like it."],
    again: ["No more, friend. My pack is full of kindness, and there's no room for stock.", "That's plenty, {player}. I'll owe you a story."],
  },
  shop: { greet: ['Rare things from far places!', 'Have a look. Touch only what you intend to buy.', "I'm only here for the weekend, so choose quick."] },
};
