// Prologue: Spring 1, morning. Odell meets the player on Brook Lane.
export default {
  prologue: {
    id: 'prologue', kind: 'story', when: [{ notFlag: 'prologue_done' }, { area: 'brook_lane' }], priority: 100, once: true, music: 'prologue',
    script: [
      { letterbox: true },
      { area: 'brook_lane', at: 'cottage_front' },
      { place: 'player', at: 'cottage_front', facing: 's' },
      { place: 'odell', at: 'mailbox_spot', facing: 'w' },
      { fade: 'in', ms: 800 },
      { narrate: 'The wagon rattles away down Brook Lane. A small cottage waits under a patched roof, and a round man in tweed waves his hat.' },
      { move: 'odell', to: 'cottage_front', speed: 'walk', wait: true },
      { face: 'odell', toward: 'player' },
      { say: 'odell', text: "Ah, you must be {player}! Welcome to Lanternbrook! I'm Odell Hartwell, the mayor. And your landlord. Ha!", expr: 'happy' },
      { say: 'odell', text: "This is the Old Lamplighter's Cottage. It creaks, it leaks a little, but it has a good heart.", expr: 'neutral' },
      { giveItem: 'cottage_key' },
      { say: 'odell', text: 'Here is your key, a purse of {money} coins and a map, so you do not wander into the sea.', expr: 'laugh' },
      { giveItem: 'town_map' },
      { say: 'odell', text: 'Tobias Wren lived here. He lit every lamp in town at dusk. Since he passed, the lanterns have gone dark.', expr: 'sad' },
      { say: 'odell', text: 'The Lantern Festival stopped too. But that is a long story. Say hello to people first. Start with the square.', expr: 'neutral' },
      { ask: [
        { text: 'I will do my best.', then: [{ say: 'odell', text: 'That is all anyone can ask! Off you go, my boy.', expr: 'happy' }] },
        { text: 'Why are the lanterns dark?', then: [{ say: 'odell', text: 'Nobody has had the heart, or the know-how, to mend them. Perhaps you will. But there is no rush.', expr: 'sad' }] },
      ] },
      { setFlag: 'prologue_done' }, { setFlag: 'seen_prologue' },
      { startQuest: 't_meet_town' }, { startQuest: 'm1_arrival' },
      { toast: 'New quests: Say Hello to Lanternbrook, A New Chapter' },
      { move: 'odell', to: 'mailbox_spot', speed: 'walk' },
      { letterbox: false },
    ],
  },
};
