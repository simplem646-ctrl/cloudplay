// Part-time jobs. pay.base / pay.bonus semantics: see DESIGN section 5.
const SIX_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default {
  bakery_shift: {
    id: 'bakery_shift', name: 'Bakery Helper', boss: 'rosalind', area: 'bakery', spot: 'job_bakery',
    days: SIX_DAYS, from: '07:00', to: '11:00', energy: 20, kind: 'kneading', pay: { base: 80, bonus: 60 },
    desc: 'Knead dough at Rye & Rose. Steady hands earn a bonus.',
    intro: [
      { say: 'rosalind', text: 'You want to help? Good. Wash your hands, tie an apron and do not drop anything.', expr: 'neutral' },
      { say: 'mira', text: 'Do not worry, {player}! I trip over everything on my first day too. Every day, actually.', expr: 'laugh' },
      { say: 'rosalind', text: 'Press, fold, turn. Find the rhythm and the dough does the rest.', expr: 'happy' },
    ],
    done: [
      { say: 'rosalind', text: 'Not bad at all. The loaves have good shape today.', expr: 'happy' },
      { say: 'rosalind', text: 'Take your pay, and a roll for the road. Do not argue.', expr: 'neutral' },
    ],
  },
  parcel_run: {
    id: 'parcel_run', name: 'Parcel Runner', boss: 'theo', area: 'general_store', spot: 'post_counter',
    days: SIX_DAYS, from: '13:00', to: '17:00', energy: 15, kind: 'delivery', pay: { base: 25, bonus: 30 },
    desc: 'Deliver parcels around town. Be quick, and remember where people like to be.',
    intro: [
      { say: 'theo', text: 'Parcel run! Great! I am late already. These go to people all over town.', expr: 'happy' },
      { say: 'theo', text: 'Tip: nobody stays in one place. Think about what they do and when they do it.', expr: 'thinking' },
      { say: 'theo', text: 'Fast delivery means a bonus. Slow delivery means a sad Theo. Go, go, go!', expr: 'laugh' },
    ],
    done: [
      { say: 'theo', text: 'Every parcel delivered? You are a legend, {player}. A slightly sweaty legend.', expr: 'laugh' },
      { say: 'theo', text: 'Here is your pay. And if you hear any gossip on the way, tell me first!', expr: 'smug' },
    ],
  },
  lamplighter: {
    id: 'lamplighter', name: 'Lamplighter', boss: 'odell', area: 'town_hall', spot: 'job_lamplighter',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'], from: '17:30', to: '19:30', energy: 10, kind: 'lamplighter', pay: { base: 6, bonus: 40 },
    desc: 'Light every repaired street lamp at dusk. Light them all for a bonus.',
    intro: [
      { say: 'odell', text: 'Ah, the lamplighter! Tobias did this every dusk for forty years. Now it is your turn.', expr: 'happy' },
      { say: 'odell', text: 'Light each mended lamp on your rounds. Lit lamps stay glowing all night, you know.', expr: 'neutral' },
      { say: 'odell', text: 'It is a bright idea, if I may say so. Ha! Sorry. Off you go.', expr: 'laugh' },
    ],
    done: [
      { say: 'odell', text: 'Lovely work! The town looks warmer already.', expr: 'happy' },
      { say: 'odell', text: 'Tobias would be proud. I am proud. Here is your pay, my boy.', expr: 'sad' },
    ],
  },
};
