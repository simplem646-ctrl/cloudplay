// Dialogue-style widgets: DialogueBox (typewriter + portrait), ChoiceBox, ConfirmBox, NumberPicker.
// All of them: update(dt, input), draw(ctx), done, result. `input` is the engine Input (duck-typed:
// pressed/repeat/down).
import { PORTRAIT_SHEET } from '../data/sheet_layout.js';
import { wrapText, drawText, measureText, stripMarkup, visibleLength, LINE_H, charAdvance } from './font.js';
import { Widget, THEME, drawWindow, drawTab, drawPrompt, drawCursor, textColorFor, shadowFor } from './ui.js';

const SPEEDS = { slow: 22, normal: 42, fast: 80 }; // characters per second
export const LINES_PER_PAGE = 3;
const BOX = { x: 6, y: 164, w: 308, h: 70 };

/** Dialogue box. style: 'normal' | 'think' (Theo's thoughts) | 'narrate' (no portrait, no name). */
export class DialogueBox extends Widget {
  constructor({ services, who = null, name = null, face = 'neutral', text = '', style = 'normal', box = BOX, speed = null } = {}) {
    super({ services });
    this.who = who;
    this.face = face;
    this.style = style;
    this.box = box;
    this.name = style === 'narrate' ? null : name;
    // A portrait slot is shown for every real or unknown speaker (a silhouette placeholder when no sheet exists).
    this.showPortrait = style !== 'narrate' && !!who && who !== 'narrator';
    const canLook = this.showPortrait && who !== 'unknown' && this.services.getPortraitSheet;
    this.sheet = (canLook && this.services.getPortraitSheet(who)) || null;
    this.textX = box.x + (this.showPortrait ? 66 : 12);
    this.textW = box.w - (this.showPortrait ? 66 : 12) - 12;
    this.lines = wrapText(String(text), this.textW);
    this.pages = [];
    for (let i = 0; i < this.lines.length; i += LINES_PER_PAGE) this.pages.push(this.lines.slice(i, i + LINES_PER_PAGE));
    if (!this.pages.length) this.pages.push(['']);
    this.page = 0;
    this.shown = 0; // visible characters revealed on the current page
    this.pause = 0;
    this.acc = 0;
    this.speedOverride = speed;
    this.blipCount = 0;
    this.blinkT = 2.5 + Math.random() * 2;
    this.blinkLeft = 0;
    this.talkT = 0;
  }

  get pageLength() { return this.pages[this.page].reduce((n, l) => n + visibleLength(l), 0); }
  isTyping() { return this.shown < this.pageLength; }
  skipToEnd() { this.shown = this.pageLength; }

  cps(input) {
    const s = this.speedOverride || SPEEDS[(this.services.settings && this.services.settings.textSpeed) || 'normal'] || SPEEDS.normal;
    const fast = input && (input.down && (input.down('fast') || input.down('skip')));
    return fast ? s * 4 : s;
  }

  update(dt, input) {
    this.tick(dt);
    // typewriter
    if (this.isTyping()) {
      if (this.pause > 0) this.pause -= dt;
      else {
        this.acc += dt * this.cps(input);
        while (this.acc >= 1 && this.isTyping() && this.pause <= 0) {
          this.acc -= 1;
          this.shown++;
          const ch = this.charAt(this.shown - 1);
          if (ch && ch !== ' ') {
            this.blipCount++;
            if (this.blipCount % 3 === 1) this.sfx(this.style === 'narrate' ? 'blip_low' : 'blip');
          }
          if (ch === '.' || ch === '!' || ch === '?') this.pause = 0.2;
          else if (ch === ',' || ch === ';' || ch === ':') this.pause = 0.09;
        }
      }
      this.talkT += dt;
    } else this.talkT = 0;
    // blink
    if (this.blinkLeft > 0) this.blinkLeft -= dt;
    else { this.blinkT -= dt; if (this.blinkT <= 0) { this.blinkLeft = 0.12; this.blinkT = 2.4 + Math.random() * 3; } }
    if (!input) return;
    if (input.pressed('confirm') || input.pressed('skip')) {
      if (this.isTyping()) this.skipToEnd();
      else if (this.page < this.pages.length - 1) { this.page++; this.shown = 0; this.pause = 0; this.acc = 0; this.sfx('page'); }
      else { this.sfx('confirm'); this.finish(true); }
    }
  }

  charAt(i) {
    const plain = stripMarkup(this.pages[this.page].join('')); // newline-free (lines are separate strings)
    return plain[i];
  }

  draw(ctx) {
    const b = this.box;
    drawWindow(ctx, b.x, b.y, b.w, b.h, 'dialogue');
    if (this.name) drawTab(ctx, this.name, b.x + 10, b.y - 11, 'dialogue');
    if (this.showPortrait) this.drawPortrait(ctx, b.x + 8, b.y + 9);
    const color = this.style === 'think' ? '#bcd7ff' : this.style === 'narrate' ? '#f6ecd2' : '#ffffff';
    let left = this.shown;
    const lines = this.pages[this.page];
    for (let i = 0; i < lines.length; i++) {
      const vis = visibleLength(lines[i]);
      const n = Math.min(left, vis);
      if (n > 0) drawText(ctx, lines[i], this.textX, b.y + 13 + i * LINE_H + (i ? 1 : 0), { color, shadow: THEME.navyDeep, maxChars: n });
      left -= vis;
      if (left <= 0) break;
    }
    if (!this.isTyping()) {
      const more = this.page < this.pages.length - 1;
      drawPrompt(ctx, b.x + b.w - 18, b.y + b.h - 16, this.t, more ? THEME.gold : THEME.cream);
    }
  }

  drawPortrait(ctx, x, y) {
    const S = PORTRAIT_SHEET.size;
    drawWindow(ctx, x - 2, y - 2, S + 4, S + 4, 'parchment');
    const sheet = this.sheet;
    if (sheet && sheet.canvas) {
      const col = PORTRAIT_SHEET.exprCol[this.face] ?? 0;
      let row = PORTRAIT_SHEET.rowNormal;
      if (this.blinkLeft > 0) row = PORTRAIT_SHEET.rowBlink;
      else if (this.isTyping() && this.pause <= 0 && Math.floor(this.talkT / 0.12) % 2 === 1) row = PORTRAIT_SHEET.rowTalk;
      ctx.drawImage(sheet.canvas, col * S, row * S, S, S, x, y, S, S);
    } else {
      ctx.fillStyle = '#b9a47a'; ctx.fillRect(x, y, S, S);
      ctx.fillStyle = '#8a7650'; ctx.fillRect(x + 14, y + 10, 20, 20); ctx.fillRect(x + 8, y + 32, 32, 16);
    }
  }
}

/** Vertical choice list shown above the dialogue box. options: ['text' | {text, disabled}] */
export class ChoiceBox extends Widget {
  constructor({ services, options = [], cursor = 0, cancellable = false, right = 314, bottom = 158, title = null } = {}) {
    super({ services });
    this.options = options.map((o) => (typeof o === 'string' ? { text: o } : o));
    this.cursor = Math.min(cursor, this.options.length - 1);
    this.cancellable = cancellable;
    const tw = Math.max(...this.options.map((o) => measureText(o.text)), title ? measureText(title) : 0);
    this.w = Math.min(300, tw + 30);
    this.rowH = 14;
    this.h = this.options.length * this.rowH + 10 + (title ? 12 : 0);
    this.x = right - this.w;
    this.y = bottom - this.h;
    this.title = title;
  }
  update(dt, input) {
    this.tick(dt);
    if (!input) return;
    const n = this.options.length;
    if (input.repeat('up')) { this.cursor = (this.cursor + n - 1) % n; this.sfx('cursor'); }
    if (input.repeat('down')) { this.cursor = (this.cursor + 1) % n; this.sfx('cursor'); }
    if (input.pressed('confirm')) {
      if (this.options[this.cursor].disabled) this.sfx('error');
      else { this.sfx('confirm'); this.finish(this.cursor); }
    } else if (this.cancellable && input.pressed('cancel')) { this.sfx('cancel'); this.finish(-1); }
  }
  draw(ctx) {
    drawWindow(ctx, this.x, this.y, this.w, this.h, 'menu');
    let y = this.y + 6;
    if (this.title) { drawText(ctx, this.title, this.x + 10, y, { color: THEME.gold, shadow: THEME.navyDeep }); y += 12; }
    this.options.forEach((o, i) => {
      const sel = i === this.cursor;
      if (sel) { ctx.fillStyle = 'rgba(242,184,75,0.22)'; ctx.fillRect(this.x + 4, y - 2, this.w - 8, this.rowH - 1); drawCursor(ctx, this.x + 6, y, this.t); }
      drawText(ctx, o.text, this.x + 16, y, { color: o.disabled ? '#6b7090' : sel ? THEME.gold : '#ffffff', shadow: THEME.navyDeep });
      y += this.rowH;
    });
  }
}

/** Centered message with Yes / No. result: true | false (cancel = false). */
export class ConfirmBox extends Widget {
  constructor({ services, message = 'Are you sure?', yes = 'Yes', no = 'No', defaultYes = false } = {}) {
    super({ services });
    this.lines = wrapText(message, 190);
    this.yes = yes; this.no = no;
    this.cursor = defaultYes ? 0 : 1;
    this.w = 214;
    this.h = this.lines.length * LINE_H + 42;
    this.x = Math.round((320 - this.w) / 2);
    this.y = Math.round((240 - this.h) / 2) - 10;
  }
  update(dt, input) {
    this.tick(dt);
    if (!input) return;
    if (input.repeat('left') || input.repeat('right') || input.repeat('up') || input.repeat('down')) { this.cursor = 1 - this.cursor; this.sfx('cursor'); }
    if (input.pressed('confirm')) { this.sfx(this.cursor === 0 ? 'confirm' : 'cancel'); this.finish(this.cursor === 0); }
    else if (input.pressed('cancel')) { this.sfx('cancel'); this.finish(false); }
  }
  draw(ctx) {
    drawWindow(ctx, this.x, this.y, this.w, this.h, 'menu');
    this.lines.forEach((l, i) => drawText(ctx, l, this.x + 12, this.y + 10 + i * LINE_H, { color: '#ffffff', shadow: THEME.navyDeep }));
    const by = this.y + this.h - 20;
    [this.yes, this.no].forEach((label, i) => {
      const bx = this.x + 34 + i * 84, sel = this.cursor === i;
      if (sel) { ctx.fillStyle = 'rgba(242,184,75,0.25)'; ctx.fillRect(bx - 8, by - 3, 62, 14); drawCursor(ctx, bx - 6, by - 1, this.t); }
      drawText(ctx, label, bx + 6, by, { color: sel ? THEME.gold : '#ffffff', shadow: THEME.navyDeep });
    });
  }
}

/** Quantity picker. result: number | null. unitPrice adds a "Total" line. */
export class NumberPicker extends Widget {
  constructor({ services, label = 'How many?', min = 1, max = 99, value = 1, step = 1, unitPrice = null, currency = '$', x = null, y = null } = {}) {
    super({ services });
    Object.assign(this, { label, min, max, value: Math.max(min, Math.min(max, value)), step, unitPrice, currency });
    this.w = 150; this.h = unitPrice !== null ? 62 : 48;
    this.x = x ?? Math.round((320 - this.w) / 2);
    this.y = y ?? Math.round((240 - this.h) / 2);
  }
  adjust(d) {
    const v = Math.max(this.min, Math.min(this.max, this.value + d));
    if (v !== this.value) { this.value = v; this.sfx('cursor'); }
  }
  update(dt, input) {
    this.tick(dt);
    if (!input) return;
    if (input.repeat('left')) this.adjust(-this.step);
    if (input.repeat('right')) this.adjust(this.step);
    if (input.repeat('up')) this.adjust(this.step * 5);
    if (input.repeat('down')) this.adjust(-this.step * 5);
    if (input.pressed('confirm')) { this.sfx('confirm'); this.finish(this.value); }
    else if (input.pressed('cancel')) { this.sfx('cancel'); this.finish(null); }
  }
  draw(ctx) {
    drawWindow(ctx, this.x, this.y, this.w, this.h, 'menu');
    drawText(ctx, this.label, this.x + 10, this.y + 8, { color: THEME.gold, shadow: THEME.navyDeep });
    const txt = `◄  ${this.value}  ►`;
    drawText(ctx, txt, this.x + this.w / 2, this.y + 22, { color: '#ffffff', shadow: THEME.navyDeep, align: 'center' });
    if (this.unitPrice !== null) drawText(ctx, `Total  ${this.currency}${this.value * this.unitPrice}`, this.x + this.w / 2, this.y + 40, { color: THEME.cream, shadow: THEME.navyDeep, align: 'center' });
  }
}

void charAdvance; void textColorFor; void shadowFor;
