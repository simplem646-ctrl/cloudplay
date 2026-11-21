// Mari's romance slides (S3).
const P = { partner: 'mari' };
export default {
  slides: [
    { id: 'romance_mari_bell', group: 'romance', order: 5, when: { all: [P, { flag: 'main_bell_rung_with_mari' }] }, art: 'bell_night',
      lines: [`Mari rang the bell with paint still drying on her sleeve.`, `She said the sound was a colour. She would not say which. She is still working on it.`] },
    { id: 'romance_mari_base', group: 'romance', order: 10, when: P, art: 'school_dusk',
      lines: [`Mari went to the academy. Grandma Rosa's cactus went with her.`, `Every Friday a postcard arrives, mostly blue. Theo has run out of wall.`] },
    { id: 'romance_mari_saved', group: 'romance', order: 20, when: { all: [P, { flag: 'main_vote_saved' }] }, art: 'harbor_dusk',
      lines: [`The harbor wall now holds her mural: the bell, the tide, a heron, and two small figures.`, `Children touch the blue sleeve for luck. It is not rubbing off.`] },
    { id: 'romance_mari_merged', group: 'romance', order: 20, when: { all: [P, { flag: 'main_vote_merged' }] }, art: 'harbor_dawn',
      lines: [`The school merged, but the harbor wall still wears her bell, bright as the day it rang.`, `She says a town can move house if it keeps its colours.`] },
  ],
};
