// Scene 'report_card': params { examId, key } -> {}. Parchment report from state.school.exams[key] and reportCards.
import { Banner, drawText, drawTable, drawWindow, drawBar, wrapText, LINE_H, THEME } from '../../ui/index.js';
import { EXAMS } from '../../data/calendar.js';
import { SUBJECTS } from '../../core/constants.js';
import { letterGrade } from '../../sim/academics.js';
import { examKey } from '../../sim/exams.js';
import { AcademicScene } from './common.js';
import { SUBJECT_LABEL, gradeColor, scoreBarColor, STANDING_LABEL, STANDING_COLOR, teacherComment, remedialNotice } from './logic.js';

const COLS = [
  { key: 'subject', label: 'Subject', w: 104 },
  { key: 'score', label: 'Score', w: 38, align: 'right' },
  { key: 'grade', label: 'Grade', w: 34, align: 'center' },
  { key: 'bar', label: '', w: 66 },
];
const TX = 36, TY = 32, ROW_H = 12;

/** Pure: everything the card shows, from state. */
export function reportData(state, key) {
  const rec = state.school.exams[key] || { scores: {}, average: 0, rank: 30 };
  const card = state.school.reportCards.find((c) => c.key === key || (c.examId && key.endsWith(`_${c.examId}`) && key.startsWith(`Y${c.year}_`)));
  const standing = (card && card.standing) || state.school.standing;
  return { scores: rec.scores, average: rec.average, rank: rec.rank, standing, running: state.school.average, remedialDays: state.school.remedialDays || 0, comment: teacherComment(standing, state.meta.seed, key) };
}

export class ReportCardScene extends AcademicScene {
  enter() {
    const p = this.params;
    const st = this.state;
    this.key = p.key || examKey(st.time.year, p.examId);
    const examId = p.examId || (this.key.split('_')[1]);
    const def = EXAMS.find((e) => e.id === examId);
    this.label = def ? def.label : examId;
    this.data = reportData(st, this.key);
    this.setMode('show');
    if (this.data.rank <= 3) {
      this.sfx('cheer');
      this.ask(new Banner({ services: this.services, text: this.data.rank === 1 ? 'TOP OF THE CLASS!' : `TOP ${this.data.rank} IN CLASS!`, sub: `Rank ${this.data.rank}/30 - what a result, Theo!`, ms: 2600, fullDim: false }), () => this.sfx('success'));
    }
  }

  step(dt, input) {
    if (this.widget) { this.tickWidget(dt, input); return; }
    if (this.mt > 0.4 && (input.pressed('confirm') || input.pressed('cancel'))) { this.sfx('confirm'); this.finish({}); }
  }

  draw(ui) {
    const ctx = ui.ctx, d = this.data;
    ctx.fillStyle = '#5a3d26'; ctx.fillRect(0, 0, 320, 240);
    drawWindow(ctx, 6, 3, 308, 234, 'parchment');
    drawText(ctx, 'BELLHAVEN ACADEMY  -  REPORT CARD', 160, 9, { color: '#8a3a1a', shadow: null, align: 'center' });
    drawText(ctx, `Student: Theo Hartley    ${this.label}`, 160, 20, { color: THEME.ink, shadow: null, align: 'center' });
    const rows = SUBJECTS.map((s) => {
      const sc = d.scores[s] ?? 0, g = letterGrade(sc);
      return { subject: SUBJECT_LABEL[s], score: String(sc), grade: `{${gradeColor(g)}}${g}{/}`, bar: '' };
    });
    const avgG = letterGrade(d.average);
    const h = drawTable(ctx, { x: TX, y: TY, columns: COLS, rows, rowH: ROW_H, footer: { subject: 'Average', score: String(d.average), grade: `{${gradeColor(avgG)}}${avgG}{/}`, bar: '' } });
    const bx = TX + 8 + COLS[0].w + COLS[1].w + COLS[2].w + 4;
    SUBJECTS.forEach((s, i) => drawBar(ctx, bx, TY + 8 + ROW_H * (i + 1) + 2, COLS[3].w - 10, 6, d.scores[s] ?? 0, 100, { fill: scoreBarColor(d.scores[s] ?? 0), back: '#a89870', border: THEME.ink }));
    drawBar(ctx, bx, TY + 8 + ROW_H * 7 + 8, COLS[3].w - 10, 6, d.average, 100, { fill: scoreBarColor(d.average), back: '#a89870', border: THEME.ink });
    // stats
    const y = TY + h + 4;
    drawText(ctx, `Rank: ${d.rank}/30`, 20, y, { color: d.rank <= 3 ? '#2f7d32' : THEME.ink, shadow: null });
    drawText(ctx, STANDING_LABEL[d.standing], 160, y, { color: STANDING_COLOR[d.standing], shadow: null, align: 'center' });
    drawText(ctx, `Running avg: ${d.running}`, 300, y, { color: THEME.ink, shadow: null, align: 'right' });
    // teacher comment
    const cy = y + 13;
    drawWindow(ctx, 14, cy, 292, 238 - cy - 4, 'hud');
    drawText(ctx, 'Ms. Delaney writes:', 22, cy + 5, { color: '#8a3a1a', shadow: null });
    const lines = [...wrapText(d.comment, 276).map((text) => ({ text, color: THEME.ink })), ...wrapText(remedialNotice(d.remedialDays), 276).filter(Boolean).map((text) => ({ text, color: '#b3261e' }))];
    lines.slice(0, Math.floor((238 - cy - 4 - 20) / LINE_H)).forEach((l, i) => drawText(ctx, l.text, 22, cy + 16 + i * LINE_H, { color: l.color, shadow: null }));
    if (this.mt > 0.4 && !this.widget) drawText(ctx, 'Z: close', 298, 219, { color: THEME.wood, shadow: null, align: 'right' });
    if (this.widget) this.widget.draw(ctx);
  }
}
