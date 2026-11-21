// Mr. Finch: retired clock mender, last bell-keeper. Gruff, short sentences, tender heart. Feuds with a gull called the Admiral.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['mr_finch', '>=', lo] });

export default {
  npc: 'mr_finch',
  talk: [
    t(20, { hearts: ['mr_finch', '<', 4] }, ['neutral', `Hm. You. Don't scare the fish.`]),
    t(20, { hearts: ['mr_finch', '<', 4] }, ['neutral', `Tide's turning. Don't ask what that means. Just feel it.`]),
    t(20, { hearts: ['mr_finch', '<', 4] }, ['angry', `That gull's back. The Admiral. Stole my sandwich Tuesday. We're not speaking.`]),
    t(21, { all: [H(4), { hearts: ['mr_finch', '<', 8] }] }, ['neutral', `Sit. If you're quiet, you can stay. If you talk, you can still stay. Fewer fish, though.`]),
    t(21, { all: [H(4), { hearts: ['mr_finch', '<', 8] }] }, ['thinking', `A clock is a promise you wind every day. The bell was the biggest promise this town made.`]),
    t(24, H(8), ['shy', `...You turned up again. I suppose I should say something. Hm. Good. That's all.`]),
    t(24, H(8), ['thinking', `I kept that bell thirty years. Never asked for a thing. Then you came. Funny how that works.`]),
    t(26, { weather: 'rain' }, ['neutral', `Rain. Good for the harbor. Bad for my knees. The Admiral, however, is soaked. Small mercy.`]),
    t(26, { weather: 'storm' }, ['neutral', `Storm. Boats are in. Lights are lit. The old bell would've rung for this. Never mind.`]),
    t(26, { weather: 'snow' }, ['neutral', `Snow. Quiet. I like it. Everything's muffled except my knees.`]),
    t(25, { season: 'spring' }, ['neutral', `Spring. The gulls get ideas. Loud ones. Ignore them.`]),
    t(25, { season: 'summer' }, ['neutral', `Summer. Tourists. Ice cream. My bench is occupied. I'm moving to the next bench. It's worse.`]),
    t(25, { season: 'autumn' }, ['neutral', `Autumn. Fish bite better. Folks talk less. Both fine.`]),
    t(25, { season: 'winter' }, ['neutral', `Winter. Cold. Clear. The tower looks best against it. Not that I look.`]),
    t(24, { map: 'town_harbor' }, ['neutral', `My bench. My harbor. My gull. Well. His gull. I'm only visiting.`]),
    t(26, { time: ['05:00', '09:00'] }, ['neutral', `Early. Good. Dawn's the only honest hour. Everything after is gossip.`]),
    t(27, { flag: 'main_finch_challenge' }, ['thinking', `You took my challenge. Hm. Don't let it go to your head. But well done.`]),
    t(27, { flag: 'main_core_found' }, ['surprised', `The core. After all these years. Hm. My hands are shaking. Don't look at them.`]),
    t(28, { flag: 'main_bell_restored' }, ['shy', `It rang. I heard it. ...I'm not crying. The wind's strong today.`]),
    t(1, null, ['neutral', `Hm.`]),
    t(1, null, ['neutral', `You want to talk? Fine. Short. Fish are listening.`]),
    t(1, null, ['thinking', `The bell remembers. Most folks don't. That's all.`]),
  ],
  repeat: [
    t(1, null, ['neutral', `Again? Hm.`]),
    t(1, null, ['angry', `The Admiral just stole my bait. I'm busy being offended.`]),
    t(1, null, ['neutral', `Sit or leave. Don't hover.`]),
    t(5, H(6), ['shy', `...Stay. It's... fine. Stay.`]),
  ],
  gift: {
    loves: ['tea_leaves', 'coffee', 'seashell'],
    likes: ['riceball', 'curry_plate', 'tea', 'sandwich', 'paper_lantern', 'keychain'],
    dislikes: ['perfume', 'soda', 'plushie_bear'],
    hates: ['whoopee_cushion', 'black_licorice'],
    lines: {
      loves: [['surprised', `For me? ...Hm. Well. Don't just stand there. Sit. Thank you.`], ['shy', `You remembered. Hm. Not many do. I'll keep it. Close.`]],
      likes: [['neutral', `Hm. Good. Useful. Thank you.`], ['happy', `Not bad, young one. Not bad at all.`]],
      neutral: [['neutral', `Hm. Thanks. I'll find a spot.`], ['neutral', `You didn't have to. But fine.`]],
      dislikes: [['neutral', `Not for me. But, hm. Thanks.`], ['sad', `I'll leave it on the bench. Maybe the gull will take it.`]],
      hates: [['angry', `Take it away. Right now. Hmph.`], ['angry', `Is this a joke? I don't laugh. Remove it.`]],
      birthday: [['surprised', `How'd you know? ...Hm. Thanks. Don't tell Roz.`], ['shy', `Another year. Another tide. A gift is... fine. Thank you.`]],
    },
  },
};
