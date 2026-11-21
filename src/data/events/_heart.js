// Helper for heart events (internal, not part of the barrel). Later writers may replace the heart files entirely.
const ROMANCE = ['mira', 'willa', 'juno', 'rhea', 'celeste'];

/**
 * @param {string} npc
 * @param {2|4|6|8} n  hearts required
 * @param {{ title:string, when?:object[], area:string, at:string, npcAt?:string, steps:Array, music?:string, prior?:boolean }} o
 *  steps: [speaker, text, expr] tuples or raw script steps
 */
export function heartEvent(npc, n, o) {
  const id = `heart_${npc}_${n}`;
  const others = ROMANCE.filter((r) => r !== npc).map((r) => ({ flag: `${r}_dating` }));
  const when = [{ hearts: { npc, gte: n } }, { notFlag: `seen_${id}` }, ...(o.when || [])];
  if (n > 2) when.push({ flag: `seen_heart_${npc}_${n - 2}` });
  if (n >= 6) when.push({ not: { any: others } });
  const body = o.steps.map((s) => (Array.isArray(s) ? { say: s[0], text: s[1], expr: s[2] || 'neutral' } : s));
  const tail = [];
  if (n === 8) {
    tail.push({ ask: [
      { text: 'I would like to be with you.', then: [
        { setFlag: `${npc}_dating` }, { affection: npc, amount: 100 },
        { say: npc, text: o.yes || 'I was hoping you would say that. Yes. Of course, yes.', expr: 'happy' },
        { emote: npc, icon: 'heart' }, { effect: 'hearts' },
      ] },
      { text: 'I need a little more time.', then: [
        { say: npc, text: o.no || 'Okay. I understand. I am not going anywhere.', expr: 'shy' },
      ] },
    ], prompt: o.prompt || 'How do you feel?', speaker: npc });
  }
  return {
    id, kind: 'heart', npc, priority: 60 + n, once: true, music: o.music || 'romance',
    when: [...when, { area: o.area }],
    script: [
      { setFlag: `seen_${id}` }, { letterbox: true }, { fade: 'out', ms: 300 },
      { area: o.area, at: o.at }, { place: 'player', at: o.at, facing: 's' }, { place: npc, at: o.npcAt || o.at, area: o.area, facing: 'player' },
      { fade: 'in', ms: 500 },
      ...body, ...tail,
      { affection: npc, amount: n === 8 ? 20 : 40 },
      { letterbox: false },
    ],
  };
}

export const events = (list) => Object.fromEntries(list.map((e) => [e.id, e]));
