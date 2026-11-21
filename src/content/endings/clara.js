// Clara's romance slides (S3).
const P = { partner: 'clara' };
export default {
  slides: [
    { id: 'romance_clara_bell', group: 'romance', order: 5, when: { all: [P, { flag: 'main_bell_rung_with_clara' }] }, art: 'bell_night',
      lines: [`Clara did not take the stage. She stood at the back and counted the strokes.`, `Thirteen. She said it was the only number she did not correct.`] },
    { id: 'romance_clara_base', group: 'romance', order: 10, when: P, art: 'school_dusk',
      lines: [`Clara left first place behind and took up a telescope instead.`, `Her letters arrive weekly, in ink, with footnotes. Some of the footnotes are hearts.`] },
    { id: 'romance_clara_saved', group: 'romance', order: 20, when: { all: [P, { flag: 'main_vote_saved' }] }, art: 'school_dawn',
      lines: [`The school stayed, and Mrs. Voss hung Clara's hand-drawn star map in the board room.`, `She told no one it was there. Everyone knew by Tuesday.`] },
    { id: 'romance_clara_merged', group: 'romance', order: 20, when: { all: [P, { flag: 'main_vote_merged' }] }, art: 'harbor_dusk',
      lines: [`The school merged, and Clara drew the old hill on her chart as a constellation.`, `She named it for the one thing she says cannot be ranked: home.`] },
  ],
};
