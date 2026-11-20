// Shared helpers for the main-story and festival events (story workstream S1).
// This module has NO default export on purpose: the registry picks up every file in
// src/content/events/, and the validator reads `default || events || []`, so a helper-only
// module contributes zero events. Do not add a default export or a named `events` export here.

import {
  think, choice, opt, iff, fade, warp, say, setFlag, friend, any,
} from '../../sim/script_dsl.js';

export const H = (npc, n) => ({ hearts: [npc, '>=', n] });

/** Scene opener: fade out, warp, stage the actors, fade in. */
export const open = (map, at, actors = []) => [
  fade('out', 400),
  warp(map, at),
  ...actors,
  fade('in', 500),
];

export const HEROINES = ['nina', 'elise', 'clara', 'mari', 'vera'];
const NAMES = { nina: 'Nina', elise: 'Elise', clara: 'Clara', mari: 'Mari', vera: 'Vera' };

/** Flag name recorded when Theo picks whom to spend a festival evening with. */
export const withFlag = (festId, year, who) => `fest_${festId}_y${year}_with_${who}`;

/**
 * The festival "evening with" choice, for one year.
 * cfg = { prompt, nina, elise, clara, mari, vera: think lines (where Theo finds them),
 *         friends: (year) => ops, alone: ops }
 * Heroines are offered only at >= 3 hearts. Sets fest_<festId>_y<year>_with_<id|friends|alone>.
 */
export function evening(festId, year, cfg) {
  const heroOpt = (id) => opt(`Find ${NAMES[id]}`, [think(cfg[id]), setFlag(withFlag(festId, year, id))], H(id, 3));
  const rest = choice([
    heroOpt('mari'),
    heroOpt('vera'),
    opt('Stick with the guys', [...cfg.friends(year), setFlag(withFlag(festId, year, 'friends'))]),
    opt('Take a quiet moment alone', [...cfg.alone, setFlag(withFlag(festId, year, 'alone'))]),
  ]);
  return [
    think(cfg.prompt),
    iff(
      any(H('nina', 3), H('elise', 3), H('clara', 3)),
      [choice([heroOpt('nina'), heroOpt('elise'), heroOpt('clara'), opt('Someone else...', [rest])])],
      [rest],
    ),
  ];
}

/** The evening choice for whichever year it is (three year branches). */
export const eveningAllYears = (festId, cfg) => [1, 2, 3].map((y) => iff({ year: y }, evening(festId, y, cfg)));

/** Small reusable friends beat: Jules, Dante and Owen, + Bruno (Y1) / Kit (Y2+). */
export function friendsBeat(year, jules, dante, owen, extra = {}) {
  const ops = [
    say('jules', 'happy', jules),
    say('dante', 'smug', dante),
    say('owen', 'neutral', owen),
    friend('jules', 2), friend('dante', 2), friend('owen', 2),
  ];
  if (year === 1) {
    ops.push(say('bruno', 'happy', extra.bruno || "Mind if I crash this, kids? Seniors get lonely at festivals. It's a known condition."), friend('bruno', 2));
  } else {
    ops.push(say('kit', 'happy', extra.kit || 'Hartley-senpai! Wait for me! I brought snacks! I dropped half of them! The good half!'), friend('kit', 2));
  }
  return ops;
}
