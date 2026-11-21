// Elise's romance slides (S2).
const P = { partner: 'elise' };
export default {
  slides: [
    { id: 'romance_elise_bell', group: 'romance', order: 5, when: { all: [P, { flag: 'main_bell_rung_with_elise' }] }, art: 'bell_night',
      lines: [`Elise rang the bell with both hands and did not flinch at the sound.`, `Afterwards she whispered the word for it: bell-hush.`] },
    { id: 'romance_elise_base', group: 'romance', order: 10, when: P, art: 'classroom_sunset',
      lines: [`Elise's novel is finished, bound, and has a butler.`, `On Sundays at nine she reads to Theo. Louder every week.`] },
    { id: 'romance_elise_saved', group: 'romance', order: 20, when: { all: [P, { flag: 'main_vote_saved' }] }, art: 'school_dusk',
      lines: [`The library nook is still hers. A first-year sits there now, reading.`, `Elise left a postcard in the window seat: "Take your time."`] },
    { id: 'romance_elise_merged', group: 'romance', order: 20, when: { all: [P, { flag: 'main_vote_merged' }] }, art: 'harbor_dusk',
      lines: [`The nook moved to a box in her suitcase and came out in a new city.`, `She still writes the word for what comes after a bell.`] },
  ],
};
