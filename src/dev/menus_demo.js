// Menu screens harness on the REAL engine + UI + sim. Build: node scripts/build.mjs --entry src/dev/menus_demo.js --out dist/dev/menus_demo.html
// Query: ?scene=pause|sleep|save|load|settings|ending|credits|status|items|friends|journal|calendar|records  &seed=7  &live=1
// window.__menu = { step(n), tap(action), scene(), result(), game, open(name, params) }
import { createApp, Scene } from '../engine/index.js';
import { UICanvas, drawText, THEME } from '../ui/index.js';
import { audio } from '../audio/index.js';
import { createSim } from '../sim/index.js';
import { createNewGame } from '../sim/state.js';
import { registerScene, openScene } from '../scenes/registry.js';
import { registerMenuScenes, startDayTracking, applySettings } from '../scenes/menus/index.js';

const q = new URLSearchParams(location.search);
const ui = new UICanvas();
const app = createApp({ container: document.getElementById('app'), ui, autoStart: q.has('live') });
const game = app.game;
game.audio = audio;
ui.configure({ sfx: (n) => audio.sfx(n) });

const state = createNewGame({ seed: Number(q.get('seed') || 7) });
const sim = createSim(state, { bus: game.bus });
game.sim = sim;
applySettings(game);

// ---- demo data: a mid-game Theo ----
Object.assign(state.time, { year: 1, season: 'spring', day: 14, absDay: 13, minute: 15 * 60 + 5 });
const rel = state.relationships;
for (const [id, pts] of Object.entries({ nina: 74, elise: 35, clara: 22, mari: 12, jules: 58, dante: 41, owen: 20, bruno: 15, kit: 30, roz: 60, ms_okafor: 18 })) { if (rel[id]) { rel[id].met = true; rel[id].friendship = pts; } }
state.romance.partner = 'nina';
Object.assign(state.player, { money: 342, energy: 64 });
Object.assign(state.player.subjects, { math: 42, literature: 61, science: 35, history: 28, art: 70, pe: 55 });
Object.assign(state.player.traits, { fitness: 48, charm: 33, creativity: 52 });
Object.assign(state.school, { club: 'track', clubRank: 2, job: 'cafe', jobShifts: 7, spirit: 36, average: 71, standing: 'good' });
state.school.exams = {
  Y1_midterm1: { scores: { math: 72, literature: 80, science: 64, history: 58, art: 90, pe: 85 }, total: 449, average: 74.8, rank: 6 },
};
state.school.reportCards = [{ year: 1, examId: 'midterm1', average: 74.8, rank: 6, standing: 'good' }];
state.school.attendance = { present: 38, late: 3, absent: 1, today: {} };
state.quests = { welcome_to_bellhaven: { state: 'active', startedAbsDay: 0, notes: ['Find the school bell.'] }, lost_cat: { state: 'complete', startedAbsDay: 4, notes: [] } };
Object.assign(state.inventory, { bread: 3, riceball: 2, sandwich: 1, coffee: 2, cake_slice: 1, tea: 4 });
state.stats = { daysSkippedClass: 1, examsPassed: 1, miniGameWins: 4 };

// stub title so "return to title" is visible
class TitleStub extends Scene {
  update() {} draw(u) { u.ctx.fillStyle = '#10152e'; u.ctx.fillRect(0, 0, 320, 240); drawText(u.ctx, 'TITLE SCREEN (stub)', 160, 110, { color: THEME.gold, align: 'center', scale: 2 }); }
}
registerScene('title', (g) => new TitleStub(g));
registerMenuScenes();
startDayTracking(game);

const DEMO_SLIDES = [
  { id: 'a', group: 'main', title: 'The Bell Still Rings', lines: ['Bellhaven High stays open, and the old bell keeps its place on Lantern Hill.'], mood: 'good', art: 'bell_night' },
  { id: 'b', group: 'romance', lines: ['Nina waits at the gate, as she always does.', 'Some mornings are worth running for.'], mood: 'bittersweet', art: 'school_dawn' },
];
const NAMES = { pause: 'pause', sleep: 'sleep', save: 'save_menu', load: 'load_menu' };
let result = null, opening = null;

function open(name, params) {
  result = null;
  opening = openScene(game, name, params).then((r) => { result = r; });
}
async function sleepFlow() {
  sim.relationships.addFriendship('nina', 6); sim.relationships.addFriendship('jules', 3);
  sim.player.addMoney(25); sim.player.addStat('math', 4);
  state.events.seen.demo_event = { count: 1, lastAbsDay: 13 };
  state.time.minute = 22 * 60;
  const summary = sim.clock.sleep();
  open('sleep', { summary });
}
function start() {
  const name = q.get('scene') || 'pause';
  if (name === 'sleep') return sleepFlow();
  if (name === 'ending') return open('ending', { slides: DEMO_SLIDES });
  if (name === 'save' || name === 'load') { sim.save.write(1); return open(NAMES[name]); }
  if (name === 'credits') return open('credits');
  open(NAMES[name] || name, q.get('tab') ? { tab: q.get('tab') } : {});
}
start();

const step = (n = 1) => app.step(n);
const tap = (a) => app.input.tap(a);
const scene = () => game.scenes.top;
window.__menu = { app, game, step, tap, scene, result: () => result, open, sleepFlow, opening: () => opening };
step(2);
