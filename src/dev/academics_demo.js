// Academic scenes harness on the REAL engine + UI + sim. Build:
//   node scripts/build.mjs --entry src/dev/academics_demo.js --out dist/dev/academics_demo.html
// Query: ?scene=class|exam|report_card|study_home|study_library  &seed=7 &year=1 &subject=math &energy=80 &knowledge=30
//        class: &late=1 &popquiz=1 &room=school_field &period=1      exam: &examId=midterm1 &subject=math &day=0
//        report_card: &avg=88 (class average to fake)      study: &remedial=1 &hours=2 &minute=840 &books=1
//        &live=1 runs in real time (keyboard).
// window.__ac = { app, game, step(n), tap(action), scene(), result() }
import { createApp } from '../engine/index.js';
import { UICanvas } from '../ui/index.js';
import { audio } from '../audio/index.js';
import { bus } from '../core/bus.js';
import { SUBJECTS } from '../core/constants.js';
import { createNewGame } from '../sim/state.js';
import { createSim } from '../sim/index.js';
import { processResults, examKey } from '../sim/exams.js';
import { openScene } from '../scenes/registry.js';
import { registerActivityScenes } from '../scenes/activities/index.js';
import { registerAcademicScenes } from '../scenes/academics/index.js';

const q = new URLSearchParams(location.search);
const num = (k, d) => (q.has(k) ? Number(q.get(k)) : d);
const ui = new UICanvas();
const app = createApp({ container: document.getElementById('app'), ui, autoStart: q.has('live') });
app.game.audio = audio;
const state = createNewGame({ seed: num('seed', 7) });
state.time.year = num('year', 1);
state.player.energy = num('energy', 80);
for (const s of SUBJECTS) state.player.subjects[s] = num('knowledge', 30);
if (q.has('books')) state.inventory.textbook = 1;
if (q.has('minute')) state.time.minute = num('minute', 600);
app.game.sim = createSim(state, { bus });
registerActivityScenes();
registerAcademicScenes();

const which = q.get('scene') || 'class';
const subject = q.get('subject') || 'math';
let params = {};
let name = which;
if (which === 'class') {
  params = { period: num('period', 1), subject, late: q.has('late'), minutes: 40, popQuiz: q.has('popquiz'), room: q.get('room') || 'school_classroom' };
} else if (which === 'exam') {
  state.time.season = 'spring'; state.time.day = 22;
  params = { examId: q.get('examId') || 'midterm1', key: examKey(state.time.year, q.get('examId') || 'midterm1'), subject, slot: 0, late: q.has('late'), dayIndex: num('day', 0), subjects: ['math', 'literature'] };
} else if (which === 'report_card') {
  const examId = 'midterm1', key = examKey(state.time.year, examId), avg = num('avg', 78);
  state.school.examPending = { [key]: { scores: Object.fromEntries(SUBJECTS.map((s, i) => [s, Math.max(0, Math.min(100, Math.round(avg + [6, -9, 4, -3, 8, -6][i])))])), sat: [...SUBJECTS], missed: [] } };
  processResults(state, examId, { bus });
  params = { examId, key };
} else {
  name = `activity:${which}`;
  params = q.has('remedial') ? { remedial: true, hours: 1, subject } : {};
  if (q.has('hours')) params.hours = num('hours', 1);
}

let result = null;
openScene(app.game, name, params).then((r) => { result = r; });

const step = (n = 1) => app.step(n);
const tap = (a) => app.input.tap(a);
const scene = () => app.game.scenes.top;
window.__ac = { app, game: app.game, step, tap, scene, result: () => result };
step(1);
