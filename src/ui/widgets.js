// Data-display widgets: CalendarGrid (28-day season view), drawTable (report card), drawStatBars.
import { WEEKDAYS, SEASON_LABEL, DAYS_PER_SEASON } from '../core/constants.js';
import { Widget, THEME, drawWindow, drawBar, drawTab } from './ui.js';
import { drawText, measureText, wrapText, LINE_H } from './font.js';

const CW = 28, CH = 22; // calendar cell size

/**
 * Season calendar. data: { [day]: { festival?: 'Name', exam?: 'Midterm', results?: true, breakDay?: true, birthdays?: ['Nina'] } }
 * Selectable: arrows move (left/right = 1 day, up/down = 1 week), confirm -> result = day, cancel -> null.
 * Non-selectable: just draws. `today` highlights a day. Use `detail(day)` to override the detail lines.
 */
export class CalendarGrid extends Widget {
  constructor({ services, season = 'spring', year = 1, today = null, data = {}, selectable = true, x = null, y = 28, detail = null, cursor = null } = {}) {
    super({ services });
    Object.assign(this, { season, year, today, data, selectable, y, detail });
    this.w = CW * 7 + 12;
    this.x = x ?? Math.round((320 - this.w) / 2);
    this.cursor = cursor ?? today ?? 1;
  }
  get h() { return 14 + CH * 4 + 10; }
  move(dx, dy) {
    const d = Math.max(1, Math.min(DAYS_PER_SEASON, this.cursor + dx + dy * 7));
    if (d !== this.cursor) { this.cursor = d; this.sfx('cursor'); }
  }
  update(dt, input) {
    this.tick(dt);
    if (!input || !this.selectable) return;
    if (input.repeat('left')) this.move(-1, 0);
    if (input.repeat('right')) this.move(1, 0);
    if (input.repeat('up')) this.move(0, -1);
    if (input.repeat('down')) this.move(0, 1);
    if (input.pressed('confirm')) { this.sfx('confirm'); this.finish(this.cursor); }
    else if (input.pressed('cancel')) { this.sfx('cancel'); this.finish(null); }
  }
  detailLines(day) {
    if (this.detail) return this.detail(day);
    const d = this.data[day] || {};
    const out = [`${SEASON_LABEL[this.season]} ${day}  (${WEEKDAYS[(day - 1) % 7]})`];
    if (d.festival) out.push(`{y}★ ${d.festival}`);
    if (d.exam) out.push(`{r}${d.exam}`);
    if (d.breakDay) out.push('{b}No school today');
    if (d.birthdays && d.birthdays.length) out.push(`{p}Birthday: ${d.birthdays.join(', ')}`);
    return out;
  }
  draw(ctx) {
    const { x, y } = this;
    drawWindow(ctx, x, y, this.w, this.h, 'parchment');
    drawTab(ctx, `${SEASON_LABEL[this.season]}, Year ${this.year}`, x + 8, y - 11, 'parchment');
    WEEKDAYS.forEach((wd, i) => drawText(ctx, wd, x + 6 + i * CW + CW / 2, y + 6, { color: i >= 5 ? '#b0453a' : THEME.ink, shadow: null, align: 'center' }));
    for (let day = 1; day <= DAYS_PER_SEASON; day++) {
      const col = (day - 1) % 7, row = Math.floor((day - 1) / 7);
      const cx = x + 6 + col * CW, cy = y + 17 + row * CH;
      const d = this.data[day] || {};
      ctx.fillStyle = d.breakDay ? 'rgba(127,180,255,0.35)' : col >= 5 ? 'rgba(244,166,200,0.22)' : 'rgba(255,247,222,0.55)';
      ctx.fillRect(cx + 1, cy + 1, CW - 2, CH - 2);
      if (day === this.today) { ctx.strokeStyle = '#c98a22'; ctx.lineWidth = 1; ctx.strokeRect(cx + 1.5, cy + 1.5, CW - 3, CH - 3); }
      drawText(ctx, String(day), cx + 4, cy + 3, { color: day === this.today ? '#a0521a' : THEME.ink, shadow: null });
      if (d.festival) drawText(ctx, '★', cx + CW - 11, cy + 3, { color: '#e0a020', shadow: null });
      if (d.exam) { ctx.fillStyle = '#d0443a'; ctx.fillRect(cx + 4, cy + CH - 6, 5, 3); }
      if (d.birthdays && d.birthdays.length) { ctx.fillStyle = '#ee6a9a'; ctx.fillRect(cx + CW - 9, cy + CH - 7, 4, 4); }
    }
    if (this.selectable) {
      const col = (this.cursor - 1) % 7, row = Math.floor((this.cursor - 1) / 7);
      const cx = x + 6 + col * CW, cy = y + 17 + row * CH;
      ctx.strokeStyle = THEME.navy; ctx.lineWidth = 1; ctx.strokeRect(cx + 0.5, cy + 0.5, CW - 1, CH - 1);
      ctx.strokeStyle = '#ffffff'; ctx.strokeRect(cx + 1.5, cy + 1.5, CW - 3, CH - 3);
    }
    // detail box
    const dy = y + this.h + 5;
    drawWindow(ctx, x, dy, this.w, 48, 'tooltip');
    this.detailLines(this.selectable ? this.cursor : this.today || 1).slice(0, 4).forEach((l, i) =>
      drawText(ctx, l, x + 9, dy + 7 + i * LINE_H, { color: i === 0 ? THEME.gold : '#ffffff', shadow: THEME.navyDeep }));
  }
}

/**
 * Simple table on a parchment window. columns: [{ key, label, w, align?:'left'|'right'|'center' }], rows: [{...}],
 * footer?: {...}. Cell text may use colour markup. Returns the table height in pixels.
 */
export function drawTable(ctx, { x = 20, y = 24, columns = [], rows = [], footer = null, style = 'parchment', rowH = 13, title = null } = {}) {
  const w = columns.reduce((s, c) => s + c.w, 0) + 16;
  const h = 12 + rowH * (rows.length + 1) + (footer ? rowH + 6 : 0) + 8;
  drawWindow(ctx, x, y, w, h, style);
  if (title) drawTab(ctx, title, x + 8, y - 11, style);
  const pk = style === 'parchment';
  const ink = pk ? THEME.ink : '#ffffff', head = pk ? '#8a3a1a' : THEME.gold;
  let cy = y + 8;
  const cell = (col, text, cyy, color) => {
    const cx = x + 8 + columns.slice(0, columns.indexOf(col)).reduce((s, c) => s + c.w, 0);
    const ax = col.align === 'right' ? cx + col.w - 4 : col.align === 'center' ? cx + col.w / 2 : cx + 2;
    drawText(ctx, String(text ?? ''), ax, cyy, { color, shadow: null, align: col.align || 'left' });
  };
  columns.forEach((c) => cell(c, c.label, cy, head));
  ctx.fillStyle = pk ? THEME.wood : THEME.cream; ctx.fillRect(x + 8, cy + rowH - 3, w - 16, 1);
  cy += rowH;
  for (const r of rows) { columns.forEach((c) => cell(c, r[c.key], cy, ink)); cy += rowH; }
  if (footer) {
    ctx.fillStyle = pk ? THEME.wood : THEME.cream; ctx.fillRect(x + 8, cy + 1, w - 16, 1);
    cy += 5;
    columns.forEach((c) => cell(c, footer[c.key], cy, head));
  }
  return h;
}

/** Labelled meters. items: [{ label, value, max?, color?, text? }] */
export function drawStatBars(ctx, x, y, items, { w = 150, labelW = 64, rowH = 12, style = 'menu' } = {}) {
  const pk = style === 'parchment';
  items.forEach((it, i) => {
    const ry = y + i * rowH;
    drawText(ctx, it.label, x, ry, { color: pk ? THEME.ink : '#ffffff', shadow: pk ? null : THEME.navyDeep });
    drawBar(ctx, x + labelW, ry + 1, w - labelW - 26, 6, it.value, it.max ?? 100, { fill: it.color || THEME.green, back: pk ? '#a89870' : '#3a3f5e', border: pk ? THEME.ink : THEME.navyDeep });
    drawText(ctx, it.text ?? String(Math.round(it.value)), x + w, ry, { color: pk ? THEME.ink : THEME.cream, shadow: pk ? null : THEME.navyDeep, align: 'right' });
  });
}

void measureText; void wrapText;
