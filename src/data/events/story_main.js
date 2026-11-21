// Main-story events: journal, lantern restorations, endings.
const say = (npc, text, expr = 'neutral') => ({ say: npc, text, expr });
const ROMANCE = ['mira', 'willa', 'juno', 'rhea', 'celeste'];

const journal = {
  id: 'journal_found', kind: 'story', when: [{ notFlag: 'journal_found' }, { dateFrom: { season: 'spring', day: 3 } }, { area: 'cottage' }, { time: { from: '06:00', to: '14:00' } }],
  priority: 90, once: true, music: 'sad',
  script: [
    { letterbox: true },
    { narrate: 'Something creaks under your boot. A loose floorboard, just beneath the attic hatch.' },
    { sfx: 'door_open' },
    { narrate: 'Under it lies a small bundle wrapped in oilcloth. Inside is a worn leather journal with a tiny lantern on the cover.' },
    { giveItem: 'tobias_journal' },
    { say: 'player', text: "'Tobias Wren. His book.' I should not read this. But I think he would want me to." },
    { narrate: 'Page one is a list of six names. Beside each, in careful ink, a small lantern is drawn. Five lanterns are dark.' },
    { narrate: 'At the bottom Tobias wrote: "If you are reading this, please show Odell. He will pretend not to cry."' },
    { setFlag: 'journal_found' }, { setFlag: 'seen_journal_found' },
    { startQuest: 'm2_journal' },
    { toast: 'New quest: Tobias\' Journal' },
    { letterbox: false },
  ],
};

const LANTERNS = [
  { n: 1, flag: 'lantern_1', title: "The Baker's Lantern", sub: 'Town Square lamps restored', npc: 'rosalind', line: 'Look at that glow. Warm as fresh bread. He would have said so.', expr: 'happy' },
  { n: 2, flag: 'lantern_2', title: "The Reader's Lantern", sub: 'Market Street lamps restored', npc: 'willa', line: 'The lamps by the library are glowing… it is like watching a sentence finish itself.', expr: 'shy' },
  { n: 3, flag: 'lantern_3', title: "The Sailor's Lantern", sub: 'Harbor lamps restored', npc: 'gus', line: 'She shines! Well, the lamps do. The old girl will follow. Good lad.', expr: 'happy' },
  { n: 4, flag: 'lantern_4', title: "The Café Lantern", sub: 'Riverside Park lamps restored', npc: 'rhea', line: 'The park smells of cocoa and cinnamon. I did not plan that. I am pleased.', expr: 'smug' },
  { n: 5, flag: 'lantern_5', title: "The Stargazer's Lantern", sub: 'Starview Hill and Woods lamps restored', npc: 'celeste', line: 'Look up, then down. The sky and the town are speaking again.', expr: 'happy' },
  { n: 6, flag: 'lantern_6', title: "The Great Lantern", sub: 'Brook Lane lamps restored', npc: 'odell', line: 'Home again. Every lamp in Lanternbrook is glowing. Thank you, my boy.', expr: 'happy' },
];

const lantern = Object.fromEntries(LANTERNS.map((L) => [`lantern_restored_${L.n}`, {
  id: `lantern_restored_${L.n}`, kind: 'story', when: [{ flag: L.flag }, { notFlag: `seen_lantern_restored_${L.n}` }], priority: 85, once: true,
  script: [
    { setFlag: `seen_lantern_restored_${L.n}` }, { setFlag: L.flag },
    { sfx: 'lamp_light' },
    { title: L.title, sub: L.sub, ms: 2500 },
    { lantern: 1 }, { lamps: 'restore' },
    { narrate: 'Far across town, a street lamp flickers, steadies and glows.' },
    say(L.npc, L.line, L.expr),
    { toast: `Lantern ${L.n} of 6 restored` },
  ],
}]));

const loveLines = {
  mira: ['I never thought a dark town could feel this warm.', 'Whatever comes next, I want to bake it with you.'],
  willa: ['I… have a word for this. It is not in any book yet.', 'I would like to write the next page with you.'],
  juno: ['Okay. I will admit it. This is better than winning.', 'Stay. Stay and fish with me. For good.'],
  rhea: ['I have never been good at saying this, so listen carefully.', 'You are my favourite regular. And you always will be.'],
  celeste: ['The lamps and the stars match tonight. Just as he planned.', 'And you are the brightest light in the whole sky.'],
};

const together = Object.fromEntries(ROMANCE.map((id) => [`ending_together_${id}`, {
  id: `ending_together_${id}`, kind: 'story', npc: id,
  when: [{ flag: 'festival_lit' }, { flag: `${id}_dating` }, { notFlag: 'ending_together' }], priority: 99, once: true, music: 'ending',
  script: [
    { setFlag: 'ending_together' }, { setFlag: `seen_ending_together_${id}` },
    { letterbox: true },
    { area: 'riverside_park', at: 'bridge_mid' },
    { place: 'player', at: 'bridge_mid', facing: 's' }, { place: id, at: 'gazebo_spot', facing: 'player' },
    { move: id, to: 'bridge_mid', speed: 'walk', wait: true },
    { narrate: 'Paper lanterns drift down the brook, one by one. The town sings softly behind you.' },
    say(id, loveLines[id][0], 'happy'),
    say('player', 'Me too. This is the best place I could have ended up.'),
    say(id, loveLines[id][1], 'shy'),
    { effect: 'hearts' },
    { title: 'Year 1 complete', sub: 'Thank you for playing', ms: 4000 },
    { letterbox: false },
  ],
}]));

const friends = {
  ending_friends: {
    id: 'ending_friends', kind: 'story',
    when: [{ flag: 'festival_lit' }, { notFlag: 'ending_together' }, { notFlag: 'ending_friends' }, { not: { any: ROMANCE.map((id) => ({ flag: `${id}_dating` })) } }],
    priority: 98, once: true, music: 'ending',
    script: [
      { setFlag: 'ending_friends' }, { setFlag: 'seen_ending_friends' },
      { letterbox: true },
      { area: 'riverside_park', at: 'bridge_mid' },
      { place: 'player', at: 'bridge_mid', facing: 's' }, { place: 'theo', at: 'gazebo_spot', facing: 'player' }, { place: 'odell', at: 'picnic_blanket', facing: 'player' },
      { move: 'theo', to: 'bridge_mid', speed: 'run', wait: true },
      { narrate: 'The brook carries a hundred small lights through the dark. The whole town is watching.' },
      say('theo', 'Look at that! I told everyone you would do it! Okay, I told nobody. But I believed it!', 'happy'),
      say('odell', 'Tobias would be so proud. And I am too, {player}. Thank you for staying.', 'happy'),
      say('player', 'Thank you for having me. Lanternbrook feels like home.'),
      { title: 'Year 1 complete', sub: 'Thank you for playing', ms: 4000 },
      { letterbox: false },
    ],
  },
};

export default { journal_found: journal, ...lantern, ...together, ...friends };
