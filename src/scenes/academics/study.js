// Scenes 'activity:study_home' / 'activity:study_library': params { remedial?, hours?, subject? } -> { minutes, gains }.
import { ListMenu, measureText, drawText, drawWindow, drawStatBars, THEME } from '../../ui/index.js';
import { SUBJECTS } from '../../core/constants.js';
import { study } from '../../sim/academics.js';
import { studyBonus } from '../../sim/inventory.js';
import { rngFor } from '../../core/rng.js';
import { drawStudyHome, drawStudyLibrary } from './backdrops.js';
import { AcademicScene, drawCard } from './common.js';
import { SUBJECT_LABEL, SUBJECT_SHORT, hourOptions, REMEDIAL_LINE, STUDY_FLAVOUR } from './logic.js';

const SUBJECT_COLOR = { math: '#e8645a', literature: '#f4a6c8', science: '#7fd36a', history: '#d0a04a', art: '#9a8aff', pe: '#7fb4ff' };
const ANIM_SECONDS = 2.6;

export class StudyScene extends AcademicScene {
  constructor(game, params = {}, place = 'home') {
    super(game, params);
    this.place = place;
    this.subject = params.subject || null;
    this.hours = params.hours || 1;
    this.res = null;
  }
  get cost() { return (this.sim.balance && this.sim.balance.energy.cost.study) || 12; }

  enter() {
    this.minute0 = this.state.time.minute;
    this.flavour = rngFor(`${this.state.meta.seed}:studyflavour:${this.state.time.absDay}:${this.state.daily.studied}`).pick(STUDY_FLAVOUR[this.place]);
    if (this.params.remedial) {
      this.subject = this.subject || 'math';
      this.hours = 1;
      this.setMode('remedial');
    } else this.askSubject();
  }

  bonusFor(s) { return studyBonus(this.state, s); }

  askSubject() {
    this.setMode('subject');
    const items = SUBJECTS.map((s) => {
      const b = this.bonusFor(s);
      return { label: SUBJECT_LABEL[s], id: s, value: b ? `book +${b}` : undefined, desc: b ? `Your books help: +${b} per hour.` : 'Pick what to study.' };
    });
    this.ask(new ListMenu({ services: this.services, items, x: 10, y: 28, w: 150, rows: 6, title: 'Study what?', cancellable: true }), (r) => {
      if (!r) { this.finish({ minutes: 0, gains: {} }); return; }
      this.subject = r.item.id;
      this.askHours();
    });
  }

  askHours() {
    this.setMode('hours');
    const en = this.state.player.energy;
    const items = hourOptions(en, this.cost).map((o) => ({ label: `${o.hours} hour${o.hours > 1 ? 's' : ''}`, value: `-${o.cost} energy`, hours: o.hours, disabled: !o.enabled }));
    const first = Math.max(0, items.findIndex((i) => !i.disabled));
    if (items.every((i) => i.disabled)) { this.begin(1); return; } // too tired: study() will say so
    this.ask(new ListMenu({ services: this.services, items, x: 10, y: 130, w: 150, rows: 3, title: 'How long?', cursor: first, cancellable: true }), (r) => {
      if (!r) { this.askSubject(); return; }
      this.begin(r.item.hours);
    });
  }

  begin(hours) {
    this.hours = hours;
    this.setMode('anim');
    this.sfx('page');
  }

  run() {
    this.res = study(this.state, { subject: this.subject, hours: this.hours, place: this.place }, { advanceClock: false });
    this.sfx(this.res.ok ? 'success' : 'error');
    this.setMode('result');
  }

  step(dt, input) {
    if (this.mode === 'remedial') {
      if (this.mt > 0.4 && input.pressed('confirm')) this.begin(1);
    } else if (this.mode === 'anim') {
      if (this.mt > ANIM_SECONDS * this.hours * 0.7 || input.pressed('confirm')) this.run();
    } else if (this.mode === 'result') {
      if (this.mt > 0.5 && (input.pressed('confirm') || input.pressed('cancel'))) {
        const r = this.res, minutes = r.ok ? r.minutes : 0;
        this.advanceClock(minutes);
        this.finish({ minutes, gains: r.ok ? { [this.subject]: r.gain } : {} });
      }
    } else this.tickWidget(dt, input);
  }

  resultLines() {
    const r = this.res, name = SUBJECT_SHORT[this.subject];
    if (!r.ok) return [{ text: 'Too tired to focus. The words swim on the page.', color: THEME.red }, { text: 'Get some rest first.', color: THEME.cream }];
    const lines = [{ text: `${name} +${r.gain}`, color: THEME.green }];
    if (r.perHour.length > 1) lines.push({ text: `Per hour: ${r.perHour.map((v) => `+${v}`).join('  ')}`, color: THEME.cream });
    const b = this.bonusFor(this.subject);
    if (b) lines.push({ text: `Book bonus +${b} per hour`, color: THEME.gold });
    if (this.place === 'library') lines.push({ text: 'Library quiet bonus +1 per hour', color: THEME.blue });
    lines.push({ text: `Energy ${r.energyCost > 0 ? '-' : ''}${Math.abs(r.energyCost)}   Time ${r.hours} h`, color: THEME.cream });
    if (r.hours < this.hours) lines.push({ text: 'Energy ran out: you stopped early.', color: THEME.grey });
    return lines;
  }

  draw(ui) {
    const ctx = ui.ctx;
    const writing = this.mode === 'anim';
    // sky/time moves forward a little while studying
    const minute = this.minute0 + (writing ? Math.round(Math.min(1, this.mt / (ANIM_SECONDS * this.hours * 0.7)) * this.hours * 60) : 0);
    const opts = { t: this.t, minute, writing, subjectColor: SUBJECT_COLOR[this.subject] || '#e8645a' };
    if (this.place === 'library') drawStudyLibrary(ctx, opts); else drawStudyHome(ctx, opts);
    if (this.mode === 'subject' || this.mode === 'hours') {
      // knowledge bars panel
      const st = this.state.player.subjects;
      drawWindow(ctx, 168, 28, 144, 94, 'menu');
      drawStatBars(ctx, 176, 36, SUBJECTS.map((s) => ({ label: s === 'literature' ? 'Lit.' : SUBJECT_SHORT[s], value: st[s], color: s === this.subject ? THEME.gold : THEME.green, text: String(Math.round(st[s])) })), { w: 128, labelW: 54, rowH: 13 });
      drawText(ctx, `Energy ${Math.round(this.state.player.energy)}`, 176, 110, { color: THEME.cream, shadow: THEME.navyDeep });
    }
    if (this.widget) this.widget.draw(ctx);
    if (this.mode === 'remedial') {
      drawCard(ctx, { x: 30, y: 50, w: 260, title: 'Remedial study', lines: [{ text: REMEDIAL_LINE, color: '#ffffff' }, { text: `Subject: ${SUBJECT_LABEL[this.subject]}`, color: THEME.gold }], footer: 'Press Z to begin', t: this.t });
    }
    if (this.mode === 'anim') {
      const fw = measureText(this.flavour) + 20;
      drawWindow(ctx, 160 - fw / 2, 10, fw, 18, 'tooltip');
      drawText(ctx, this.flavour, 160, 16, { color: THEME.cream, shadow: THEME.navyDeep, align: 'center' });
      drawText(ctx, `Studying ${SUBJECT_LABEL[this.subject]}...`, 160, 34, { color: '#ffffff', shadow: THEME.navyDeep, align: 'center' });
    }
    if (this.mode === 'result') {
      ctx.fillStyle = 'rgba(12,14,34,0.45)'; ctx.fillRect(0, 0, 320, 240);
      drawCard(ctx, { x: 50, y: 40, w: 220, title: this.res.ok ? 'Study session' : 'Too tired', lines: this.resultLines(), t: this.t });
    }
  }
}

export const StudyHomeScene = class extends StudyScene { constructor(game, params) { super(game, params, 'home'); } };
export const StudyLibraryScene = class extends StudyScene { constructor(game, params) { super(game, params, 'library'); } };
