// Friendship scenes: short slice-of-life events. id friend_<npc>_<n>.
const F = (npc, n, hearts, o) => {
  const id = `friend_${npc}_${n}`;
  return [id, {
    id, kind: 'friend', npc, priority: 40 + n, once: true,
    when: [{ hearts: { npc, gte: hearts } }, { notFlag: `seen_${id}` }, ...(n > 1 && o.needPrev ? [{ flag: `seen_friend_${npc}_${n - 1}` }] : []), { area: o.area }, ...(o.when || [])],
    script: [
      { setFlag: `seen_${id}` }, { letterbox: true },
      { area: o.area, at: o.at }, { place: 'player', at: o.at, facing: 's' }, { place: npc, at: o.npcAt, area: o.area, facing: 'player' },
      ...o.steps.map((s) => (Array.isArray(s) ? { say: s[0], text: s[1], expr: s[2] || 'neutral' } : s)),
      { affection: npc, amount: 30 },
      { letterbox: false },
    ],
  }];
};

export default Object.fromEntries([
  F('theo', 1, 2, { area: 'market_street', at: 'street_west', npcAt: { x: 6.6, z: 16.5 }, when: [{ time: { from: '08:00', to: '17:00' } }], steps: [
    ['theo', 'Race! Race! I bet I can reach the postbox before you! Ready? Go!', 'happy'],
    ['player', 'You are already running!'],
    ['theo', 'That is the trick! Start early! Always start early! Except for work!', 'laugh'],
    ['theo', 'Okay, you win, I tripped on the cat. Rematch tomorrow?', 'surprised'],
  ] }),
  F('theo', 2, 4, { needPrev: true, area: 'inn', at: 'table_inn_2', npcAt: 'table_inn_1', when: [{ time: { from: '18:00', to: '22:00' } }], steps: [
    ['theo', 'Gossip night! I have three bits of news. One is true. One is half true. One I made up. Guess!', 'happy'],
    ['theo', 'Hattie is learning the piano. Rhea secretly likes pink. And the Mayor once got stuck in the fountain.', 'laugh'],
    ['player', 'The last one.'],
    ['theo', 'True! He was nine, and still talks about it. Do not mention it!', 'laugh'],
    ['theo', 'You are good company, {player}. Most people ask me to stop talking.', 'shy'],
  ] }),
  F('theo', 3, 6, { needPrev: true, area: 'brook_lane', at: 'cottage_front', npcAt: { x: 10.9, z: 17.4 }, when: [{ time: { from: '08:00', to: '18:00' } }], steps: [
    ['theo', 'My bike broke! The chain! The wheel! The... everything! I rode it into the stream!', 'worried'],
    ['player', 'Let me help. Hold the frame.'],
    ['theo', 'You are good at this! Is there anything you are not good at? Do not answer. I could not take it.', 'laugh'],
    ['theo', 'Thanks, {player}. You are the first person I called a best friend. Out loud. Do not tell Uncle Barnaby.', 'shy'],
  ] }),
  F('odell', 1, 3, { area: 'town_square', at: 'plaza_center', npcAt: 'fountain_spot', when: [{ time: { from: '16:30', to: '21:00' } }], steps: [
    ['odell', 'Ah, {player}. Care to watch the lamps with me? They will not light. But I like to be hopeful.', 'sad'],
    ['odell', 'Tobias would say, "Odell, a lamp is just a wish with a wick." Silly, sentimental man.', 'happy'],
    ['player', 'I miss him, and I never met him.'],
    ['odell', 'That, my boy, is the very best sort of friend to have lost.', 'happy'],
  ] }),
  F('odell', 2, 6, { needPrev: true, area: 'town_hall', at: 'desk_front', npcAt: 'behind_desk', when: [{ time: { from: '09:00', to: '16:00' } }, { not: { weekday: ['sat', 'sun'] } }], steps: [
    ['odell', 'Look at this. A letter from the city council. They want to know why Lanternbrook still has a mayor. Ha!', 'laugh'],
    ['odell', 'I told them, because somebody has to remember where the pun jar is.', 'happy'],
    ['player', 'I think the town needs you.'],
    ['odell', 'Kind of you. I shall frame that. Next to the letter I am not going to answer.', 'happy'],
  ] }),
  F('nana_fen', 1, 3, { area: 'inn', at: 'hearth_spot', npcAt: 'table_inn_1', when: [{ time: { from: '10:00', to: '21:00' } }], steps: [
    ['nana_fen', 'Sit by me, dear. I have tea and a story. Tobias used to sit exactly there.', 'happy'],
    ['nana_fen', 'He would knit with me. Badly. Beautifully. He made a scarf with a hole in it. On purpose, for a mouse.', 'laugh'],
    ['player', 'He sounds wonderful.'],
    ['nana_fen', 'He was a bit daft. And the kindest man I ever knew. You remind me of him.', 'shy'],
  ] }),
  F('nana_fen', 2, 6, { needPrev: true, area: 'market_street', at: 'inn_steps', npcAt: { x: 40.1, z: 12.8 }, when: [{ time: { from: '13:30', to: '16:00' } }, { not: { weather: ['rain', 'storm', 'snow'] } }], steps: [
    ['nana_fen', 'Come sit on my bench, {player}. I watch the street from here. It is better than any play.', 'smug'],
    ['nana_fen', 'Mira walks past and trips. Willa walks past and does not look at you-know-who. And Theo runs. Always Theo.', 'laugh'],
    ['nana_fen', 'I am old, and I have seen a great many people come and go. I would like you to stay.', 'happy'],
    ['player', 'I am not going anywhere.'],
    ['nana_fen', 'Good. Now fetch me my knitting, it has rolled under the bench again.', 'smug'],
  ] }),
  F('gus', 1, 3, { area: 'harbor', at: 'harbor_bench_spot', npcAt: { x: 31.8, z: 16.9 }, when: [{ time: { from: '08:00', to: '18:00' } }], steps: [
    ['gus', 'Sit, lad. Let me tell you about the great squid. Twelve arms. Maybe fifteen. Big as a church!', 'laugh'],
    ['gus', 'It came up beside my boat. I looked it in the eye. And it winked at me!', 'happy'],
    ['player', 'Squids do not wink.'],
    ['gus', 'This one did! ...Fine. It was a very large boot. But it was a winking boot.', 'laugh'],
  ] }),
  F('gus', 2, 6, { needPrev: true, area: 'harbor', at: 'lighthouse_base', npcAt: { x: 37.6, z: 20.2 }, when: [{ time: { from: '16:00', to: '20:00' } }], steps: [
    ['gus', 'That is the old girl. Dark as a coal sack. I sailed in under her light every night for thirty years.', 'sad'],
    ['gus', 'My wife used to wait here. Waved a lantern. She is gone now. The light went out about the same time.', 'sad'],
    ['player', 'We will light it again.'],
    ['gus', 'Do not make promises to an old sailor, lad. We hold you to them.', 'neutral'],
    ['gus', '...But thank you. Truly.', 'happy'],
  ] }),
  F('rosalind', 1, 4, { area: 'bakery', at: 'counter_front', npcAt: 'behind_counter', when: [{ time: { from: '07:00', to: '16:00' } }, { not: { weekday: 'sun' } }], steps: [
    ['rosalind', 'Come. Sit. I want you to try something. Do not talk with your mouth full.', 'neutral'],
    ['rosalind', 'My mother\'s rye. Four generations of rye. Never changed.', 'happy'],
    ['player', 'It is wonderful. Warm and a little sweet.'],
    ['rosalind', 'Hm. You will do. Come back tomorrow and I will teach you to shape a loaf.', 'happy'],
  ] }),
  F('barnaby', 1, 4, { area: 'general_store', at: 'counter_front', npcAt: 'behind_counter', when: [{ time: { from: '09:00', to: '18:00' } }, { not: { weekday: 'wed' } }], steps: [
    ['barnaby', 'A customer! My favourite kind! Come, come, help me with a thing. I am rearranging the pickles.', 'happy'],
    ['barnaby', 'Why did the pickle go to the party alone? Because it was dill-ightfully independent! Ha!', 'laugh'],
    ['player', 'That was terrible.'],
    ['barnaby', 'Thank you! I worked on it all week!', 'laugh'],
  ] }),
  F('elias', 1, 4, { area: 'clinic', at: 'reception_front', npcAt: 'waiting_chairs', when: [{ time: { from: '09:00', to: '17:00' } }, { not: { weekday: 'sun' } }], steps: [
    ['elias', 'You are not ill. Good. Sit. I would like company with my tea. It is a quiet afternoon.', 'neutral'],
    ['elias', 'I came here to rest. Instead everyone comes to me for rest. Funny, that.', 'happy'],
    ['player', 'Maybe the town is just resting around you.'],
    ['elias', 'That is the kindest diagnosis I have heard in years. Have a biscuit.', 'happy'],
  ] }),
  F('pip', 1, 4, { area: 'whispering_woods', at: 'trail_start', npcAt: { x: 8.8, z: 27.1 }, when: [{ time: { from: '08:00', to: '17:00' } }, { not: { weather: ['rain', 'storm', 'snow'] } }], steps: [
    ['pip', 'SHHH! Do not move! There is a beetle on that leaf! It is the BIGGEST ONE EVER!', 'surprised'],
    ['pip', 'It is a ladybird. A normal ladybird. But I named him Gerald and he is perfect!', 'happy'],
    ['player', 'Hello, Gerald.'],
    ['pip', 'He says hello back! You are the first grown-up who talked to Gerald! You are the best!', 'laugh'],
  ] }),
  F('lottie', 1, 4, { area: 'riverside_park', at: 'picnic_blanket', npcAt: { x: 18.4, z: 24.1 }, when: [{ time: { from: '14:00', to: '18:00' } }, { not: { weather: ['rain', 'storm', 'snow'] } }], steps: [
    ['lottie', 'You are late for the tea party. I forgive you. Sit on the blanket. NOT there. There.', 'angry'],
    ['lottie', 'This is Mr. Biscuit. He is a stuffed rabbit. He has strong opinions on tea.', 'happy'],
    ['player', 'Pleased to meet you, Mr. Biscuit.'],
    ['lottie', 'He says you may be an honorary guest. Pip is not allowed. He sneezed on the cake.', 'smug'],
  ] }),
  F('ferris', 1, 4, { area: 'riverside_park', at: 'pond_edge', npcAt: { x: 31.1, z: 17.3 }, when: [{ time: { from: '10:00', to: '12:00' } }, { not: { weather: ['rain', 'storm', 'snow'] } }], steps: [
    ['ferris', 'Ah, my dear fellow. Sit. Meet my students: Plato, Socrates and Susan. Susan is the clever one.', 'happy'],
    ['ferris', 'A poem for the occasion: "The duck does not ask where the pond comes from, only if the bread is fresh."', 'thinking'],
    ['player', 'That is really good.'],
    ['ferris', 'You are too kind. But I shall write it down at once, before the ducks steal it.', 'laugh'],
  ] }),
  F('bramwell', 1, 4, { area: 'whispering_woods', at: 'trail_start', npcAt: { x: 8.8, z: 27.1 }, when: [{ time: { from: '08:00', to: '18:00' } }], steps: [
    ['bramwell', 'You are quieter now. Good. Come. I will show you where the shrine candle burns.', 'neutral'],
    ['bramwell', 'Tobias lit it. Every year, on the longest night. I keep it going. It is a small thing.', 'sad'],
    ['player', 'It is not small. It lit up my whole day.'],
    ['bramwell', '...Hmph. Careful. You will make an old man sentimental. Take some chestnuts.', 'happy'],
    { giveItem: 'chestnut', qty: 3 },
  ] }),
  F('sable', 1, 4, { area: 'town_square', at: 'plaza_center', npcAt: { x: 23.4, z: 22.9 }, when: [{ weekday: 'sat' }, { time: { from: '10:00', to: '18:00' } }], steps: [
    ['sable', 'Come closer, {player}. I will tell you a story about a peddler who traded her name for a map.', 'smug'],
    ['sable', 'The map led nowhere. The name was never returned. And she was happier than she had ever been.', 'happy'],
    ['player', 'Is it a true story?'],
    ['sable', 'Every story is true on a Saturday. Come back tomorrow and I will tell you another.', 'laugh'],
  ] }),
  F('hattie', 1, 4, { area: 'town_square', at: 'plaza_center', npcAt: { x: 23.4, z: 22.9 }, when: [{ time: { from: '09:00', to: '17:00' } }], steps: [
    ['hattie', 'Dear, come here! I have to tell you something I have never told anyone. Closer!', 'surprised'],
    ['hattie', 'I do not actually know everyone\'s business. I just say I do, and people tell me. It works every time!', 'laugh'],
    ['player', 'That is brilliant.'],
    ['hattie', 'I know! Now do not tell a soul. Or do. I will deny it.', 'smug'],
  ] }),
  F('henrik', 1, 4, { area: 'brook_lane', at: 'cottage_front', npcAt: { x: 10.9, z: 17.4 }, when: [{ time: { from: '07:00', to: '17:00' } }, { not: { weather: ['rain', 'storm', 'snow'] } }], steps: [
    ['henrik', 'You have a squeaky door. I could hear it from the lane. Hold on, I have oil.', 'neutral'],
    { anim: 'henrik', name: 'hammer', wait: true },
    ['henrik', 'There. Better. Tobias would have done it for free. I will do it for a cup of tea.', 'happy'],
    ['player', 'Deal. Thanks, Henrik.'],
    ['henrik', 'The kids talk about you all the time. It is nice, having someone patient around.', 'happy'],
  ] }),
]);
