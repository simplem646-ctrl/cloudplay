export default {
  npc: 'bramwell',
  intro: [
    { meet: 'bramwell' },
    { say: 'bramwell', text: "Hmph. You walk loud. Folk call me Moss. I live here. You're in my woods.", expr: 'neutral' },
    { say: 'bramwell', text: "They're everybody's woods, really. But I was here first. By about seventy years.", expr: 'laugh' },
    { say: 'bramwell', text: "You're in Tobias' cottage. Good man. He left me a lantern once. For the shrine. It still glows.", expr: 'happy' },
  ],
  talk: [
    { id: 'bra_default_1', weight: 1, lines: ["Quiet today. Good. Listen. That's a nuthatch. There, that's a wren. You'll learn."] },
    { id: 'bra_default_2', weight: 1, lines: ["Moss grows on the north side. Folks say so. Folks are right, mostly. Moss doesn't lie."] },
    { id: 'bra_spring', weight: 2, when: { season: 'spring' }, lines: ['Morels are up. Early, this year. Do not eat what you cannot name. I mean it.'] },
    { id: 'bra_summer', weight: 2, when: { season: 'summer' }, lines: ["Berries are ripe. The bees know. The bears know. You? You'll learn."] },
    { id: 'bra_autumn', weight: 2, when: { season: 'autumn' }, lines: ['Chanterelles, chestnuts and a lot of wet leaves. Good season. Wear a hat.'] },
    { id: 'bra_winter', weight: 2, when: { season: 'winter' }, lines: ['Frost mushrooms grow under the hollow log. Do not tell anyone. Fine, tell a few.'] },
    { id: 'bra_rain', weight: 3, when: { weather: ['rain', 'storm'] }, lines: ["Rain's good for the woods. Not for my knees. I'm staying in. You should too."] },
    { id: 'bra_tobias', weight: 3, when: { flag: 'journal_found' }, lines: ['He kept a list of everyone he helped. Funny man. Rather list than talk. Like me.'] },
    { id: 'bra_friend', weight: 3, when: { hearts: { npc: 'bramwell', gte: 3 } }, lines: ["You don't talk too much. That's rare. I like you, {player}. Don't make it weird."] },
  ],
  gifts: {
    love: ["Hmph. Well. That's... that's a good one. Thank you.", "Haven't had one of these in years. You're a decent sort."],
    like: ['That will do. Thanks.', 'Useful. Good.'],
    neutral: ['Hm. Thanks.', "I'll find a spot for it."],
    dislike: ["Not for me. But I'll pass it on.", "Hm. Don't need it. Don't want it. Thanks."],
    hate: ['Litter! In MY woods?! Take it away!', "No. Absolutely not. Get that out of here."],
    birthday: ["You remembered. Hmph. That's... well. Thank you.", "Haven't had a birthday present in thirty years. It's good. Don't tell anyone I said so."],
    again: ["That's plenty. Go on, off with you.", "No more. I'm not used to it."],
  },
};
