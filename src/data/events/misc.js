// Miscellaneous small events.
export default {
  misc_first_lamp: {
    id: 'misc_first_lamp', kind: 'misc', when: [{ lanterns: { gte: 1 } }, { notFlag: 'seen_misc_first_lamp' }, { area: 'town_square' }, { night: true }], priority: 30, once: true,
    script: [
      { setFlag: 'seen_misc_first_lamp' },
      { narrate: 'You stop in the square. A street lamp hums softly, and light spills over the cobbles for the first time in years.' },
      { say: 'player', text: 'It really works. It actually works.' },
      { toast: 'Tip: light repaired lamps at dusk as the lamplighter.' },
    ],
  },
};
