// Scene 'class': a short lesson. params { period, subject, late, minutes, popQuiz, room } -> { attended, gains, choice, minutes }.
import { DialogueBox, ListMenu, drawText, drawWindow, measureText, THEME } from '../../ui/index.js';
import { CAST_BY_ID } from '../../data/cast.js';
import { teacherOf } from '../../data/timetable.js';
import { applyClass } from '../../sim/academics.js';
import { defaultBanks } from '../../sim/exams.js';
import { drawClassroom, drawField } from './backdrops.js';
import { AcademicScene, drawCard } from './common.js';
import { ATTENTION, flavourLine, lateLine, pickQuizQuestion, layoutQuestion, optionItems, joinGains, subjectLabel } from './logic.js';

export class ClassScene extends AcademicScene {
  constructor(game, params = {}) {
    super(game, params);
    this.subject = params.subject || 'math';
    this.period = params.period || 1;
    this.minutes = params.minutes ?? 40;
    this.field = params.room === 'school_field';
    this.teacherId = teacherOf(this.subject) || 'ms_delaney';
    this.teacher = CAST_BY_ID[this.teacherId] || { name: 'Teacher' };
    this.choice = 'listen';
    this.quizRight = null;
    this.outcome = null;
  }

  enter() {
    const st = this.state, p = this.params;
    this.lines = [];
    if (p.late) this.lines.push(lateLine(st.meta.seed, st.time.absDay, this.period));
    this.lines.push(flavourLine(this.subject, st.time.year, st.meta.seed, st.time.absDay, this.period));
    this.quiz = p.popQuiz ? pickQuizQuestion(defaultBanks()[this.subject], { seed: st.meta.seed, absDay: st.time.absDay, period: this.period, year: st.time.year }) : null;
    this.nextLine();
  }

  nextLine() {
    const text = this.lines.shift();
    if (text === undefined) { this.askChoice(); return; }
    this.setMode('talk');
    this.sfx('page');
    this.ask(new DialogueBox({ services: this.services, who: this.teacherId, name: this.teacher.name, text }), () => this.nextLine());
  }

  askChoice() {
    this.setMode('choice');
    const items = ATTENTION.map((a) => ({ label: a.label, desc: a.desc, id: a.id }));
    this.ask(new ListMenu({ services: this.services, items, x: 168, y: 104, w: 144, rows: 4, title: 'Attention', cancellable: false, descBox: true, descH: 46 }), (r) => {
      this.choice = r.item.id;
      if (this.quiz) this.askQuiz(); else this.finishLesson();
    });
  }

  askQuiz() {
    this.setMode('quiz');
    this.sfx('chime');
    this.qLines = layoutQuestion(this.quiz.q, 280, 3);
    this.ask(new ListMenu({ services: this.services, items: optionItems(this.quiz, 258), x: 10, y: 132, w: 300, rows: 4, cancellable: false }), (r) => {
      this.quizRight = r.item.index === this.quiz.correct;
      this.sfx(this.quizRight ? 'correct' : 'wrong');
      this.finishLesson();
    });
  }

  finishLesson() {
    const { period, late } = this.params;
    this.outcome = applyClass(this.state, { subject: this.subject, period, choice: this.choice, quiz: this.quiz ? this.quizRight : null, late: !!late });
    this.sfx('bell_school');
    this.setMode('result');
  }

  step(dt, input) {
    if (this.mode === 'result') {
      if (this.mt > 0.5 && (input.pressed('confirm') || input.pressed('cancel'))) {
        this.advanceClock(this.minutes);
        this.finish({ attended: true, gains: this.outcome.gains, choice: this.choice, minutes: this.minutes });
      }
      return;
    }
    this.tickWidget(dt, input);
  }

  resultLines() {
    const o = this.outcome, lines = [];
    const g = joinGains(o.gains);
    lines.push({ text: g || 'No new knowledge this time.', color: g ? THEME.green : THEME.grey });
    const tr = Object.entries(o.traits).filter(([, v]) => v).map(([k, v]) => `${k} +${v}`).join('  ');
    if (tr) lines.push({ text: tr, color: THEME.blue });
    if (this.quiz) lines.push({ text: this.quizRight ? 'Pop quiz: correct! +2' : 'Pop quiz: not quite. No bonus.', color: this.quizRight ? THEME.gold : THEME.red });
    if (o.energy) lines.push({ text: `Energy ${o.energy > 0 ? '+' : ''}${o.energy}`, color: THEME.cream });
    if (o.conduct) lines.push({ text: `Conduct ${o.conduct}`, color: THEME.red });
    if (o.caught) lines.push({ text: 'The teacher noticed the note!', color: THEME.red });
    if (this.params.late) lines.push({ text: 'Arriving late cost a point of focus.', color: THEME.grey });
    return lines;
  }

  draw(ui) {
    const ctx = ui.ctx;
    if (this.field) drawField(ctx, { t: this.t });
    else drawClassroom(ctx, { subject: this.subject, teacher: this.teacher, t: this.t });
    // lesson title plate
    const plate = `${subjectLabel(this.subject)}  P${this.period}`;
    drawWindow(ctx, 4, 4, measureText(plate) + 14, 16, 'hud');
    drawText(ctx, plate, 11, 9, { color: THEME.ink, shadow: null });
    if (this.mode === 'quiz') {
      drawWindow(ctx, 10, 62, 300, 66, 'tooltip');
      drawText(ctx, 'POP QUIZ!', 18, 67, { color: THEME.gold, shadow: THEME.navyDeep });
      this.qLines.forEach((l, i) => drawText(ctx, l, 18, 80 + i * 11, { color: '#ffffff', shadow: THEME.navyDeep }));
    }
    if (this.widget) this.widget.draw(ctx);
    if (this.mode === 'result') {
      ctx.fillStyle = 'rgba(12,14,34,0.5)'; ctx.fillRect(0, 0, 320, 240);
      drawCard(ctx, { x: 50, y: 40, w: 220, title: 'Class over', lines: this.resultLines(), t: this.t });
    }
  }
}
