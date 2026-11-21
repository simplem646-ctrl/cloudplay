// Activity scenes harness on the REAL engine + UI + sim. Build:
//   node scripts/build.mjs --entry src/dev/activities_demo.js --out dist/dev/activities_demo.html
// Query: ?scene=shop|club_practice|job_cafe|rest|nap|jog  &seed=7 &energy=70 &money=120 &minute=600 &day=3 (season day; 1 = Monday)
//        shop: &shop=corner_mart|cafe_menu|...  &full=1 (bag full)
//        club_practice: &club=track|music|art|literature  &fallback=1 (force the built-in timing drill)  &xp=17
//        job_cafe: &first=0 (not the first shift)    rest/nap/jog: &storm=1  &napped=1
//        &live=1 runs in real time (keyboard).
// window.__act = { app, game, step(n), tap(action), scene(), result(), state }
import { createApp } from '../engine/index.js';
import { UICanvas } from '../ui/index.js';
import { audio } from '../audio/index.js';
import { bus } from '../core/bus.js';
import { createNewGame } from '../sim/state.js';
import { createSim } from '../sim/index.js';
import { openScene } from '../scenes/registry.js';
import { registerActivityScenes } from '../scenes/activities/index.js';
import { ITEMS } from '../data/items.js';

const q = new URLSearchParams(location.search);
const num = (k, d) => (q.has(k) ? Number(q.get(k)) : d);
const ui = new UICanvas();
const app = createApp({ container: document.getElementById('app'), ui, autoStart: q.has('live') });
app.game.audio = audio;
const which = q.get('scene') || 'shop';
const state = createNewGame({ seed: num('seed', 7) });
state.time.day = num('day', 3);
state.time.minute = num('minute', which === 'club_practice' ? 930 : which === 'job_cafe' ? 950 : 600);
state.player.energy = num('energy', 70);
state.player.money = num('money', 120);
if (which === 'club_practice') { state.school.club = q.get('club') || 'track'; state.school.clubXp = num('xp', 17); state.school.clubRank = 0; }
if (which === 'job_cafe' && q.get('first') === '0') { state.school.job = 'cafe'; state.school.jobShifts = 4; }
if (q.has('storm')) state.weather.today = 'storm';
if (q.has('napped')) state.daily.napped = true;
if (q.has('full')) ITEMS.slice(0, 60).forEach((it) => { state.inventory[it.id] = 1; });
app.game.sim = createSim(state, { bus });
registerActivityScenes();

const names = { shop: 'shop', club_practice: 'activity:club_practice', job_cafe: 'activity:job_cafe', rest: 'activity:rest', nap: 'activity:nap', jog: 'activity:jog' };
const params = which === 'shop' ? { shop: q.get('shop') || 'corner_mart' } : which === 'club_practice' && q.has('fallback') ? { forceFallback: true } : {};
let result = null;
openScene(app.game, names[which], params).then((r) => { result = r; });

const step = (n = 1) => app.step(n);
const tap = (a) => app.input.tap(a);
const scene = () => app.game.scenes.top;
window.__act = { app, game: app.game, step, tap, scene, result: () => result, state };
step(1);
