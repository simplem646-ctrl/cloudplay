// NOTE: talk entries may carry an optional `after` script (runs after the lines) so the flower stall can be opened from conversation.
const SHOP_ASK = [
  { ask: [
    { text: 'Show me your flowers.', then: [{ shop: 'flower_stall' }] },
    { text: 'Just saying hello.', then: [{ say: 'hattie', text: 'Always welcome, dear! Come back when your hands are empty.', expr: 'happy' }] },
  ], speaker: 'hattie' },
];

export default {
  npc: 'hattie',
  intro: [
    { meet: 'hattie' },
    { say: 'hattie', text: "Well hello, dear! You must be {player}! I've heard so much about you. Mostly from me!", expr: 'happy' },
    { say: 'hattie', text: "I'm Hattie Brook. I sell flowers right here in the square. And I know everyone's business.", expr: 'smug' },
    { say: 'hattie', text: 'Mira blushes when you walk by, did you know? Oh, I did not say that. Forget it!', expr: 'laugh' },
    ...SHOP_ASK,
  ],
  talk: [
    { id: 'hat_default_1', weight: 1, lines: ["Have you heard? No? Oh, I am so glad. I'll tell you. Wait, no. I won't. Yes, I will."], after: SHOP_ASK },
    { id: 'hat_default_2', weight: 1, lines: ['A flower a day keeps the grumps away! Take one. Well, buy one. Take one and buy one!'], after: SHOP_ASK },
    { id: 'hat_spring', weight: 2, when: { season: 'spring' }, lines: ['Tulips, lilies and daisies! My stall looks like a rainbow got dropped on it!'], after: SHOP_ASK },
    { id: 'hat_summer', weight: 2, when: { season: 'summer' }, lines: ["Sunflowers, lavender and marigolds, all fresh! It's like a hot day wrapped in paper!"], after: SHOP_ASK },
    { id: 'hat_autumn', weight: 2, when: { season: 'autumn' }, lines: ['Autumn marigolds! Nobody believes me, but they smell like pumpkin pie. Smell one!'], after: SHOP_ASK },
    { id: 'hat_winter', weight: 2, when: { season: 'winter' }, lines: ['Not many flowers in winter, dear. But a brave snowdrop is worth ten summer roses!'], after: SHOP_ASK },
    { id: 'hat_rain', weight: 3, when: { weather: ['rain', 'storm'] }, lines: ["My stall's soggy, my flowers are happy and my hair is a disaster. Lovely rain!"], after: SHOP_ASK },
    { id: 'hat_gossip', weight: 2, when: { time: { from: '12:00', to: '15:00' } }, lines: ['You did not hear this from me, but Rosalind has been practising a new recipe in secret. Hush!'], after: SHOP_ASK },
    { id: 'hat_friend', weight: 3, when: { hearts: { npc: 'hattie', gte: 3 } }, lines: ["You're my favourite customer, {player}. I'd say you're a good listener, but you never tell me anything."], after: SHOP_ASK },
  ],
  gifts: {
    love: ["Oh my stars! I love it! You're going to be the talk of the town! Because I'll talk about it!", 'Wonderful! Simply wonderful! I shall wear it, display it, and tell everyone.'],
    like: ['How sweet of you, dear! Thank you!', 'Lovely! Just lovely!'],
    neutral: ['Oh, thank you, dear! Very kind!', 'Aw, for me? Thank you!'],
    dislike: ["Oh... how, er, unusual. Thank you, dear.", "Well, it's a gift. I'll say it was the thought."],
    hate: ['Oh dear me! What is that?! Take it away!', "Dear, I can't. I simply can't. Not even for gossip."],
    birthday: ["My birthday! You remembered! I'll tell everybody you did! I'll tell them twice!", "Oh, you darling! The best birthday present, truly!"],
    again: ["Dear, you've already given me so much today! My heart's full!", "That's enough, you generous thing! Save some for tomorrow!"],
  },
  shop: { greet: ['Fresh flowers, picked this morning!', 'Take a look, dear! Smell everything!', 'A flower for you, a smile for me!'] },
};
