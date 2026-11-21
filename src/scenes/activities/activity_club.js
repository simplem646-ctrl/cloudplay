// Scene 'activity:club_practice': params {} -> { minutes, energy, gains, rank, medal?, score? }.
// Guard (canPractice) -> intro card -> the club's mini-game (when registered) or the built-in timing fallback -> practice() -> result card -> clock.
// `rank` is the club rank (0-5) AFTER the practice; `medal` is the mini-game medal. Cancelled mini-game = no practice (minutes 0).
// Pure helpers (Node-testable): RANK_NAMES, xpProgress, makeTimingRounds, markerPos, timingRoundScore, timingScore, clubResultLines.
import { drawText, drawWindow, drawBar, THEME } from '../../ui/index.js';
import { RNG } from '../../core/rng.js';
import { canPractice, practice, clubGame, clubName, RANK_XP } from '../../sim/clubs.js';
import { hasScene, openScene } from '../registry.js';
import { drawField, drawClassroom } from '../academics/backdrops.js';
import { AcademicScene, drawCard } from '../academics/common.js';
import { rankFor, clampScore, RANK_COMMENT } from './logic.js';
import { guardLine } from './activity_rest.js';

export const RANK_NAMES = ['Newcomer', 'Member', 'Regular', 'Veteran', 'Ace', 'Captain'];

/** XP bar for a club XP total: { rank, cur, need, frac, max } (need = XP span of this rank). */
export function xpProgress(xp) {
  let rank = 0;
  RANK_XP.forEach((n, i) => { if (xp >= n) rank = i; });
  if (rank >= RANK_XP.length - 1) return { rank, cur: 1, need: 1, frac: 1, max: true };
  const base = RANK_XP[rank], need = RANK_XP[rank + 1] - base;
  return { rank, cur: xp - base, need, frac: Math.max(0, Math.min(1, (xp - base) / need)), max: false };
}

// ------------------------------------------------------------------ fallback timing mini-game
export const TIMING = { rounds: 5, roundSeconds: 3, feedback: 0.7 };

/** Triangle wave 0..1..0 with period `1/speed` seconds. */
export const markerPos = (t, speed, phase = 0) => {
  const x = (t * speed + phase) % 2;
  const v = x < 0 ? x + 2 : x;
  return v <= 1 ? v : 2 - v;
};

/** Deterministic rounds: green zone centre/half-width, marker speed (sweeps/s*2) and start phase. difficulty 0..1 narrows zones. */
export function makeTimingRounds(seed = 1, difficulty = 0.45) {
  const rng = new RNG(seed);
  const out = [];
  for (let i = 0; i < TIMING.rounds; i++) {
    const half = 0.1 - difficulty * 0.04 - i * 0.004;
    out.push({ center: +(0.2 + rng.next() * 0.6).toFixed(3), half: +half.toFixed(3), speed: +(0.75 + difficulty * 0.5 + i * 0.1 + rng.next() * 0.1).toFixed(3), phase: +(rng.next() * 2).toFixed(3) });
  }
  return out;
}

/** 0..100 for one press: inside the zone 70-100 (closer = better), near miss up to 35, otherwise 0. null press (timeout) = 0. */
export function timingRoundScore(pos, center, half) {
  if (pos === null || pos === undefined) return 0;
  const d = Math.abs(pos - center);
  if (d <= half) return Math.round(70 + 30 * (1 - d / half));
  return Math.round(Math.max(0, 35 * (1 - (d - half) / 0.3)));
}

/** Mean of the round scores -> { score, rank, hits }. `presses`: marker positions (or null) per round. */
export function timingScore(presses, rounds) {
  let sum = 0, hits = 0;
  rounds.forEach((r, i) => {
    const p = presses[i] === undefined ? null : presses[i];
    sum += timingRoundScore(p, r.center, r.half);
    if (p !== null && Math.abs(p - r.center) <= r.half) hits++;
  });
  const score = clampScore(sum / rounds.length);
  return { score, rank: rankFor(score), hits };
}

/** Result card lines for a finished practice. */
export function clubResultLines(club, res, score, medal) {
  const lines = [];
  if (medal) lines.push({ text: `${medal === 'none' ? 'No medal' : `${medal[0].toUpperCase()}${medal.slice(1)} medal`}   Score ${score}`, color: THEME.cream });
  lines.push({ text: `${clubName(club)} XP +${res.xp}`, color: THEME.green });
  if (res.rankUp) lines.push({ text: `Rank up! ${RANK_NAMES[res.rank]}`, color: THEME.gold });
  for (const [k, v] of Object.entries(res.traits || {})) lines.push({ text: `${k[0].toUpperCase()}${k.slice(1)} +${v}`, color: THEME.gold });
  lines.push({ text: `Energy ${res.energy}   Time 2 h`, color: THEME.cream });
  return lines;
}

const GAME_BG = { track: 'field', soccer: 'field' };

export class ClubPractice extends AcademicScene {
  constructor(game, params = {}) {
    super(game, params);
    this.res = null;
    this.rounds = [];
    this.presses = [];
    this.medal = null;
    this.score = 0;
  }
  get club() { return this.state.school.club; }

  enter() {
    this.minute0 = this.state.time.minute;
    const can = canPractice(this.state);
    if (!can.ok) { this.guardText = guardLine('club', can); this.sfx('error'); this.setMode('guard'); return; }
    this.setMode('intro');
  }

  popEmpty() { this.finish({ minutes: 0, energy: 0, gains: {}, rank: this.state.school.clubRank }); }

  async launch() {
    const id = clubGame(this.club);
    if (id && !this.params.forceFallback && hasScene(`minigame:${id}`)) {
      this.setMode('waiting');
      const fitness = (this.state.player.traits && this.state.player.traits.fitness) || 20;
      const out = await openScene(this.game, `minigame:${id}`, { context: 'club', fitness, seed: (this.state.time.absDay || 1) * 7 + 3 });
      if (this.finished) return;
      if (!out || out.cancelled || out.missing || typeof out.score !== 'number') { this.popEmpty(); return; }
      this.conclude(out.score, out.rank || rankFor(out.score));
    } else {
      this.rounds = makeTimingRounds((this.state.meta.seed || 1) + (this.state.time.absDay || 0), 0.45);
      this.presses = [];
      this.round = 0;
      this.setMode('fb_intro');
    }
  }

  conclude(score, medal) {
    this.score = score; this.medal = medal;
    this.res = practice(this.state, { score, rank: medal }, { advanceClock: false });
    if (!this.res.ok) { this.guardText = guardLine('club', this.res); this.setMode('guard'); return; }
    this.sfx(this.res.rankUp ? 'cheer' : medal === 'none' ? 'fail' : 'success');
    this.setMode('result');
  }

  // fallback play
  startRound() { this.round = this.presses.length; this.rt = 0; this.locked = null; this.setMode('fb_play'); }
  curPos() { const r = this.rounds[this.round]; return markerPos(this.rt, r.speed, r.phase); }

  step(dt, input) {
    const m = this.mode;
    if (m === 'guard') {
      if (this.mt > 0.3 && (input.pressed('confirm') || input.pressed('cancel'))) this.popEmpty();
    } else if (m === 'intro') {
      if (input.pressed('confirm')) { this.sfx('confirm'); this.launch(); } else if (input.pressed('cancel')) { this.sfx('cancel'); this.popEmpty(); }
    } else if (m === 'fb_intro') {
      if (input.pressed('confirm')) { this.sfx('confirm'); this.setMode('fb_count'); } else if (input.pressed('cancel')) this.popEmpty();
    } else if (m === 'fb_count') {
      if (Math.floor((this.mt - dt) / 0.6) !== Math.floor(this.mt / 0.6)) this.sfx('cursor');
      if (this.mt >= 1.8) { this.sfx('whistle'); this.startRound(); }
    } else if (m === 'fb_play') {
      this.rt += dt;
      const r = this.rounds[this.round];
      if (this.locked === null) {
        if (input.pressed('confirm')) {
          this.locked = this.curPos(); this.lockT = this.rt;
          const s = timingRoundScore(this.locked, r.center, r.half);
          this.sfx(s >= 70 ? 'correct' : s > 0 ? 'blip' : 'wrong');
        } else if (this.rt >= TIMING.roundSeconds) { this.locked = -1; this.lockT = this.rt; this.sfx('wrong'); }
      } else if (this.rt - this.lockT >= TIMING.feedback) {
        this.presses.push(this.locked === -1 ? null : this.locked);
        if (this.presses.length >= TIMING.rounds) {
          const s = timingScore(this.presses, this.rounds);
          this.conclude(s.score, s.rank);
        } else this.startRound();
      }
    } else if (m === 'result') {
      if (this.mt > 0.5 && (input.pressed('confirm') || input.pressed('cancel'))) {
        const r = this.res;
        this.advanceClock(r.minutes);
        this.finish({ minutes: r.minutes, energy: r.energy, gains: r.traits || {}, rank: r.rank, medal: this.medal, score: this.score });
      }
    }
  }

  drawBack(ctx) {
    const g = clubGame(this.club);
    if (GAME_BG[this.club]) drawField(ctx, { t: this.t });
    else drawClassroom(ctx, { subject: this.club === 'art' ? 'art' : 'literature', t: this.t });
    void g;
  }

  drawIntro(ctx) {
    const p = xpProgress(this.state.school.clubXp);
    const rank = this.state.school.clubRank;
    drawWindow(ctx, 40, 44, 240, 132, 'menu');
    drawText(ctx, clubName(this.club), 160, 54, { color: THEME.gold, shadow: THEME.navyDeep, align: 'center', scale: 2 });
    drawText(ctx, `Rank ${rank}: ${RANK_NAMES[rank]}`, 160, 76, { color: '#ffffff', shadow: THEME.navyDeep, align: 'center' });
    drawBar(ctx, 80, 92, 160, 9, p.frac, 1, { fill: THEME.green });
    drawText(ctx, p.max ? 'Top rank reached' : `XP ${p.cur} / ${p.need} to next rank`, 160, 105, { color: THEME.cream, shadow: THEME.navyDeep, align: 'center' });
    drawText(ctx, `Energy ${Math.round(this.state.player.energy)}`, 160, 122, { color: THEME.cream, shadow: THEME.navyDeep, align: 'center' });
    drawText(ctx, 'Practice takes 2 hours and 20 energy.', 160, 136, { color: THEME.grey, shadow: THEME.navyDeep, align: 'center' });
    drawText(ctx, 'Z: start practice    X: not now', 160, 156, { color: THEME.cream, shadow: THEME.navyDeep, align: 'center' });
  }

  drawTiming(ctx, playing) {
    ctx.fillStyle = '#2b3560'; ctx.fillRect(0, 0, 320, 240);
    drawText(ctx, 'Timing drill', 160, 20, { color: THEME.gold, shadow: THEME.navyDeep, align: 'center', scale: 2 });
    const done = this.presses.length;
    for (let i = 0; i < TIMING.rounds; i++) {
      const x = 120 + i * 20, p = this.presses[i];
      const sc = i < done ? timingRoundScore(p, this.rounds[i].center, this.rounds[i].half) : -1;
      ctx.fillStyle = sc < 0 ? '#4a4f6e' : sc >= 70 ? THEME.green : sc > 0 ? THEME.gold : THEME.red;
      ctx.fillRect(x, 50, 12, 12);
      ctx.fillStyle = THEME.navyDeep; ctx.fillRect(x + 3, 53, 6, 6); ctx.fillStyle = i === this.round && playing ? '#ffffff' : ctx.fillStyle;
    }
    const bx = 30, bw = 260, by = 112;
    drawWindow(ctx, bx - 6, by - 14, bw + 12, 44, 'menu');
    ctx.fillStyle = '#141a33'; ctx.fillRect(bx, by, bw, 16);
    if (playing) {
      const r = this.rounds[this.round];
      ctx.fillStyle = '#3f9a4e'; ctx.fillRect(bx + Math.round((r.center - r.half) * bw), by, Math.round(r.half * 2 * bw), 16);
      ctx.fillStyle = '#7fd36a'; ctx.fillRect(bx + Math.round(r.center * bw) - 1, by, 2, 16);
      const pos = this.locked !== null && this.locked !== -1 ? this.locked : this.locked === -1 ? 0 : this.curPos();
      const mx = bx + Math.round(pos * bw);
      ctx.fillStyle = this.locked === null ? '#ffffff' : THEME.gold; ctx.fillRect(mx - 1, by - 8, 3, 32);
      ctx.fillRect(mx - 3, by - 10, 7, 3);
      if (this.locked !== null) {
        const s = this.locked === -1 ? 0 : timingRoundScore(this.locked, r.center, r.half);
        drawText(ctx, this.locked === -1 ? 'Too slow!' : s >= 90 ? 'Perfect!' : s >= 70 ? 'Good!' : s > 0 ? 'Close...' : 'Miss', 160, 156, { color: s >= 70 ? THEME.green : THEME.cream, shadow: THEME.navyDeep, align: 'center', scale: 2 });
      } else drawBar(ctx, 100, 180, 120, 5, 1 - this.rt / TIMING.roundSeconds, 1, { fill: THEME.blue });
      drawText(ctx, `Press Z when the marker is in the green zone  (${Math.min(done + 1, TIMING.rounds)}/${TIMING.rounds})`, 160, 206, { color: THEME.cream, shadow: THEME.navyDeep, align: 'center' });
    }
  }

  draw(ui) {
    const ctx = ui.ctx, m = this.mode;
    if (m === 'fb_play' || m === 'fb_count') this.drawTiming(ctx, m === 'fb_play');
    else this.drawBack(ctx);
    if (m === 'intro') this.drawIntro(ctx);
    if (m === 'guard') {
      ctx.fillStyle = 'rgba(12,14,34,0.45)'; ctx.fillRect(0, 0, 320, 240);
      drawCard(ctx, { x: 40, y: 80, w: 240, title: 'Club practice', lines: [{ text: this.guardText, color: '#ffffff' }], t: this.t });
    }
    if (m === 'fb_intro') {
      drawCard(ctx, { x: 30, y: 44, w: 260, title: 'Timing drill', lines: [
        { text: `No special drill for the ${clubName(this.club)} yet, so the coach sets a timing exercise.`, color: '#ffffff' }, { gap: true },
        { text: 'A marker sweeps the bar. Press Z when it is inside the green zone.', color: THEME.cream },
        { text: `${TIMING.rounds} tries, about ${TIMING.rounds * TIMING.roundSeconds} seconds.`, color: THEME.cream },
      ], footer: 'Press Z to start', t: this.t });
    }
    if (m === 'fb_count') {
      const n = 3 - Math.floor(this.mt / 0.6);
      drawText(ctx, n >= 1 ? String(n) : 'GO!', 160, 160, { color: n >= 1 ? '#ffffff' : THEME.gold, shadow: THEME.navyDeep, align: 'center', scale: 4 });
    }
    if (m === 'result') {
      ctx.fillStyle = 'rgba(12,14,34,0.55)'; ctx.fillRect(0, 0, 320, 240);
      const comment = RANK_COMMENT[this.medal][Math.abs(this.score) % 3];
      drawCard(ctx, { x: 40, y: 40, w: 240, title: this.res.rankUp ? 'Rank up!' : 'Practice done', lines: [...clubResultLines(this.club, this.res, this.score, this.medal), { gap: true }, { text: comment, color: THEME.gold }], t: this.t });
    }
  }
}
