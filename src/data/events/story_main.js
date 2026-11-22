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

// Staging for the finale. The camera follows the player at bridge_mid, so everybody has to stand inside that frame. The spots are
// checked against riverside_park's walk grid: the bridge is one tile wide, the south bank is the open ground at its foot, the
// north bank lies across the brook.
const SPOT = {
  partner: { x: 21, z: 15 }, walkIn: { x: 23.4, z: 16 },
  rosalind: { x: 16.6, z: 16 }, nana_fen: { x: 17.4, z: 15.2 }, gus: { x: 25.6, z: 16 }, theo: { x: 24.4, z: 15.4 },
  odell: { x: 20.8, z: 9.4 }, hattie: { x: 17.6, z: 10 },
};
// The guest who walks in during a scene starts far away (off-screen), so the arrival is seen; everybody else is already in frame.
const FAR = { rosalind: 'picnic_blanket', gus: 'pond_edge', nana_fen: 'bench_rp_2_spot', theo: 'flower_bed' };
const WALKER = { mira: 'rosalind', willa: 'nana_fen', juno: 'gus', rhea: 'nana_fen', celeste: 'rosalind' };
const guests = (walker) => ['rosalind', 'gus', 'nana_fen', 'theo'].map((g) => ({ place: g, at: g === walker ? FAR[g] : SPOT[g], facing: 'player' }));

const MIDDLE = {
  mira: [
    { narrate: 'Paper lanterns drift down the brook, one by one.' },
    { narrate: 'A basket of warm rolls goes hand to hand along the bridge rail. The whole park smells of butter.' },
    say('mira', loveLines.mira[0], 'happy'),
    say('player', 'Me too. This is the best place I could have ended up.'),
    say('mira', 'Do you remember my first morning with you? I was a snowman. You did not even laugh. Much.', 'laugh'),
    say('player', 'I laughed a little. Quietly. Into a roll.'),
    say('mira', 'I knew it! I knew it, and I did not mind. That is how I knew, you see.', 'shy'),
    { move: 'rosalind', to: SPOT.walkIn, speed: 'walk', wait: true }, { face: 'rosalind', toward: 'player' },
    say('rosalind', 'Mira. The painter brought the shop sign by this afternoon. I did not tell you, because you would have cried on the paint.', 'neutral'),
    say('mira', 'The sign?! Mum, I only said the word "bakery" out loud a few weeks ago!', 'surprised'),
    say('rosalind', 'It says "Mira\'s Bakery". And underneath, in very small letters, "Adequate". You know what that means.', 'happy'),
    { emote: 'mira', icon: 'sparkle' },
    say('mira', 'It means perfect. Mum. Mum, I am going to be so annoying about this forever.', 'happy'),
    say('player', 'Is there still a stool for me?'),
    say('rosalind', 'Left of the oven. Very small. If you wobble it, you are fired. Tobias used to tap the window before dawn. Somebody must.', 'happy'),
    say('gus', 'I have eaten in forty harbours, and I never smelled a basket like that. Pass one down, lass, before I faint with envy!', 'laugh'),
    say('nana_fen', 'Look at the two of them, Gus. Like two loaves baked in one tin. Do not fuss them, dear. Let them rise.', 'smug'),
    say('mira', loveLines.mira[1], 'shy'),
  ],
  willa: [
    { narrate: 'Paper lanterns drift down the brook, one by one.' },
    { narrate: 'Someone has carried a reading lamp onto the bridge. Willa has a book tucked under her arm, just in case.' },
    say('willa', loveLines.willa[0], 'happy'),
    say('player', 'Try me. I have been a very patient reader.'),
    say('willa', 'I know. You waited through a whole story about a librarian and the stars. Without once saying it was not very good.', 'shy'),
    say('player', 'Because it was good. And I like how it ends.'),
    say('willa', 'It did not end. That was the whole problem. I wrote a last page on Fair night and it fell open like a door.', 'thinking'),
    { move: 'nana_fen', to: SPOT.walkIn, speed: 'walk', wait: true }, { face: 'nana_fen', toward: 'player' },
    say('nana_fen', 'Willa, dear. Your mother knitted me a hat once and hid a page of a story in the lining. Did you know?', 'smug'),
    say('willa', '…She did what? Oh. That sounds exactly like her. I… may need to unpick that hat.', 'surprised'),
    say('nana_fen', 'Not today. Today you look at the water. Good stories wait, and so do hats.', 'laugh'),
    say('theo', 'I delivered every library letter this year! I knew something was happening. I just did not know what!', 'happy'),
    say('rosalind', 'Theo. Hush. That is the quietest girl in town, and she is about to say a sentence.', 'neutral'),
    say('willa', 'Tobias called a lamp a wish with a wick. I think a lamp is a sentence somebody leaves for you.', 'shy'),
    say('player', 'And you read all of them.'),
    say('willa', 'And now I am in one. Which is a very odd feeling. And a wonderful one.', 'happy'),
    say('willa', loveLines.willa[1], 'shy'),
  ],
  juno: [
    { narrate: 'Paper lanterns drift down the brook, one by one.' },
    { narrate: 'Far off past the trees, the lighthouse beam sweeps the sky once, slowly, like a wave hello.' },
    say('juno', loveLines.juno[0], 'happy'),
    say('player', 'You are going to say you actually lost. Out loud.'),
    say('juno', 'Never. I will say it was a tie. A very close tie where I am a tiny bit behind. Whisper it.', 'smug'),
    say('juno', 'Do you remember the pier, when you hooked the bigger fish? I wanted a rematch so badly I came back the next morning at dawn.', 'laugh'),
    say('player', 'I know. You were already there when I arrived.'),
    say('juno', 'I was practicing! Not waiting! There is a difference!', 'angry'),
    { move: 'gus', to: SPOT.walkIn, speed: 'walk', wait: true }, { face: 'gus', toward: 'player' },
    say('gus', 'There you are, the pair of you. The lighthouse lamp has been burning two hours without a splutter. Not one.', 'happy'),
    say('juno', 'Gramps, you have been up the ninety-one steps again. Your knees will write you a letter.', 'worried'),
    say('gus', 'My knees can send it by post. It is the best view I have had since I sailed past a whale the size of a barn.', 'laugh'),
    say('gus', 'Your mum and dad would have loved this. Perhaps next postcard I will tell them to come home and see the light.', 'sad'),
    say('juno', 'Maybe they will. Maybe not. But I am not on the pier alone, Gramps. That is what counts.', 'shy'),
    { emote: 'juno', icon: 'heart' },
    say('nana_fen', 'Captain, hush now. Even the sea has gone quiet to listen to that girl.', 'smug'),
    say('juno', loveLines.juno[1], 'shy'),
  ],
  rhea: [
    { narrate: 'Paper lanterns drift down the brook, one by one.' },
    { narrate: 'Spiced cocoa drifts after them, from a very large pot nobody will admit to carrying.' },
    say('rhea', loveLines.rhea[0], 'shy'),
    say('player', 'I am listening. I am listening very carefully.'),
    say('rhea', 'Good. Seven courses on a closed Monday, and I could not say it. Tonight I will manage it in one breath.', 'smug'),
    say('rhea', 'I left the city to find a kitchen where people say what is true. You said it first, over my cocoa.', 'sad'),
    say('player', 'The cocoa was a little bitter at first. And then warm.'),
    say('rhea', '…That is the whole speech. You have just given it in one line. Insufferable. Perfect.', 'laugh'),
    { move: 'nana_fen', to: SPOT.walkIn, speed: 'walk', wait: true }, { face: 'nana_fen', toward: 'player' },
    say('nana_fen', 'Child, I have run an inn for fifty years. I have never seen anyone ladle cocoa with such determination. It is love.', 'smug'),
    say('rhea', 'It is hospitality, Mrs Brightwater. A professional virtue.', 'neutral'),
    say('nana_fen', 'Of course it is, dear. And I knit as a professional virtue.', 'laugh'),
    say('theo', 'I have a confession! I put pink flowers on the Copper Kettle tables last week, for the gossip! Rhea, forgive me!', 'worried'),
    say('rhea', 'I knew. I left them. They were rather nice. If you repeat that, I will serve you decaf.', 'smug'),
    say('gus', 'Decaf! The cruelty! Mark me, lass, you have the soul of a good galley cook. Fierce outside, soft in the middle.', 'happy'),
    { emote: 'rhea', icon: 'heart' },
    say('rhea', loveLines.rhea[1], 'happy'),
  ],
  celeste: [
    { narrate: 'Paper lanterns drift down the brook, one by one.' },
    { narrate: 'Above them the first real stars come out, as though they had waited for the town to finish.' },
    say('celeste', loveLines.celeste[0], 'happy'),
    say('player', 'The Lamplighter. Seven stars, a little crooked.'),
    say('celeste', 'You remembered. Oh. Of course you did. Look, down in the brook. The lanterns are drifting in that same crooked line.', 'surprised'),
    { effect: 'sparkle' },
    say('celeste', 'Professor Vane wrote that someone laid the lamps like stars on purpose. I think the purpose was you.', 'shy'),
    say('player', 'Tobias. Tobias had it planned a long time ago.'),
    say('celeste', 'Perhaps the sky simply waited for somebody to finish the sentence. I will write to the Professor, wherever his comet went.', 'thinking'),
    { move: 'rosalind', to: SPOT.walkIn, speed: 'walk', wait: true }, { face: 'rosalind', toward: 'player' },
    say('rosalind', 'Celeste. You have not eaten since breakfast. I can tell, you are drifting. Roll. Now.', 'neutral'),
    say('celeste', 'Thank you. I was going to eat. I was composing a poem about eating. Mind, it was quite short.', 'shy'),
    say('gus', 'Stars and lamps! In forty years at sea, I never saw the two agree so well. Dead on the mark, Miss Arden.', 'happy'),
    say('theo', 'Is it true that you named a constellation after the lamplighter? Can I get one too? A small one? Near the postbox?', 'happy'),
    say('celeste', 'Theo. You may have a very fast comet. They are rare. Only run in a straight line.', 'laugh'),
    say('nana_fen', 'Hush, Gus, dear. The stars are showing off tonight. Let them.', 'smug'),
    say('celeste', loveLines.celeste[1], 'shy'),
  ],
};

const CLOSING = {
  mira: [
    { narrate: 'By midnight the last paper lantern slips under the bridge. The bakery oven is already warm, because Rosalind cannot stop.' },
    { narrate: 'In the morning the smell of bread reaches Brook Lane before the sun does.' },
    { narrate: 'Inside, left of the oven, a very small stool waits under a very new sign.' },
  ],
  willa: [
    { narrate: 'By midnight the lanterns are gone. The lamps along Market Street keep the library awake.' },
    { narrate: 'On the desk, beside the ink pot, a new page already waits.' },
    { narrate: 'It begins: "In a town where the lamps went out, a stranger came to stay." Nobody wants it to end.' },
  ],
  juno: [
    { narrate: 'By midnight the lanterns are out of sight. The lighthouse turns slowly over a quiet harbour.' },
    { narrate: 'Two rods lean against the hut wall, and a bucket waits for the loser.' },
    { narrate: 'At dawn, two people argue on the pier about a fish nobody has caught yet. The sea does not take sides.' },
  ],
  rhea: [
    { narrate: 'By midnight the pot is empty and the lanterns are gone. One cup of cocoa waits on the Copper Kettle counter.' },
    { narrate: 'In the morning the bell rings at the usual time. The regular takes the usual seat, and the chef pretends not to smile.' },
  ],
  celeste: [
    { narrate: 'By midnight the lanterns are gone, but the lamps and the stars keep answering each other.' },
    { narrate: 'On the hill, an old telescope waits, pointed at the Lamplighter.' },
    { narrate: 'In the observatory log, in Celeste\'s curling hand: "One sentence finished. Another begins." Underlined twice.' },
  ],
};

const together = Object.fromEntries(ROMANCE.map((id) => [`ending_together_${id}`, {
  id: `ending_together_${id}`, kind: 'story', npc: id,
  when: [{ flag: 'festival_lit' }, { flag: `${id}_dating` }, { notFlag: 'ending_together' }], priority: 99, once: true, music: 'ending',
  script: [
    { setFlag: 'ending_together' }, { setFlag: `seen_ending_together_${id}` },
    { letterbox: true },
    { area: 'riverside_park', at: 'bridge_mid' },
    { place: 'player', at: 'bridge_mid', facing: 's' }, { place: id, at: 'gazebo_spot', facing: 'player' },
    ...guests(WALKER[id]),
    { move: id, to: SPOT.partner, speed: 'walk', wait: true }, { face: id, toward: 'player' },
    ...MIDDLE[id],
    { effect: 'hearts' },
    { wait: 800 },
    ...CLOSING[id],
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
      { place: 'player', at: 'bridge_mid', facing: 's' }, { place: 'theo', at: 'gazebo_spot', facing: 'player' }, { place: 'odell', at: SPOT.odell, facing: 'player' },
      { place: 'rosalind', at: SPOT.rosalind, facing: 'player' }, { place: 'gus', at: SPOT.gus, facing: 'player' },
      { place: 'nana_fen', at: SPOT.nana_fen, facing: 'player' }, { place: 'hattie', at: SPOT.hattie, facing: 'player' },
      { move: 'theo', to: SPOT.partner, speed: 'run', wait: true }, { face: 'theo', toward: 'player' },
      { narrate: 'The brook carries a hundred small lights through the dark. The whole town is watching.' },
      say('theo', 'Look at that! I told everyone you would do it! Okay, I told nobody. But I believed it!', 'happy'),
      say('player', 'You told Hattie. Hattie told the entire square. By noon.'),
      say('theo', 'Then technically I told everyone! A postman never lies. He only rounds up!', 'laugh'),
      { move: 'odell', to: { x: 21, z: 11.8 }, speed: 'walk', wait: true }, { face: 'odell', toward: 'player' },
      say('odell', 'Tobias would be so proud. And I am too, {player}. Thank you for staying.', 'happy'),
      say('odell', 'He wrote that I would pretend not to cry. So. I am not crying. It is the paper lanterns. They are very smoky.', 'sad'),
      say('player', 'Thank you for having me. Lanternbrook feels like home.'),
      say('odell', 'It is yours. I shall draw up a deed. In pun form, naturally. Deed done!', 'laugh'),
      say('hattie', 'Oh, I could weep into my daisies! A whole year, and you knew every single person by name! Well, nearly everyone!', 'happy'),
      say('hattie', 'Take a flower. No, take two. One for the cottage, and one for whoever you are about to be kind to next.', 'smug'),
      say('rosalind', 'The first loaf was yours at dawn, every day this winter. I am not going to say I noticed. I noticed. Come by at seven.', 'happy'),
      say('gus', 'And the lighthouse knows your boots, lad. I once told that lamp about a whale. It never said a word. You listen better.', 'laugh'),
      say('nana_fen', 'Come here, dear. You sat with me and a ball of wool and never once complained. Tobias would have knitted you a scarf.', 'smug'),
      say('nana_fen', 'I shall have to do it. With one small hole in it. For the mouse.', 'laugh'),
      { effect: 'sparkle' },
      say('odell', 'To the lamps! And to the one who lit them, and the one who carried the matches!', 'happy'),
      { narrate: 'By midnight the lanterns have drifted out of sight. The lamps hum along Brook Lane to the cottage window.' },
      { narrate: 'A year ago the cottage was a locked door and a lamplighter\'s journal. Now every road in town knows where you are headed.' },
      { title: 'Year 1 complete', sub: 'Thank you for playing', ms: 4000 },
      { letterbox: false },
    ],
  },
};

export default { journal_found: journal, ...lantern, ...together, ...friends };
