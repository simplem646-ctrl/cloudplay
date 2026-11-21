// Mail. Delivered the morning after `when` passes; read at the cottage mailbox.
import NPCS from './npcs.js';

const M = (id, from, subject, body, when, attach) => ({ id, from, subject, body, when, once: true, ...(attach ? { attach } : {}) });
const D = (season, day) => ({ season, day });
const from = (season, day) => ({ dateFrom: D(season, day) });

const STORY = [
  M('mail_welcome_odell', 'odell', 'Welcome to Lanternbrook!', [
    'Dear {player}, welcome! I hope the cottage is not too creaky.',
    'Enclosed is a little something for your first week. Do pop in at Town Hall, I have plenty of puns waiting.',
    'Yours, Odell Hartwell, Mayor (and landlord, ha!)',
  ], { flag: 'prologue_done' }, { money: 100 }),
  M('mail_loose_board', 'nana_fen', 'About that creaky floor', [
    'Dear {player}, Odell tells me you are in Tobias\' cottage.',
    'There is a loose board upstairs under the attic hatch. He always said it hid his best secret.',
    'Tea at the inn when you have a moment, dear. - N.F.',
  ], [{ flag: 'prologue_done' }, { notFlag: 'journal_found' }, from('spring', 2)]),
  M('mail_journal_thanks', 'odell', 'The journal', [
    'I cannot stop thinking about those six names.',
    'Whatever you decide to do about them, thank you for finding it. Tobias would have loved to meet you.',
  ], [{ flag: 'journal_found' }], { money: 50 }),
  M('mail_reader_invite', 'willa', 'A riddle, if you like', [
    'Dear {player}, I think the library keeps one of Tobias\' secrets.',
    'Come by when you have a moment. I will pretend I am not nervous… - Willa',
  ], [{ quest: { id: 'm2_journal', state: 'done' } }, from('spring', 15)]),
  M('mail_sailor_note', 'gus', 'Storm lantern', [
    'Boy, the lighthouse lens is cracked. Tobias said you would come. Smart man.',
    'Visit the hut when you can. I will not tell the story twice, so be on time. - Capt. G. Pelham',
  ], [{ quest: { id: 'm2_journal', state: 'done' } }, from('summer', 1)]),
  M('mail_cafe_card', 'rhea', 'A request', [
    'I am told you are collecting lanterns. I have something that belongs to one.',
    'I am not sure I want to give it up. Come and drink coffee, and we will see. - R. Montclair',
  ], [{ quest: { id: 'm2_journal', state: 'done' } }, from('summer', 15)]),
  M('mail_star_note', 'celeste', 'Dear stargazer', [
    'The autumn sky is clear and the lamps are in a line, {player}.',
    'Come up to the observatory after four. There is something I would like to show you.',
  ], [{ quest: { id: 'm2_journal', state: 'done' } }, from('autumn', 1)]),
  M('mail_great_lantern', 'odell', 'It is time', [
    'You have all five pieces, {player}! Take them to Tobias\' workbench.',
    'Henrik says he will help with the frame. Do not let him talk you into a coat rack.',
  ], [{ lanterns: { gte: 5 } }]),
  M('mail_festival_invite', 'odell', 'The Lantern Festival', [
    'Winter 24, at dusk, in the town square. The whole town will be there.',
    'Bring your lantern, and an appetite. Nana Fen is making her famous stew!',
  ], from('winter', 20), { items: [{ id: 'paper_lantern', qty: 1 }] }),
  M('mail_festival_ticket', 'town', 'Your festival ticket', [
    'Admit one to the Winter Lantern Festival.',
    'The lanterns will be lit at dusk. Warm clothes recommended.',
  ], from('winter', 21), { items: [{ id: 'festival_ticket', qty: 1 }] }),
];

const FLAVOUR = [
  M('mail_theo_hello', 'theo', 'First post!', [
    'Hi hi hi! Theo here! You are my first customer in this cottage in THREE YEARS.',
    'I put the letters in your box myself. Slightly squashed. Sorry! - T.',
  ], [{ flag: 'prologue_done' }, from('spring', 2)]),
  M('mail_news_spring', 'town', 'The Lanternbrook Times: Spring', [
    'Blossom Picnic coming on Spring 14 at Riverside Park! Bring a basket and a friend.',
    'The Mayor reminds visitors: the fountain is not a swimming pool.',
  ], from('spring', 5)),
  M('mail_news_summer', 'town', 'The Lanternbrook Times: Summer', [
    'Midsummer Lights on Summer 21 at the harbor. Fireworks over the water!',
    'The beach has new shells. Gulls are asked to stop stealing sandwiches.',
  ], from('summer', 5)),
  M('mail_news_autumn', 'town', 'The Lanternbrook Times: Autumn', [
    'Harvest Moon Fair on Autumn 14, with a fishing contest and a bake-off.',
    'Willa Thorne will give a public reading. Expect cake.',
  ], from('autumn', 5)),
  M('mail_news_winter', 'town', 'The Lanternbrook Times: Winter', [
    'Hearthlight Evening is on Winter 10 at the Heron Inn.',
    'The Lantern Festival will be held on Winter 24. Dress warmly.',
  ], from('winter', 3)),
  M('mail_barnaby_sale', 'barnaby', 'SALE! (Almost)', [
    'Dear valued customer, Pennywhistle Provisions has a once-in-a-lifetime offer!',
    'Buy one rope, and I will say "knot bad" for free. Yours, Barnaby P.',
  ], [{ met: 'barnaby' }, from('spring', 8)]),
  M('mail_hattie_gossip', 'hattie', 'Have you heard?', [
    'Dear {player}, I heard the most wonderful thing, and I am not telling you in writing!',
    'Come to the stall and I will whisper. Bring tea. - H.',
  ], [{ met: 'hattie' }, from('spring', 10)]),
  M('mail_ferris_poem', 'ferris', 'A small verse', [
    '"The brook runs on, the lamps grow dim, the town waits kindly all the same."',
    'A line for you, my dear fellow. - F. Quill',
  ], [{ hearts: { npc: 'ferris', gte: 1 } }]),
  M('mail_bramwell_note', 'bramwell', 'Woods note', [
    'Berries are ripe by the old log. Do not tread on the moss.',
    '- Moss',
  ], [{ hearts: { npc: 'bramwell', gte: 2 } }], { items: [{ id: 'forest_moss', qty: 2 }] }),
  M('mail_sable_postcard', 'sable', 'Greetings from the road', [
    'I will be back on Saturday with something shiny, {player}.',
    'Do not ask where I go on weekdays. A peddler needs her secrets. - S.Q.',
  ], [{ met: 'sable' }]),
  M('mail_henrik_thanks', 'henrik', 'Thanks', [
    'The kids will not stop talking about you. I will not either, I suppose.',
    'If anything breaks, ask. - Henrik',
  ], [{ hearts: { npc: 'henrik', gte: 2 } }], { items: [{ id: 'plank', qty: 3 }] }),
  M('mail_elias_checkup', 'elias', 'Reminder', [
    'You have been working hard. Rest, water, a short walk.',
    'This is a prescription, not a suggestion. - Dr. Whitlock',
  ], [{ met: 'elias' }, from('summer', 3)], { items: [{ id: 'herbal_tea', qty: 1 }] }),
  M('mail_juno_challenge', 'juno', 'RACE', [
    'You, me, the pier, dawn. First fish wins. Do not bring a net, that is cheating.',
    '- J.',
  ], [{ hearts: { npc: 'juno', gte: 2 } }]),
  M('mail_mira_recipe', 'mira', 'New recipe!', [
    'Dear {player}, I made a new honey roll and I think it is the best thing ever!!',
    'Mum says it is "adequate". I am taking that as a yes! Love, Mira',
  ], [{ hearts: { npc: 'mira', gte: 3 } }], { items: [{ id: 'honey_roll', qty: 2 }] }),
  M('mail_rosalind_thanks', 'rosalind', 'About your work', [
    'You show up and you work. That is rare. Here is something for the oven-warmed hands.',
    '- R. Calloway',
  ], [{ jobDone: 'bakery_shift' }, { flag: 'prologue_done' }, from('spring', 4)], { items: [{ id: 'bread', qty: 2 }] }),
  M('mail_pip_drawing', 'pip', 'DRAWING', [
    'I drew a beetle! And YOU! You are the one with the arms. Pip.',
    'P.S. The beetle is bigger than you.',
  ], [{ hearts: { npc: 'pip', gte: 2 } }], { items: [{ id: 'pretty_pebble', qty: 1 }] }),
  M('mail_lottie_invite', 'lottie', 'YOU ARE INVITED', [
    'To: {player}. Tea party at four. No boys allowed. Except you. And Pip, but only if he washes.',
    'Signed, LOTTIE THE GREAT',
  ], [{ hearts: { npc: 'lottie', gte: 2 } }], { items: [{ id: 'cookie', qty: 2 }] }),
  M('mail_clinic_flyer', 'town', 'Whitlock Clinic: flu season', [
    'Dr. Whitlock reminds all residents: wash your hands, wear a scarf, take your tea.',
    'The clinic bed is free for anyone feeling tired. No questions asked.',
  ], from('autumn', 18)),
  M('mail_nana_scarf', 'nana_fen', 'Knit one, purl two', [
    'Dear {player}, I made you a little something. It is a scarf. Well, it is a scarf-shaped idea.',
    'Come for tea and I will explain. - N.F.',
  ], [{ hearts: { npc: 'nana_fen', gte: 3 } }], { items: [{ id: 'knitting_wool', qty: 1 }] }),
  M('mail_gus_tale', 'gus', 'You will not believe this', [
    'I caught a fish the size of a dinghy this morning. Well, a very large boot.',
    'Come and hear all about it. - G.',
  ], [{ hearts: { npc: 'gus', gte: 3 } }]),
  M('mail_willa_note', 'willa', 'A bookmark', [
    'I found this bookmark in a returned book and thought of you… I mean, I thought you might like it…',
    'It is a bookmark. Nothing more. - W.',
  ], [{ hearts: { npc: 'willa', gte: 3 } }], { items: [{ id: 'ink_bottle', qty: 1 }] }),
  M('mail_rhea_card', 'rhea', 'Complimentary', [
    'The enclosed is a voucher for one cup of anything. It is not a gift, I am simply getting rid of stock.',
    '- R.',
  ], [{ hearts: { npc: 'rhea', gte: 3 } }], { items: [{ id: 'hot_cocoa', qty: 1 }] }),
  M('mail_celeste_star', 'celeste', 'A star for you', [
    'I found this charm on the hill. It sparkles at night, like a small, brave star.',
    'I hope it keeps you company. - C.',
  ], [{ hearts: { npc: 'celeste', gte: 3 } }], { items: [{ id: 'star_charm', qty: 1 }] }),
];

// birthday cards: one per villager with a birthday, short and in their own voice
const BDAY = {
  mira: ['Hi {player}! It is my birthday and I baked myself a cake! Come and have a slice, you will not regret it!', { id: 'cookie', qty: 3 }],
  willa: ['Dear {player}… it is my birthday. Not that it matters. But… if you remember, that would be… nice.', { id: 'book_moon_garden', qty: 1 }],
  juno: ['Birthday today. Do not make a fuss. Okay, make a small fuss. Come to the pier.', { id: 'bait', qty: 5 }],
  rhea: ['It is my birthday. I have set aside a table, and exactly one slice of cake. Do not be late.', { id: 'croissant', qty: 2 }],
  celeste: ['Happy birthday to me, said the sky to the stars… Come up to the hill and keep me company.', { id: 'moonpetal', qty: 1 }],
  odell: ['My birthday again! I am not old, I am vintage. Pop in, I am baking, er, buying a cake.', { id: 'bread', qty: 2 }],
  theo: ['IT IS MY BIRTHDAY!!! Party at the inn, probably! I will be late to my own party, honest!', { id: 'lemonade', qty: 2 }],
  nana_fen: ['Another year, dear, and another sock. Come for tea, and a slice of whatever Rosalind brought.', { id: 'herbal_tea', qty: 2 }],
  gus: ['Birthday. Do not tell anyone. Come to the hut and I will tell you about the time I was sixty-eight and nobody cared.', { id: 'seaweed_snack', qty: 2 }],
  rosalind: ['It is my birthday. I want no fuss and a nice loaf. Mira has been plotting. Act surprised.', { id: 'sweet_bun', qty: 2 }],
  barnaby: ['BIRTHDAY SALE! Everything is regular price, but I will give you a free pun with every purchase!', { id: 'cheese', qty: 1 }],
  elias: ['I turn another year older today. Please do not bring cake. Tea is fine. Tea is always fine.', { id: 'herbal_tea', qty: 1 }],
  pip: ['IT IS MY BIRTHDAY!!!! I AM TEN!!! (Nearly.) Come to the park!!!', { id: 'glass_marble', qty: 1 }],
  lottie: ['My birthday is the best day of the year and you will give me a present. That is the rule.', { id: 'cookie', qty: 2 }],
  ferris: ['"A birthday is a year folded gently into a day." I wrote that myself. Come and say hello.', { id: 'tea', qty: 1 }],
  bramwell: ['Birthday. Do not bring anything. Maybe bring honey. - Moss', { id: 'chestnut', qty: 2 }],
  hattie: ['It is my birthday and I have told every single person! Come to the stall and say something nice!', { id: 'daisy_bundle', qty: 2 }],
  henrik: ['Birthday. The kids made me a card. It is mostly glitter. Come and see before it falls apart.', { id: 'plank', qty: 2 }],
};

const BIRTHDAYS = Object.entries(BDAY).map(([npc, [line, item]]) => {
  const bd = NPCS[npc].birthday;
  return M(`mail_bday_${npc}`, npc, `A birthday note from ${NPCS[npc].short}`, [line, `- ${NPCS[npc].short}`],
    [{ date: { season: bd.season, day: bd.day } }, { hearts: { npc, gte: 1 } }], { items: [item] });
});

const LIST = [...STORY, ...FLAVOUR, ...BIRTHDAYS];
export default Object.fromEntries(LIST.map((m) => [m.id, m]));
