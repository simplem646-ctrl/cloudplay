// One-time hint toasts. `icon` is an ICON_SHAPES name.
export default [
  { id: 'tut_move', when: { flag: 'prologue_done' }, text: 'Move with WASD or the arrow keys. Hold Shift to run.', icon: 'star' },
  { id: 'tut_interact', when: { flag: 'prologue_done' }, text: 'Press Space (or Enter, Z, F) to talk, open doors and look at things.', icon: 'heart_charm' },
  { id: 'tut_menu', when: [{ flag: 'prologue_done' }, { day: { gte: 1 } }], text: 'Press Tab or Esc for the menu. I is items, J is quests, M is the map.', icon: 'map' },
  { id: 'tut_clock', when: { area: ['brook_lane', 'town_square'] }, text: 'Time passes while you walk. Be in bed by midnight for a full night\'s sleep.', icon: 'gear' },
  { id: 'tut_energy', when: { energy: { lte: 60 } }, text: 'Your energy is draining. Food, benches and sleep will restore it.', icon: 'bread_loaf' },
  { id: 'tut_shop_hours', when: { area: 'market_street' }, text: 'Shops have opening hours and closed days. Check the door if you find it shut.', icon: 'coin' },
  { id: 'tut_gifts', when: { flag: 'met_town' }, text: 'Give one gift a day to a friend. Everyone has favourites. Watch the reactions!', icon: 'ribbon' },
  { id: 'tut_noticeboard', when: { area: 'town_square' }, text: 'The noticeboard offers a few small jobs every day. Handy for coins and friendship.', icon: 'letter' },
  { id: 'tut_mailbox', when: { flag: 'prologue_done' }, text: 'Check your mailbox at the cottage each morning. Letters often bring gifts.', icon: 'letter' },
  { id: 'tut_save', when: { area: 'cottage' }, text: 'Save your game at the diary in the cottage, or from the pause menu.', icon: 'book' },
  { id: 'tut_fishing', when: { item: { id: 'fishing_rod', gte: 1 } }, text: 'Stand at a fishing spot, wait for a bite, then press Space when the bar is in the zone.', icon: 'rod' },
  { id: 'tut_forage', when: { area: ['riverside_park', 'whispering_woods', 'harbor', 'starview_hill'] }, text: 'Sparkling spots on the ground can be foraged. They refill each morning.', icon: 'bag' },
  { id: 'tut_rain', when: { weather: ['rain', 'storm'] }, text: 'Rainy days change what people do and which fish bite. Try the library or the inn.', icon: 'feather' },
  { id: 'tut_heart_event', when: { hearts: { npc: 'mira', gte: 1 } }, text: 'Friendship hearts grow as you talk and give gifts. Special scenes await at 2, 4, 6 and 8 hearts.', icon: 'heart_charm' },
  { id: 'tut_lamps', when: { flag: 'journal_found' }, text: 'Lanterns you restore light the street lamps. Light them at dusk as the lamplighter.', icon: 'lantern' },
  { id: 'tut_bench', when: { energy: { lte: 40 } }, text: 'A bench is a fine place to sit and recover a little energy.', icon: 'heart_charm' },
];
