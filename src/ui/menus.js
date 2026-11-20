// Menu widgets: ListMenu (scrolling rows), GridMenu (inventory grid + description), TabBar.
import { Widget, THEME, drawWindow, drawTab, drawCursor, drawIconSafe, textColorFor, shadowFor } from './ui.js';
import { drawText, wrapText, measureText, LINE_H } from './font.js';

/**
 * Vertical list. items: [{ label, value?, icon?, disabled?, desc?, color? }]
 * result: { index, item } | null (cancel). opts: x,y,w,rows,title,style('menu'|'parchment'),cancellable,descBox,onCursor.
 */
export class ListMenu extends Widget {
  constructor({ services, items = [], x = 16, y = 24, w = 200, rows = 8, title = null, style = 'menu', cursor = 0, cancellable = true, descBox = false, descH = 34, onCursor = null, footer = null } = {}) {
    super({ services });
    Object.assign(this, { x, y, w, rows, title, style, cancellable, descBox, descH, onCursor, footer });
    this.items = items;
    this.cursor = Math.max(0, Math.min(items.length - 1, cursor));
    this.top = 0;
    this.fit();
    this.notify();
  }
  setItems(items, keepCursor = true) {
    this.items = items;
    this.cursor = keepCursor ? Math.max(0, Math.min(items.length - 1, this.cursor)) : 0;
    this.fit();
    this.notify();
  }
  get rowH() { return this.items.some((i) => i.icon) ? 18 : 13; }
  get visibleRows() { return Math.min(this.rows, Math.max(1, this.items.length)); }
  get h() { return this.visibleRows * this.rowH + 10; }
  fit() {
    if (this.cursor < this.top) this.top = this.cursor;
    if (this.cursor >= this.top + this.visibleRows) this.top = this.cursor - this.visibleRows + 1;
    this.top = Math.max(0, Math.min(this.top, Math.max(0, this.items.length - this.visibleRows)));
  }
  notify() { if (this.onCursor && this.items[this.cursor]) this.onCursor(this.cursor, this.items[this.cursor]); }
  move(d) {
    const n = this.items.length;
    if (!n) return;
    this.cursor = (this.cursor + d + n) % n;
    this.fit();
    this.sfx('cursor');
    this.notify();
  }
  update(dt, input) {
    this.tick(dt);
    if (!input) return;
    if (input.repeat('up')) this.move(-1);
    if (input.repeat('down')) this.move(1);
    if (input.pressed('confirm') && this.items.length) {
      const it = this.items[this.cursor];
      if (it.disabled) this.sfx('error');
      else { this.sfx('confirm'); this.finish({ index: this.cursor, item: it }); }
    } else if (this.cancellable && input.pressed('cancel')) { this.sfx('cancel'); this.finish(null); }
  }
  draw(ctx) {
    const { x, y, w } = this;
    const pk = this.style === 'parchment';
    const base = textColorFor(this.style), sh = shadowFor(this.style);
    drawWindow(ctx, x, y, w, this.h, this.style);
    if (this.title) drawTab(ctx, this.title, x + 8, y - 11, pk ? 'parchment' : 'menu');
    const rh = this.rowH;
    const hasIcons = this.items.some((i) => i.icon);
    for (let r = 0; r < this.visibleRows; r++) {
      const i = this.top + r, it = this.items[i];
      if (!it) break;
      const ry = y + 5 + r * rh;
      const sel = i === this.cursor;
      if (sel) { ctx.fillStyle = pk ? 'rgba(122,79,46,0.22)' : 'rgba(242,184,75,0.22)'; ctx.fillRect(x + 4, ry - 1, w - 8, rh - 1); drawCursor(ctx, x + 6, ry + (rh > 14 ? 5 : 1), this.t, pk ? THEME.wood : THEME.gold); }
      let tx = x + 16;
      if (hasIcons) { if (it.icon) drawIconSafe(this.services.ui || { services: this.services }, ctx, it.icon, tx - 1, ry + 0); tx += 18; }
      const ty = ry + (rh > 14 ? 4 : 1);
      const col = it.disabled ? (pk ? '#9a8a6a' : '#6b7090') : it.color || (sel ? (pk ? '#8a3a1a' : THEME.gold) : base);
      drawText(ctx, it.label, tx, ty, { color: col, shadow: sh });
      if (it.value !== undefined && it.value !== null) drawText(ctx, String(it.value), x + w - 14, ty, { color: it.disabled ? col : pk ? THEME.ink : THEME.cream, shadow: sh, align: 'right' });
    }
    if (this.top > 0) drawText(ctx, '▲', x + w - 12, y + 3, { color: THEME.gold, shadow: null });
    if (this.top + this.visibleRows < this.items.length) drawText(ctx, '▼', x + w - 12, y + this.h - 12, { color: THEME.gold, shadow: null });
    if (this.footer) drawText(ctx, this.footer, x + 8, y + this.h + 4, { color: THEME.cream, shadow: THEME.navyDeep });
    if (this.descBox) this.drawDesc(ctx);
  }
  drawDesc(ctx) {
    const it = this.items[this.cursor];
    const y = this.y + this.h + 6;
    drawWindow(ctx, this.x, y, this.w, this.descH, this.style === 'parchment' ? 'parchment' : 'tooltip');
    if (!it || !it.desc) return;
    wrapText(it.desc, this.w - 18).slice(0, Math.floor((this.descH - 10) / LINE_H)).forEach((l, i) =>
      drawText(ctx, l, this.x + 9, y + 6 + i * LINE_H, { color: textColorFor(this.style === 'parchment' ? 'parchment' : 'tooltip'), shadow: shadowFor(this.style === 'parchment' ? 'parchment' : 'tooltip') }));
  }
}

/** Inventory-style grid. items: [{ id, label, icon, qty?, desc?, disabled? }]. result: { index, item } | null. */
export class GridMenu extends Widget {
  constructor({ services, items = [], x = 16, y = 24, cols = 6, rows = 4, cell = 26, title = null, style = 'menu', cursor = 0, cancellable = true, descBox = true, onCursor = null } = {}) {
    super({ services });
    Object.assign(this, { items, x, y, cols, rows, cell, title, style, cancellable, descBox, onCursor });
    this.cursor = Math.max(0, Math.min(Math.max(0, items.length - 1), cursor));
    this.top = 0; // first visible row
    this.fit();
    this.notify();
  }
  get w() { return this.cols * this.cell + 12; }
  get h() { return this.rows * this.cell + 12; }
  fit() {
    const row = Math.floor(this.cursor / this.cols);
    if (row < this.top) this.top = row;
    if (row >= this.top + this.rows) this.top = row - this.rows + 1;
  }
  notify() { if (this.onCursor && this.items[this.cursor]) this.onCursor(this.cursor, this.items[this.cursor]); }
  step(dx, dy) {
    const n = this.items.length;
    if (!n) return;
    let i = this.cursor;
    if (dx) i = Math.max(0, Math.min(n - 1, i + dx));
    if (dy) { const t = i + dy * this.cols; if (t >= 0 && t < n) i = t; else if (dy > 0 && Math.floor(i / this.cols) < Math.floor((n - 1) / this.cols)) i = n - 1; }
    if (i !== this.cursor) { this.cursor = i; this.fit(); this.sfx('cursor'); this.notify(); }
  }
  update(dt, input) {
    this.tick(dt);
    if (!input) return;
    if (input.repeat('left')) this.step(-1, 0);
    if (input.repeat('right')) this.step(1, 0);
    if (input.repeat('up')) this.step(0, -1);
    if (input.repeat('down')) this.step(0, 1);
    if (input.pressed('confirm') && this.items.length) {
      const it = this.items[this.cursor];
      if (it.disabled) this.sfx('error'); else { this.sfx('confirm'); this.finish({ index: this.cursor, item: it }); }
    } else if (this.cancellable && input.pressed('cancel')) { this.sfx('cancel'); this.finish(null); }
  }
  draw(ctx) {
    const { x, y, cell } = this;
    drawWindow(ctx, x, y, this.w, this.h, this.style);
    if (this.title) drawTab(ctx, this.title, x + 8, y - 11, this.style === 'parchment' ? 'parchment' : 'menu');
    const ui = { services: this.services };
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const i = (this.top + r) * this.cols + c;
        const cx = x + 6 + c * cell, cy = y + 6 + r * cell;
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(cx + 1, cy + 1, cell - 2, cell - 2);
        const it = this.items[i];
        if (!it) continue;
        if (it.icon) { ctx.globalAlpha = it.disabled ? 0.4 : 1; drawIconSafe(ui, ctx, it.icon, cx + Math.floor((cell - 16) / 2), cy + 2); ctx.globalAlpha = 1; }
        if (it.qty !== undefined && it.qty > 1) drawText(ctx, String(it.qty), cx + cell - 3, cy + cell - 10, { color: '#ffffff', shadow: THEME.navyDeep, align: 'right' });
      }
    }
    if (this.items.length) {
      const sr = Math.floor(this.cursor / this.cols) - this.top, sc = this.cursor % this.cols;
      const sx = x + 6 + sc * cell, sy = y + 6 + sr * cell;
      ctx.strokeStyle = THEME.gold; ctx.lineWidth = 1;
      ctx.strokeRect(sx + 0.5, sy + 0.5, cell - 1, cell - 1);
      ctx.strokeStyle = THEME.navyDeep; ctx.strokeRect(sx + 1.5, sy + 1.5, cell - 3, cell - 3);
    }
    if (this.descBox) {
      const dy = y + this.h + 6, it = this.items[this.cursor];
      drawWindow(ctx, x, dy, this.w, 40, this.style === 'parchment' ? 'parchment' : 'tooltip');
      if (it) {
        const tipStyle = this.style === 'parchment' ? 'parchment' : 'tooltip';
        drawText(ctx, it.label, x + 9, dy + 6, { color: this.style === 'parchment' ? '#8a3a1a' : THEME.gold, shadow: shadowFor(tipStyle) });
        if (it.qty !== undefined) drawText(ctx, `x${it.qty}`, x + this.w - 9, dy + 6, { color: textColorFor(tipStyle), shadow: shadowFor(tipStyle), align: 'right' });
        wrapText(it.desc || '', this.w - 18).slice(0, 2).forEach((l, k) => drawText(ctx, l, x + 9, dy + 17 + k * LINE_H, { color: textColorFor(tipStyle), shadow: shadowFor(tipStyle) }));
      }
    }
  }
}

/** Horizontal tabs. labels: string[]; index changes with left/right (or L/R). onChange(index). */
export class TabBar extends Widget {
  constructor({ services, labels = [], index = 0, x = 8, y = 6, w = 304, style = 'menu', onChange = null } = {}) {
    super({ services });
    Object.assign(this, { labels, index, x, y, w, style, onChange });
  }
  set(i) {
    const n = this.labels.length;
    const ni = (i + n) % n;
    if (ni !== this.index) { this.index = ni; this.sfx('cursor'); if (this.onChange) this.onChange(ni); }
  }
  update(dt, input) {
    this.tick(dt);
    if (!input) return;
    if (input.repeat('left')) this.set(this.index - 1);
    if (input.repeat('right')) this.set(this.index + 1);
  }
  draw(ctx) {
    const n = this.labels.length;
    if (!n) return;
    const tw = this.w / n;
    drawWindow(ctx, this.x, this.y, this.w, 18, this.style);
    this.labels.forEach((l, i) => {
      const cx = this.x + Math.round(tw * i + tw / 2);
      const sel = i === this.index;
      if (sel) { ctx.fillStyle = this.style === 'parchment' ? 'rgba(122,79,46,0.25)' : 'rgba(242,184,75,0.28)'; ctx.fillRect(Math.round(this.x + tw * i + 2), this.y + 3, Math.round(tw - 4), 12); }
      drawText(ctx, l, cx, this.y + 5, { color: sel ? (this.style === 'parchment' ? '#8a3a1a' : THEME.gold) : textColorFor(this.style), shadow: shadowFor(this.style), align: 'center' });
    });
    void measureText;
  }
}
