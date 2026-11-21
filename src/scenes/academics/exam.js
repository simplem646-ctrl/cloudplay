// Scene 'exam': one sitting. params { examId, key, subject, slot, late, dayIndex, subjects } -> { scores: { [subject]: 0..100 }, subject }.
import { ListMenu, drawText, drawWindow, drawBar, THEME } from '../../ui/index.js';
import { EXAMS } from '../../data/calendar.js';
import { prepareSubject, submitSubject } from '../../sim/exams.js';
import { openScene } from '../registry.js';
import { AcademicScene, drawCard } from './common.js';
import { examTitle, progressLabel, layoutQuestion, optionItems, hintNote, proctorLine, subjectLabel } from './logic.js';
import { letterGrade } from '../../sim/academics.js';

export const SITTING_MINUTES = 80;

export class ExamScene extends AcademicScene {
  constructor(game, params = {}) {
    super(game, params);
    this.subject = params.subject || 'math';
    this.answers = [];
    this.qi = 0;
    this.practical = null;
    this.res = null;
  }

  enter() {
    const p = this.params;
    this.prep = prepareSubject(this.state, this.subject, p.examId ? { examId: p.examId } : {});
    const def = EXAMS.find((e) => e.id === this.prep.examId);
    this.title = examTitle(def ? def.label : this.prep.examId, p.dayIndex || 0, this.subject);
    this.sfx('exam_start');
    this.setMode('intro');
  }

  askQuestion() {
    this.setMode('question');
    const q = this.prep.questions[this.qi];
    this.qLines = layoutQuestion(q.q, 280, 3);
    const items = optionItems(q, 258);
    const first = Math.max(0, items.findIndex((i) => !i.disabled));
    this.ask(new ListMenu({ services: this.services, items, x: 10, y: 104, w: 300, rows: 4, cursor: first, cancellable: false }), (r) => {
      this.answers[this.qi] = r.item.index;
      this.qi++;
      if (this.qi < this.prep.total) this.askQuestion();
      else this.afterQuestions();
    });
  }

  afterQuestions() {
    if (this.prep.practical) {
      this.setMode('practical_offer');
      const items = [{ label: 'Sit the practical (worth 50%)', id: 'yes' }, { label: 'Skip it (written paper only)', id: 'no' }];
      this.ask(new ListMenu({ services: this.services, items, x: 40, y: 110, w: 240, rows: 2, title: 'Practical exam', cancellable: false }), async (r) => {
        if (r.item.id === 'yes') {
          this.setMode('waiting');
          const out = await openScene(this.game, `minigame:${this.prep.practical}`, { context: 'exam' });
          this.practical = out && !out.missing && !out.cancelled && typeof out.score === 'number' ? out.score : null;
        }
        this.submit();
      });
    } else this.submit();
  }

  submit() {
    this.res = submitSubject(this.state, this.prep, this.answers, { practical: this.practical });
    this.sfx(this.res.score >= 55 ? 'success' : 'fail');
    this.setMode('result');
  }

  step(dt, input) {
    if (this.mode === 'intro') {
      if (this.mt > 0.3 && input.pressed('confirm')) { this.sfx('confirm'); this.askQuestion(); }
    } else if (this.mode === 'result') {
      if (this.mt > 0.6 && (input.pressed('confirm') || input.pressed('cancel'))) {
        this.advanceClock(SITTING_MINUTES);
        this.finish({ scores: { [this.subject]: this.res.score }, subject: this.subject });
      }
    } else this.tickWidget(dt, input);
  }

  resultLines() {
    const r = this.res, lines = [];
    lines.push({ text: `Written paper: ${r.correct}/${r.total} right (${r.written})`, color: '#ffffff' });
    if (r.practical !== null) lines.push({ text: `Practical: ${Math.round(r.practical)}`, color: THEME.blue });
    if (r.bonuses.conduct) lines.push({ text: `Good conduct bonus +${r.bonuses.conduct}`, color: THEME.green });
    if (r.bonuses.rested) lines.push({ text: `Well rested bonus +${r.bonuses.rested}`, color: THEME.green });
    lines.push({ gap: true });
    lines.push({ text: `Final score: ${r.score}  (${letterGrade(r.score)})`, color: THEME.gold });
    lines.push({ gap: true });
    lines.push({ text: proctorLine(r.score, this.params.late), color: THEME.cream });
    return lines;
  }

  draw(ui) {
    const ctx = ui.ctx;
    ctx.fillStyle = '#2b3560'; ctx.fillRect(0, 0, 320, 240);
    ctx.fillStyle = '#242c52'; for (let y = 0; y < 240; y += 8) ctx.fillRect(0, y, 320, 1);
    // title bar
    drawWindow(ctx, 6, 5, 308, 20, 'hud');
    drawText(ctx, this.title || 'Exam', 160, 11, { color: THEME.ink, shadow: null, align: 'center' });
    if (this.mode === 'intro') {
      drawCard(ctx, { x: 50, y: 50, w: 220, title: subjectLabel(this.subject), lines: [
        { text: `${this.prep.total} questions, four options each.`, color: '#ffffff' },
        { text: 'No timer. Take your time and think.', color: THEME.cream },
        { text: this.prep.strikes ? 'Your studies will help: some wrong answers will be struck out.' : 'Good luck, Theo.', color: THEME.gold },
        ...(this.params.late ? [{ text: 'You are late: stay calm and do your best.', color: THEME.red }] : []),
        ...(this.prep.practical ? [{ text: 'This subject also has a practical.', color: THEME.blue }] : []),
      ], footer: 'Press Z to begin', t: this.t });
      return;
    }
    if (this.mode === 'question') {
      drawText(ctx, progressLabel(this.qi, this.prep.total), 14, 32, { color: THEME.gold, shadow: THEME.navyDeep });
      drawBar(ctx, 200, 33, 106, 6, this.qi, this.prep.total, { fill: THEME.gold, back: '#3a3f5e', border: THEME.navyDeep });
      drawWindow(ctx, 10, 46, 300, 52, 'menu');
      this.qLines.forEach((l, i) => drawText(ctx, l, 18, 54 + i * 12, { color: '#ffffff', shadow: THEME.navyDeep }));
      if (this.prep.strikes >= 1 && this.qi === 0 && this.mt < 6) drawText(ctx, hintNote(this.prep.strikes), 160, 214, { color: THEME.cream, shadow: THEME.navyDeep, align: 'center' });
    }
    if (this.widget) this.widget.draw(ctx);
    if (this.mode === 'waiting') drawText(ctx, 'Practical in progress...', 160, 110, { color: THEME.cream, shadow: THEME.navyDeep, align: 'center' });
    if (this.mode === 'result') {
      drawCard(ctx, { x: 40, y: 34, w: 240, title: 'Paper handed in', lines: this.resultLines(), t: this.t });
    }
  }
}
