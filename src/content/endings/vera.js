// Vera's romance slides (S3).
const P = { partner: 'vera' };
export default {
  slides: [
    { id: 'romance_vera_bell', group: 'romance', order: 5, when: { all: [P, { flag: 'main_bell_rung_with_vera' }] }, art: 'bell_night',
      lines: [`Vera listened to the bell like she was tuning to it.`, `It was a perfect A-flat, she said. She said it quietly. For him.`] },
    { id: 'romance_vera_base', group: 'romance', order: 10, when: P, art: 'school_dusk',
      lines: [`Vera played the whole piece, past bar sixteen, for two thousand people.`, `Theo sat in the back row. He did not breathe. She knew exactly where.`] },
    { id: 'romance_vera_saved', group: 'romance', order: 20, when: { all: [P, { flag: 'main_vote_saved' }] }, art: 'school_dawn',
      lines: [`Home on holidays, she plays the school's new grand with the door open.`, `Biscuit sleeps on the lid. He claims it as a salary.`] },
    { id: 'romance_vera_merged', group: 'romance', order: 20, when: { all: [P, { flag: 'main_vote_merged' }] }, art: 'harbor_dusk',
      lines: [`The school merged. She opened the new hall's piano with one line of the old song.`, `Everyone in the town knew it. Nobody told her they did.`] },
  ],
};
