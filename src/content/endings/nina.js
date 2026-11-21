// Nina's romance slides (S2).
const P = { partner: 'nina' };
export default {
  slides: [
    { id: 'romance_nina_bell', group: 'romance', order: 5, when: { all: [P, { flag: 'main_bell_rung_with_nina' }] }, art: 'bell_night',
      lines: [`Nina sprinted the last hill and still beat him to the rope.`, `They rang the bell together. Her knee said nothing at all.`] },
    { id: 'romance_nina_base', group: 'romance', order: 10, when: P, art: 'school_dawn',
      lines: [`Nina took the state team's offer and runs for joy now.`, `Every dawn she texts a time. Never the fast ones first. The funny ones.`] },
    { id: 'romance_nina_saved', group: 'romance', order: 20, when: { all: [P, { flag: 'main_vote_saved' }] }, art: 'school_dusk',
      lines: [`Home on holidays, she races Theo from the harbor to the bakery.`, `She wins. He lets her think it is not on purpose.`] },
    { id: 'romance_nina_merged', group: 'romance', order: 20, when: { all: [P, { flag: 'main_vote_merged' }] }, art: 'harbor_dusk',
      lines: [`The school moved, but the track she ran on stayed in her legs.`, `Four hours between them. She says it is two, if she runs.`] },
  ],
};
